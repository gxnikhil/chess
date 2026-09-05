const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// ---- In-memory game state ----
const activeGames = new Map();
const matchmakingQueues = new Map(); // format -> [{socketId, userId, rating}]
const playerSockets = new Map(); // userId -> socketId
const socketPlayers = new Map(); // socketId -> userId

function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function classifyTimeControl(base, inc) {
  const total = base + inc * 40;
  if (total < 180) return 'bullet';
  if (total < 600) return 'blitz';
  if (total < 1800) return 'rapid';
  return 'classical';
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // Set COOP/COEP headers for SharedArrayBuffer (Stockfish WASM)
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    handler(req, res);
  });

  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // ---- Socket.IO Event Handlers ----
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ---- Auth ----
    socket.on('register', (userId) => {
      playerSockets.set(userId, socket.id);
      socketPlayers.set(socket.id, userId);
      console.log(`[Socket] User registered: ${userId}`);
    });

    // ---- Matchmaking ----
    socket.on('find-game', (data) => {
      const { userId, timeControl, increment, rated, rating } = data;
      const format = classifyTimeControl(timeControl, increment);
      const queueKey = `${format}-${timeControl}-${increment}-${rated ? 'rated' : 'casual'}`;

      if (!matchmakingQueues.has(queueKey)) {
        matchmakingQueues.set(queueKey, []);
      }

      const queue = matchmakingQueues.get(queueKey);

      // Check for a match
      let matched = null;
      let matchIndex = -1;
      const ratingRange = 200 + (queue.length > 3 ? 200 : 0); // Expand after waiting

      for (let i = 0; i < queue.length; i++) {
        const candidate = queue[i];
        if (candidate.userId !== userId && Math.abs(candidate.rating - rating) <= ratingRange) {
          matched = candidate;
          matchIndex = i;
          break;
        }
      }

      if (matched) {
        queue.splice(matchIndex, 1);

        // Create game
        const gameId = generateId();
        const isWhiteRandom = Math.random() < 0.5;
        const whiteId = isWhiteRandom ? userId : matched.userId;
        const blackId = isWhiteRandom ? matched.userId : userId;

        const game = {
          id: gameId,
          chess: new Chess(),
          whiteId,
          blackId,
          whiteTime: timeControl * 1000,
          blackTime: timeControl * 1000,
          increment,
          format,
          rated,
          status: 'active',
          result: null,
          terminationReason: null,
          moves: [],
          lastMoveTime: Date.now(),
          drawOffer: null,
          startedAt: Date.now(),
          whiteRating: isWhiteRandom ? rating : matched.rating,
          blackRating: isWhiteRandom ? matched.rating : rating,
        };

        activeGames.set(gameId, game);

        // Join room
        const whiteSocket = playerSockets.get(whiteId);
        const blackSocket = playerSockets.get(blackId);

        if (whiteSocket) io.sockets.sockets.get(whiteSocket)?.join(gameId);
        if (blackSocket) io.sockets.sockets.get(blackSocket)?.join(gameId);

        const gameData = {
          gameId,
          whiteId,
          blackId,
          timeControl,
          increment,
          format,
          rated,
          whiteRating: game.whiteRating,
          blackRating: game.blackRating,
        };

        io.to(gameId).emit('game-matched', gameData);
        console.log(`[Game] Created: ${gameId} (${whiteId} vs ${blackId})`);
      } else {
        // Add to queue
        queue.push({ socketId: socket.id, userId, rating, timestamp: Date.now() });
        socket.emit('searching', { queueKey, position: queue.length });
      }
    });

    socket.on('cancel-search', (userId) => {
      for (const [key, queue] of matchmakingQueues.entries()) {
        const idx = queue.findIndex(p => p.userId === userId);
        if (idx !== -1) {
          queue.splice(idx, 1);
          break;
        }
      }
      socket.emit('search-cancelled');
    });

    // ---- Join Game ----
    socket.on('join-game', (gameId) => {
      const game = activeGames.get(gameId);
      if (game) {
        socket.join(gameId);
        socket.emit('game-state', {
          gameId: game.id,
          fen: game.chess.fen(),
          whiteId: game.whiteId,
          blackId: game.blackId,
          whiteTime: game.whiteTime,
          blackTime: game.blackTime,
          increment: game.increment,
          format: game.format,
          rated: game.rated,
          status: game.status,
          result: game.result,
          moves: game.moves,
          turn: game.chess.turn(),
          isCheck: game.chess.isCheck(),
          whiteRating: game.whiteRating,
          blackRating: game.blackRating,
        });
      }
    });

    // ---- Make Move ----
    socket.on('make-move', (data) => {
      const { gameId, userId, move } = data;
      const game = activeGames.get(gameId);
      if (!game || game.status !== 'active') return;

      const isWhiteTurn = game.chess.turn() === 'w';
      const currentPlayerId = isWhiteTurn ? game.whiteId : game.blackId;
      if (userId !== currentPlayerId) return;

      // Calculate time
      const now = Date.now();
      const timeSpent = now - game.lastMoveTime;

      if (isWhiteTurn) {
        game.whiteTime -= timeSpent;
        if (game.whiteTime <= 0) {
          game.whiteTime = 0;
          game.status = 'completed';
          game.result = 'black';
          game.terminationReason = 'timeout';
          io.to(gameId).emit('game-over', { result: 'black', reason: 'timeout', whiteTime: 0, blackTime: game.blackTime });
          return;
        }
        game.whiteTime += game.increment * 1000;
      } else {
        game.blackTime -= timeSpent;
        if (game.blackTime <= 0) {
          game.blackTime = 0;
          game.status = 'completed';
          game.result = 'white';
          game.terminationReason = 'timeout';
          io.to(gameId).emit('game-over', { result: 'white', reason: 'timeout', whiteTime: game.whiteTime, blackTime: 0 });
          return;
        }
        game.blackTime += game.increment * 1000;
      }

      // Validate and make move
      let madeMove;
      try {
        madeMove = game.chess.move(move);
        if (!madeMove) {
          socket.emit('invalid-move', { error: 'Illegal move' });
          return;
        }
      } catch {
        socket.emit('invalid-move', { error: 'Illegal move' });
        return;
      }

      // Record move
      game.moves.push({
        moveNumber: game.moves.length,
        san: madeMove.san,
        from: madeMove.from,
        to: madeMove.to,
        fen: game.chess.fen(),
        timeSpent,
        timeLeft: isWhiteTurn ? game.whiteTime : game.blackTime,
      });
      game.lastMoveTime = now;
      game.drawOffer = null;

      // Check game end
      let gameOver = false;
      if (game.chess.isCheckmate()) {
        game.status = 'completed';
        game.result = isWhiteTurn ? 'white' : 'black';
        game.terminationReason = 'checkmate';
        gameOver = true;
      } else if (game.chess.isStalemate()) {
        game.status = 'completed';
        game.result = 'draw';
        game.terminationReason = 'stalemate';
        gameOver = true;
      } else if (game.chess.isThreefoldRepetition()) {
        game.status = 'completed';
        game.result = 'draw';
        game.terminationReason = 'repetition';
        gameOver = true;
      } else if (game.chess.isDraw()) {
        game.status = 'completed';
        game.result = 'draw';
        game.terminationReason = game.chess.isInsufficientMaterial() ? 'insufficient' : 'fifty_move';
        gameOver = true;
      }

      // Broadcast move
      io.to(gameId).emit('move-made', {
        move: { san: madeMove.san, from: madeMove.from, to: madeMove.to },
        fen: game.chess.fen(),
        whiteTime: game.whiteTime,
        blackTime: game.blackTime,
        turn: game.chess.turn(),
        isCheck: game.chess.isCheck(),
        moveNumber: game.moves.length,
      });

      if (gameOver) {
        io.to(gameId).emit('game-over', {
          result: game.result,
          reason: game.terminationReason,
          whiteTime: game.whiteTime,
          blackTime: game.blackTime,
        });
      }
    });

    // ---- Resign ----
    socket.on('resign', (data) => {
      const { gameId, userId } = data;
      const game = activeGames.get(gameId);
      if (!game || game.status !== 'active') return;

      game.status = 'completed';
      game.result = userId === game.whiteId ? 'black' : 'white';
      game.terminationReason = 'resignation';

      io.to(gameId).emit('game-over', {
        result: game.result,
        reason: 'resignation',
        whiteTime: game.whiteTime,
        blackTime: game.blackTime,
      });
    });

    // ---- Draw ----
    socket.on('offer-draw', (data) => {
      const { gameId, userId } = data;
      const game = activeGames.get(gameId);
      if (!game || game.status !== 'active') return;

      game.drawOffer = userId;
      const opponentId = userId === game.whiteId ? game.blackId : game.whiteId;
      const opponentSocket = playerSockets.get(opponentId);
      if (opponentSocket) {
        io.to(opponentSocket).emit('draw-offered', { gameId, from: userId });
      }
    });

    socket.on('accept-draw', (data) => {
      const { gameId, userId } = data;
      const game = activeGames.get(gameId);
      if (!game || game.status !== 'active' || !game.drawOffer || game.drawOffer === userId) return;

      game.status = 'completed';
      game.result = 'draw';
      game.terminationReason = 'agreement';

      io.to(gameId).emit('game-over', {
        result: 'draw',
        reason: 'agreement',
        whiteTime: game.whiteTime,
        blackTime: game.blackTime,
      });
    });

    socket.on('decline-draw', (data) => {
      const { gameId, userId } = data;
      const game = activeGames.get(gameId);
      if (!game) return;

      game.drawOffer = null;
      const offerId = userId === game.whiteId ? game.blackId : game.whiteId;
      const offerSocket = playerSockets.get(offerId);
      if (offerSocket) {
        io.to(offerSocket).emit('draw-declined', { gameId });
      }
    });

    // ---- Bot Game ----
    socket.on('create-bot-game', (data) => {
      const { userId, timeControl, increment, botDifficulty, botPersonality, color, rating } = data;
      const gameId = generateId();
      const botId = `bot-${botDifficulty}`;
      const format = classifyTimeControl(timeControl, increment);

      const botRatings = {
        beginner: 600, intermediate: 1000, advanced: 1400,
        expert: 1800, master: 2200, grandmaster: 2500,
      };
      const botRating = botRatings[botDifficulty] || 1500;

      let whiteId, blackId;
      if (color === 'white') {
        whiteId = userId;
        blackId = botId;
      } else if (color === 'black') {
        whiteId = botId;
        blackId = userId;
      } else {
        if (Math.random() < 0.5) {
          whiteId = userId;
          blackId = botId;
        } else {
          whiteId = botId;
          blackId = userId;
        }
      }

      const game = {
        id: gameId,
        chess: new Chess(),
        whiteId,
        blackId,
        whiteTime: timeControl * 1000,
        blackTime: timeControl * 1000,
        increment,
        format,
        rated: false,
        status: 'active',
        result: null,
        terminationReason: null,
        moves: [],
        lastMoveTime: Date.now(),
        drawOffer: null,
        startedAt: Date.now(),
        isBotGame: true,
        botDifficulty,
        botPersonality,
        whiteRating: whiteId === userId ? rating : botRating,
        blackRating: blackId === userId ? rating : botRating,
      };

      activeGames.set(gameId, game);
      socket.join(gameId);

      socket.emit('bot-game-created', {
        gameId,
        whiteId,
        blackId,
        timeControl,
        increment,
        format,
        whiteRating: game.whiteRating,
        blackRating: game.blackRating,
        botDifficulty,
        botPersonality,
      });

      // If bot plays white, make first move after short delay
      if (whiteId === botId) {
        setTimeout(() => {
          makeBotMove(gameId, io);
        }, 1000);
      }
    });

    // ---- Chat ----
    socket.on('chat-message', (data) => {
      const { gameId, userId, message } = data;
      io.to(gameId).emit('chat-message', {
        userId,
        message: message.slice(0, 200), // Limit message length
        timestamp: Date.now(),
      });
    });

    // ---- Disconnect ----
    socket.on('disconnect', () => {
      const userId = socketPlayers.get(socket.id);
      if (userId) {
        playerSockets.delete(userId);
        socketPlayers.delete(socket.id);

        // Remove from matchmaking queues
        for (const [key, queue] of matchmakingQueues.entries()) {
          const idx = queue.findIndex(p => p.userId === userId);
          if (idx !== -1) queue.splice(idx, 1);
        }
      }
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  // ---- Bot Move Logic ----
  function makeBotMove(gameId, io) {
    const game = activeGames.get(gameId);
    if (!game || game.status !== 'active') return;

    const isWhiteTurn = game.chess.turn() === 'w';
    const botId = game.whiteId.startsWith('bot-') ? game.whiteId : game.blackId;
    const currentPlayerId = isWhiteTurn ? game.whiteId : game.blackId;

    if (currentPlayerId !== botId) return;

    const moves = game.chess.moves({ verbose: true });
    if (moves.length === 0) return;

    // Simple bot logic based on difficulty
    const difficultyLevels = {
      beginner: { randomChance: 0.7, depthLookAhead: 1 },
      intermediate: { randomChance: 0.5, depthLookAhead: 1 },
      advanced: { randomChance: 0.3, depthLookAhead: 2 },
      expert: { randomChance: 0.15, depthLookAhead: 2 },
      master: { randomChance: 0.05, depthLookAhead: 3 },
      grandmaster: { randomChance: 0.02, depthLookAhead: 3 },
    };

    const settings = difficultyLevels[game.botDifficulty] || difficultyLevels.intermediate;
    let selectedMove;

    if (Math.random() < settings.randomChance) {
      // Random move with some preference for captures
      const captures = moves.filter(m => m.captured);
      if (captures.length > 0 && Math.random() < 0.6) {
        selectedMove = captures[Math.floor(Math.random() * captures.length)];
      } else {
        selectedMove = moves[Math.floor(Math.random() * moves.length)];
      }
    } else {
      // Simple evaluation-based move selection
      selectedMove = getBestMove(game.chess, moves, settings.depthLookAhead);
    }

    // Simulate thinking time
    const thinkTime = Math.min(
      Math.floor(Math.random() * 3000) + 500,
      game.botDifficulty === 'beginner' ? 1000 : 5000
    );

    setTimeout(() => {
      const g = activeGames.get(gameId);
      if (!g || g.status !== 'active') return;

      const now = Date.now();
      const timeSpent = now - g.lastMoveTime;

      if (isWhiteTurn) {
        g.whiteTime -= timeSpent;
        if (g.whiteTime <= 0) {
          g.status = 'completed';
          g.result = 'black';
          g.terminationReason = 'timeout';
          io.to(gameId).emit('game-over', { result: 'black', reason: 'timeout' });
          return;
        }
        g.whiteTime += g.increment * 1000;
      } else {
        g.blackTime -= timeSpent;
        if (g.blackTime <= 0) {
          g.status = 'completed';
          g.result = 'white';
          g.terminationReason = 'timeout';
          io.to(gameId).emit('game-over', { result: 'white', reason: 'timeout' });
          return;
        }
        g.blackTime += g.increment * 1000;
      }

      let madeMove;
      try {
        madeMove = g.chess.move({ from: selectedMove.from, to: selectedMove.to, promotion: selectedMove.promotion });
      } catch {
        return;
      }

      if (!madeMove) return;

      g.moves.push({
        moveNumber: g.moves.length,
        san: madeMove.san,
        from: madeMove.from,
        to: madeMove.to,
        fen: g.chess.fen(),
        timeSpent,
        timeLeft: isWhiteTurn ? g.whiteTime : g.blackTime,
      });
      g.lastMoveTime = Date.now();

      let gameOver = false;
      if (g.chess.isCheckmate()) {
        g.status = 'completed';
        g.result = isWhiteTurn ? 'white' : 'black';
        g.terminationReason = 'checkmate';
        gameOver = true;
      } else if (g.chess.isStalemate() || g.chess.isDraw()) {
        g.status = 'completed';
        g.result = 'draw';
        g.terminationReason = g.chess.isStalemate() ? 'stalemate' : 'draw';
        gameOver = true;
      }

      io.to(gameId).emit('move-made', {
        move: { san: madeMove.san, from: madeMove.from, to: madeMove.to },
        fen: g.chess.fen(),
        whiteTime: g.whiteTime,
        blackTime: g.blackTime,
        turn: g.chess.turn(),
        isCheck: g.chess.isCheck(),
        moveNumber: g.moves.length,
      });

      if (gameOver) {
        io.to(gameId).emit('game-over', {
          result: g.result,
          reason: g.terminationReason,
        });
      } else {
        // Check if it's still bot's turn (shouldn't be, but just in case)
        const nextPlayer = g.chess.turn() === 'w' ? g.whiteId : g.blackId;
        if (nextPlayer === botId) {
          makeBotMove(gameId, io);
        }
      }
    }, thinkTime);
  }

  // Simple minimax evaluation for bot moves
  function getBestMove(chess, moves, depth) {
    let bestScore = -Infinity;
    let bestMove = moves[0];

    for (const move of moves) {
      const testChess = new Chess(chess.fen());
      testChess.move(move);

      let score = -evaluatePosition(testChess);

      if (depth > 1 && !testChess.isGameOver()) {
        const opponentMoves = testChess.moves({ verbose: true });
        let worstOpponent = Infinity;
        for (const oMove of opponentMoves.slice(0, 10)) {
          const testChess2 = new Chess(testChess.fen());
          testChess2.move(oMove);
          worstOpponent = Math.min(worstOpponent, evaluatePosition(testChess2));
        }
        score = worstOpponent;
      }

      // Add checkmate bonus
      if (testChess.isCheckmate()) score = 10000;
      if (testChess.isCheck()) score += 50;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  function evaluatePosition(chess) {
    if (chess.isCheckmate()) return chess.turn() === 'w' ? -10000 : 10000;
    if (chess.isDraw()) return 0;

    const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
    let score = 0;
    const board = chess.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const value = pieceValues[piece.type] || 0;
          score += piece.color === 'w' ? value : -value;
        }
      }
    }

    // Mobility bonus
    const mobility = chess.moves().length;
    score += chess.turn() === 'w' ? mobility * 5 : -mobility * 5;

    return score;
  }

  // ---- Clock Ticker ----
  setInterval(() => {
    for (const [gameId, game] of activeGames.entries()) {
      if (game.status !== 'active') continue;

      const now = Date.now();
      const elapsed = now - game.lastMoveTime;
      const isWhiteTurn = game.chess.turn() === 'w';

      if (isWhiteTurn && game.whiteTime - elapsed <= 0) {
        game.whiteTime = 0;
        game.status = 'completed';
        game.result = 'black';
        game.terminationReason = 'timeout';
        io.to(gameId).emit('game-over', { result: 'black', reason: 'timeout', whiteTime: 0, blackTime: game.blackTime });
      } else if (!isWhiteTurn && game.blackTime - elapsed <= 0) {
        game.blackTime = 0;
        game.status = 'completed';
        game.result = 'white';
        game.terminationReason = 'timeout';
        io.to(gameId).emit('game-over', { result: 'white', reason: 'timeout', whiteTime: game.whiteTime, blackTime: 0 });
      }
    }
  }, 1000);

  // ---- Cleanup completed games ----
  setInterval(() => {
    for (const [gameId, game] of activeGames.entries()) {
      if (game.status === 'completed') {
        const age = Date.now() - (game.startedAt || 0);
        if (age > 30 * 60 * 1000) { // 30 minutes after start
          activeGames.delete(gameId);
        }
      }
    }
  }, 60000);

  httpServer.listen(port, () => {
    console.log(`\n  ♔ ChessMaster running at http://${hostname}:${port}\n`);
  });
});
