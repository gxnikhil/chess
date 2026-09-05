import { Chess, Move } from 'chess.js';

export interface GameState {
  id: string;
  chess: Chess;
  whiteId: string;
  blackId: string;
  whiteTime: number; // ms remaining
  blackTime: number;
  increment: number; // seconds
  format: string;
  rated: boolean;
  status: 'waiting' | 'active' | 'completed';
  result: string | null;
  terminationReason: string | null;
  moves: MoveRecord[];
  lastMoveTime: number; // timestamp
  drawOffer: string | null; // player ID who offered
  isBotGame: boolean;
  botDifficulty: string | null;
  botPersonality: string | null;
  startedAt: number | null;
}

export interface MoveRecord {
  moveNumber: number;
  san: string;
  from: string;
  to: string;
  fen: string;
  timeSpent: number;
  timeLeft: number;
}

// In-memory store for active games
const activeGames = new Map<string, GameState>();

export function createGame(params: {
  id: string;
  whiteId: string;
  blackId: string;
  timeControl: number; // seconds
  increment: number;
  format: string;
  rated: boolean;
  isBotGame?: boolean;
  botDifficulty?: string;
  botPersonality?: string;
}): GameState {
  const game: GameState = {
    id: params.id,
    chess: new Chess(),
    whiteId: params.whiteId,
    blackId: params.blackId,
    whiteTime: params.timeControl * 1000,
    blackTime: params.timeControl * 1000,
    increment: params.increment,
    format: params.format,
    rated: params.rated,
    status: 'active',
    result: null,
    terminationReason: null,
    moves: [],
    lastMoveTime: Date.now(),
    drawOffer: null,
    isBotGame: params.isBotGame || false,
    botDifficulty: params.botDifficulty || null,
    botPersonality: params.botPersonality || null,
    startedAt: Date.now(),
  };

  activeGames.set(params.id, game);
  return game;
}

export function getGame(gameId: string): GameState | undefined {
  return activeGames.get(gameId);
}

export function removeGame(gameId: string): void {
  activeGames.delete(gameId);
}

export function getAllActiveGames(): Map<string, GameState> {
  return activeGames;
}

export function makeMove(gameId: string, playerId: string, move: { from: string; to: string; promotion?: string }): {
  success: boolean;
  error?: string;
  move?: Move;
  gameState?: GameState;
} {
  const game = activeGames.get(gameId);
  if (!game) return { success: false, error: 'Game not found' };
  if (game.status !== 'active') return { success: false, error: 'Game is not active' };

  // Verify it's the correct player's turn
  const isWhiteTurn = game.chess.turn() === 'w';
  const currentPlayerId = isWhiteTurn ? game.whiteId : game.blackId;
  if (playerId !== currentPlayerId) {
    return { success: false, error: 'Not your turn' };
  }

  // Calculate time spent
  const now = Date.now();
  const timeSpent = now - game.lastMoveTime;

  // Deduct time
  if (isWhiteTurn) {
    game.whiteTime -= timeSpent;
    if (game.whiteTime <= 0) {
      game.whiteTime = 0;
      game.status = 'completed';
      game.result = 'black';
      game.terminationReason = 'timeout';
      return { success: true, gameState: game };
    }
    // Add increment
    game.whiteTime += game.increment * 1000;
  } else {
    game.blackTime -= timeSpent;
    if (game.blackTime <= 0) {
      game.blackTime = 0;
      game.status = 'completed';
      game.result = 'white';
      game.terminationReason = 'timeout';
      return { success: true, gameState: game };
    }
    game.blackTime += game.increment * 1000;
  }

  // Try to make the move
  let madeMove: Move;
  try {
    const result = game.chess.move(move);
    if (!result) return { success: false, error: 'Illegal move' };
    madeMove = result;
  } catch {
    return { success: false, error: 'Illegal move' };
  }

  // Record the move
  const moveRecord: MoveRecord = {
    moveNumber: game.moves.length,
    san: madeMove.san,
    from: madeMove.from,
    to: madeMove.to,
    fen: game.chess.fen(),
    timeSpent,
    timeLeft: isWhiteTurn ? game.whiteTime : game.blackTime,
  };
  game.moves.push(moveRecord);
  game.lastMoveTime = now;

  // Clear draw offer on move
  game.drawOffer = null;

  // Check game end conditions
  if (game.chess.isCheckmate()) {
    game.status = 'completed';
    game.result = isWhiteTurn ? 'white' : 'black';
    game.terminationReason = 'checkmate';
  } else if (game.chess.isStalemate()) {
    game.status = 'completed';
    game.result = 'draw';
    game.terminationReason = 'stalemate';
  } else if (game.chess.isThreefoldRepetition()) {
    game.status = 'completed';
    game.result = 'draw';
    game.terminationReason = 'repetition';
  } else if (game.chess.isDraw()) {
    game.status = 'completed';
    game.result = 'draw';
    game.terminationReason = game.chess.isInsufficientMaterial() ? 'insufficient' : 'fifty_move';
  }

  return { success: true, move: madeMove, gameState: game };
}

export function resignGame(gameId: string, playerId: string): GameState | null {
  const game = activeGames.get(gameId);
  if (!game || game.status !== 'active') return null;

  game.status = 'completed';
  game.result = playerId === game.whiteId ? 'black' : 'white';
  game.terminationReason = 'resignation';
  return game;
}

export function offerDraw(gameId: string, playerId: string): { success: boolean; error?: string } {
  const game = activeGames.get(gameId);
  if (!game || game.status !== 'active') return { success: false, error: 'Game not active' };

  game.drawOffer = playerId;
  return { success: true };
}

export function acceptDraw(gameId: string, playerId: string): GameState | null {
  const game = activeGames.get(gameId);
  if (!game || game.status !== 'active') return null;
  if (!game.drawOffer || game.drawOffer === playerId) return null;

  game.status = 'completed';
  game.result = 'draw';
  game.terminationReason = 'agreement';
  return game;
}

export function checkTimeout(gameId: string): GameState | null {
  const game = activeGames.get(gameId);
  if (!game || game.status !== 'active') return null;

  const now = Date.now();
  const elapsed = now - game.lastMoveTime;
  const isWhiteTurn = game.chess.turn() === 'w';

  if (isWhiteTurn) {
    if (game.whiteTime - elapsed <= 0) {
      game.whiteTime = 0;
      game.status = 'completed';
      game.result = 'black';
      game.terminationReason = 'timeout';
      return game;
    }
  } else {
    if (game.blackTime - elapsed <= 0) {
      game.blackTime = 0;
      game.status = 'completed';
      game.result = 'white';
      game.terminationReason = 'timeout';
      return game;
    }
  }

  return null;
}

export function getGamePgn(game: GameState): string {
  return game.chess.pgn();
}

export function getGameFen(game: GameState): string {
  return game.chess.fen();
}

// Detect opening from move sequence
const COMMON_OPENINGS: Record<string, { name: string; eco: string }> = {
  'e4 e5 Nf3 Nc6 Bb5': { name: 'Ruy Lopez', eco: 'C60' },
  'e4 e5 Nf3 Nc6 Bc4': { name: 'Italian Game', eco: 'C50' },
  'e4 e5 Nf3 Nc6 d4': { name: 'Scotch Game', eco: 'C45' },
  'e4 e5 Nf3 Nf6': { name: 'Petrov Defense', eco: 'C42' },
  'd4 d5 c4': { name: 'Queen\'s Gambit', eco: 'D06' },
  'd4 d5 c4 e6': { name: 'Queen\'s Gambit Declined', eco: 'D30' },
  'd4 d5 c4 dxc4': { name: 'Queen\'s Gambit Accepted', eco: 'D20' },
  'd4 Nf6 c4 g6': { name: 'King\'s Indian Defense', eco: 'E60' },
  'd4 Nf6 c4 e6': { name: 'Nimzo-Indian Defense', eco: 'E20' },
  'e4 c5': { name: 'Sicilian Defense', eco: 'B20' },
  'e4 c5 Nf3 d6': { name: 'Sicilian Najdorf', eco: 'B90' },
  'e4 e6': { name: 'French Defense', eco: 'C00' },
  'e4 c6': { name: 'Caro-Kann Defense', eco: 'B10' },
  'e4 d5': { name: "Scandinavian Defense", eco: 'B01' },
  'e4 e5': { name: 'Open Game', eco: 'C20' },
  'd4 d5': { name: 'Closed Game', eco: 'D00' },
  'Nf3': { name: 'Reti Opening', eco: 'A04' },
  'c4': { name: 'English Opening', eco: 'A10' },
  'e4': { name: 'King\'s Pawn Opening', eco: 'B00' },
  'd4': { name: 'Queen\'s Pawn Opening', eco: 'A40' },
};

export function detectOpening(moves: MoveRecord[]): { name: string; eco: string } | null {
  const moveSequence = moves.map(m => m.san);
  // Try longest match first
  for (let len = Math.min(moveSequence.length, 6); len >= 1; len--) {
    const key = moveSequence.slice(0, len).join(' ');
    if (COMMON_OPENINGS[key]) {
      return COMMON_OPENINGS[key];
    }
  }
  return null;
}

export function evaluatePosition(chess: Chess): number {
  if (chess.isCheckmate()) return chess.turn() === 'w' ? -10000 : 10000;
  if (chess.isDraw()) return 0;

  const pieceValues: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
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

  const mobility = chess.moves().length;
  score += chess.turn() === 'w' ? mobility * 5 : -mobility * 5;

  return score;
}

export function getBestMove(chess: Chess, depth: number = 2): Move | null {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  let bestScore = -Infinity;
  let bestMove = moves[0];

  for (const move of moves) {
    const testChess = new Chess(chess.fen());
    testChess.move(move);

    let score = -evaluatePosition(testChess);

    if (depth > 1 && !testChess.isGameOver()) {
      const opponentMoves = testChess.moves({ verbose: true });
      let worstOpponent = Infinity;
      for (const oMove of opponentMoves.slice(0, 8)) {
        const testChess2 = new Chess(testChess.fen());
        testChess2.move(oMove);
        worstOpponent = Math.min(worstOpponent, evaluatePosition(testChess2));
      }
      score = worstOpponent;
    }

    if (testChess.isCheckmate()) score = 10000;
    if (testChess.isCheck()) score += 50;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

