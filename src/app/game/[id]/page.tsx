'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Chess } from 'chess.js';
import Chessboard from '@/components/ChessBoard';
import { useGameSocket, useSocket } from '@/lib/socket/client';
import { formatTimeMs, cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';

function GameClock({ time, active, isLow }: { time: number; active: boolean; isLow: boolean }) {
  return (
    <div className={cn('game-clock', active && 'game-clock-active', isLow && 'game-clock-low')}>
      <span className="game-clock-time">{formatTimeMs(Math.max(0, time))}</span>
    </div>
  );
}

function MoveList({ moves, currentMove, onMoveClick }: { moves: any[]; currentMove: number; onMoveClick: (i: number) => void }) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [moves.length]);

  const pairs: { number: number; white: any; black: any }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1] || null,
    });
  }

  return (
    <div className="move-list" ref={listRef}>
      {pairs.length === 0 && (
        <div className="move-list-empty">Moves will appear here</div>
      )}
      {pairs.map((pair, idx) => (
        <div key={idx} className="move-list-row">
          <span className="move-number">{pair.number}.</span>
          <button
            className={cn('move-btn', currentMove === idx * 2 && 'move-btn-active')}
            onClick={() => onMoveClick(idx * 2)}
          >
            {pair.white?.san}
          </button>
          {pair.black && (
            <button
              className={cn('move-btn', currentMove === idx * 2 + 1 && 'move-btn-active')}
              onClick={() => onMoveClick(idx * 2 + 1)}
            >
              {pair.black.san}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const { data: session } = useSession();
  const { addToast } = useToast();
  const userId = (session?.user as any)?.id || '';

  const { socket, connected, gameState, moves, makeMove, resign, offerDraw, acceptDraw } = useGameSocket(gameId);

  const [localGame, setLocalGame] = useState(new Chess());
  const [boardWidth, setBoardWidth] = useState(560);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [whiteTime, setWhiteTime] = useState(600000);
  const [blackTime, setBlackTime] = useState(600000);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [drawOffered, setDrawOffered] = useState(false);
  const [gameOverData, setGameOverData] = useState<any>(null);

  const lastMoveRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Register user with socket
  useEffect(() => {
    if (connected && userId) {
      socket.emit('register', userId);
    }
  }, [connected, userId, socket]);

  // Board sizing
  useEffect(() => {
    const updateSize = () => {
      const maxW = Math.min(window.innerWidth - 400, window.innerHeight - 200, 640);
      const mobileW = window.innerWidth - 32;
      setBoardWidth(window.innerWidth > 900 ? Math.max(360, maxW) : Math.max(280, mobileW));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Sync with game state
  useEffect(() => {
    if (gameState) {
      try {
        const g = new Chess(gameState.fen);
        setLocalGame(g);
      } catch { }
      setWhiteTime(gameState.whiteTime);
      setBlackTime(gameState.blackTime);
      lastMoveRef.current = Date.now();

      // Set orientation
      if (userId === gameState.blackId) {
        setOrientation('black');
      } else {
        setOrientation('white');
      }

      if (gameState.status === 'completed') {
        setGameOverData({
          result: gameState.result,
          reason: gameState.terminationReason,
        });
      }
    }
  }, [gameState, userId]);

  // Local clock ticker
  useEffect(() => {
    if (!gameState || gameState.status !== 'active') return;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastMoveRef.current;
      const isWhiteTurn = localGame.turn() === 'w';

      if (isWhiteTurn) {
        setWhiteTime(Math.max(0, gameState.whiteTime - elapsed));
      } else {
        setBlackTime(Math.max(0, gameState.blackTime - elapsed));
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, localGame]);

  // Draw offer listener
  useEffect(() => {
    if (!connected) return;
    
    function onDrawOffer() {
      setDrawOffered(true);
      addToast({ type: 'info', message: 'Opponent offers a draw' });
    }

    function onDrawDeclined() {
      addToast({ type: 'info', message: 'Draw offer declined' });
    }

    socket.on('draw-offered', onDrawOffer);
    socket.on('draw-declined', onDrawDeclined);

    return () => {
      socket.off('draw-offered', onDrawOffer);
      socket.off('draw-declined', onDrawDeclined);
    };
  }, [connected, socket, addToast]);

  // Game over listener
  useEffect(() => {
    if (!connected) return;

    function onGameOver(data: any) {
      setGameOverData(data);
      const isWin = (userId === gameState?.whiteId && data.result === 'white') ||
                    (userId === gameState?.blackId && data.result === 'black');
      const isDraw = data.result === 'draw';

      if (isWin) {
        addToast({ type: 'success', message: 'Victory! 🎉' });
      } else if (isDraw) {
        addToast({ type: 'info', message: 'Game drawn' });
      } else {
        addToast({ type: 'info', message: 'Defeat' });
      }
    }

    socket.on('game-over', onGameOver);
    return () => { socket.off('game-over', onGameOver); };
  }, [connected, socket, userId, gameState, addToast]);

  const onDrop = useCallback((sourceSquare: string, targetSquare: string, piece: string) => {
    if (!gameState || gameState.status !== 'active') return false;

    const isWhiteTurn = localGame.turn() === 'w';
    const currentPlayerId = isWhiteTurn ? gameState.whiteId : gameState.blackId;
    if (userId !== currentPlayerId) return false;

    // Check for promotion
    const isPromotion = piece[1] === 'P' && (targetSquare[1] === '8' || targetSquare[1] === '1');
    const promotion = isPromotion ? 'q' : undefined;

    // Try move locally first for instant feedback
    try {
      const testGame = new Chess(localGame.fen());
      const result = testGame.move({ from: sourceSquare, to: targetSquare, promotion });
      if (!result) return false;

      setLocalGame(testGame);
      setCurrentMoveIndex(-1);

      // Send to server
      makeMove(userId, { from: sourceSquare, to: targetSquare, promotion });
      lastMoveRef.current = Date.now();

      return true;
    } catch {
      return false;
    }
  }, [gameState, localGame, userId, makeMove]);

  const isWhiteTurn = localGame.turn() === 'w';
  const playerColor = userId === gameState?.blackId ? 'black' : 'white';
  const isMyTurn = (playerColor === 'white' && isWhiteTurn) || (playerColor === 'black' && !isWhiteTurn);

  // Determine last move highlight
  const history = localGame.history({ verbose: true });
  const lastMove = history.length > 0 ? history[history.length - 1] : null;
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 50, 0.35)' };
    customSquareStyles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 50, 0.42)' };
  }
  if (localGame.isCheck()) {
    // Find king position
    const board = localGame.board();
    const kingColor = localGame.turn();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === kingColor) {
          const square = String.fromCharCode(97 + c) + (8 - r);
          customSquareStyles[square] = { backgroundColor: 'rgba(239, 68, 68, 0.6)', borderRadius: '50%' };
        }
      }
    }
  }

  // Top and bottom player info
  const topPlayer = orientation === 'white'
    ? { id: gameState?.blackId, rating: gameState?.blackRating, time: blackTime, isActive: !isWhiteTurn && gameState?.status === 'active' }
    : { id: gameState?.whiteId, rating: gameState?.whiteRating, time: whiteTime, isActive: isWhiteTurn && gameState?.status === 'active' };

  const bottomPlayer = orientation === 'white'
    ? { id: gameState?.whiteId, rating: gameState?.whiteRating, time: whiteTime, isActive: isWhiteTurn && gameState?.status === 'active' }
    : { id: gameState?.blackId, rating: gameState?.blackRating, time: blackTime, isActive: !isWhiteTurn && gameState?.status === 'active' };

  return (
    <div className="game-page">
      <div className="game-container">
        {/* Board Column */}
        <div className="game-board-col">
          {/* Top player */}
          <div className="game-player-bar">
            <div className="game-player-info">
              <div className="avatar avatar-sm">{(topPlayer.id || 'O')[0].toUpperCase()}</div>
              <div>
                <span className="game-player-name">{topPlayer.id?.startsWith('bot-') ? `Bot (${topPlayer.id.split('-')[1]})` : topPlayer.id || 'Opponent'}</span>
                <span className="game-player-rating">{Math.round(topPlayer.rating || 1500)}</span>
              </div>
            </div>
            <GameClock time={topPlayer.time} active={topPlayer.isActive} isLow={topPlayer.time < 30000} />
          </div>

          {/* Board */}
          <div className="game-board-wrapper">
            <Chessboard
              id="game-board"
              position={localGame.fen()}
              onPieceDrop={onDrop}
              boardOrientation={orientation}
              boardWidth={boardWidth}
              animationDuration={200}
              arePiecesDraggable={gameState?.status === 'active' && isMyTurn}
              customBoardStyle={{
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              }}
              customDarkSquareStyle={{ backgroundColor: 'var(--board-dark)' }}
              customLightSquareStyle={{ backgroundColor: 'var(--board-light)' }}
              customSquareStyles={customSquareStyles}
            />
          </div>

          {/* Bottom player */}
          <div className="game-player-bar">
            <div className="game-player-info">
              <div className="avatar avatar-sm">{(bottomPlayer.id || 'Y')[0].toUpperCase()}</div>
              <div>
                <span className="game-player-name">{bottomPlayer.id?.startsWith('bot-') ? `Bot (${bottomPlayer.id.split('-')[1]})` : bottomPlayer.id || 'You'}</span>
                <span className="game-player-rating">{Math.round(bottomPlayer.rating || 1500)}</span>
              </div>
            </div>
            <GameClock time={bottomPlayer.time} active={bottomPlayer.isActive} isLow={bottomPlayer.time < 30000} />
          </div>
        </div>

        {/* Side Panel */}
        <div className="game-side-panel">
          {/* Game Status */}
          {gameOverData && (
            <div className={cn('game-result-banner', 
              gameOverData.result === 'draw' ? 'game-result-draw' :
              ((playerColor === 'white' && gameOverData.result === 'white') || 
               (playerColor === 'black' && gameOverData.result === 'black')) 
                ? 'game-result-win' : 'game-result-loss'
            )}>
              <div className="game-result-text">
                {gameOverData.result === 'draw' ? '½ - ½ Draw' :
                  ((playerColor === 'white' && gameOverData.result === 'white') || 
                   (playerColor === 'black' && gameOverData.result === 'black'))
                    ? '🎉 Victory!' : 'Defeat'}
              </div>
              <div className="game-result-reason">
                {gameOverData.reason === 'checkmate' && 'by checkmate'}
                {gameOverData.reason === 'resignation' && 'by resignation'}
                {gameOverData.reason === 'timeout' && 'on time'}
                {gameOverData.reason === 'stalemate' && 'by stalemate'}
                {gameOverData.reason === 'agreement' && 'by agreement'}
                {gameOverData.reason === 'repetition' && 'by repetition'}
                {gameOverData.reason === 'insufficient' && 'insufficient material'}
              </div>
              <div className="game-result-actions">
                <button className="btn btn-primary btn-sm" onClick={() => router.push('/play')}>
                  New Game
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => router.push('/dashboard')}>
                  Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Move List */}
          <div className="game-panel-section">
            <h3 className="game-panel-title">Moves</h3>
            <MoveList
              moves={moves}
              currentMove={currentMoveIndex}
              onMoveClick={(i) => setCurrentMoveIndex(i)}
            />
          </div>

          {/* Draw offer */}
          {drawOffered && gameState?.status === 'active' && (
            <div className="draw-offer-bar">
              <span>Draw offered</span>
              <div className="flex gap-2">
                <button className="btn btn-primary btn-sm" onClick={() => { acceptDraw(userId); setDrawOffered(false); }}>Accept</button>
                <button className="btn btn-secondary btn-sm" onClick={() => { socket.emit('decline-draw', { gameId, userId }); setDrawOffered(false); }}>Decline</button>
              </div>
            </div>
          )}

          {/* Game Controls */}
          {gameState?.status === 'active' && !gameOverData && (
            <div className="game-controls">
              <button className="btn btn-ghost btn-sm" onClick={() => setOrientation(o => o === 'white' ? 'black' : 'white')} title="Flip board">
                🔄 Flip
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => offerDraw(userId)} title="Offer draw">
                🤝 Draw
              </button>
              {showResignConfirm ? (
                <div className="resign-confirm">
                  <span>Resign?</span>
                  <button className="btn btn-danger btn-sm" onClick={() => { resign(userId); setShowResignConfirm(false); }}>Yes</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowResignConfirm(false)}>No</button>
                </div>
              ) : (
                <button className="btn btn-ghost btn-sm" onClick={() => setShowResignConfirm(true)} title="Resign">
                  🏳️ Resign
                </button>
              )}
            </div>
          )}

          {/* Connection Status */}
          {!connected && (
            <div className="connection-status">
              <span className="animate-pulse">🔴 Reconnecting...</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .game-page {
          padding: var(--sp-4) 0;
          min-height: calc(100vh - var(--navbar-height));
        }

        .game-container {
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 0 var(--sp-4);
          display: flex;
          gap: var(--sp-6);
          align-items: flex-start;
          justify-content: center;
        }

        .game-board-col {
          display: flex;
          flex-direction: column;
          gap: var(--sp-2);
        }

        .game-player-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--sp-2) var(--sp-3);
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
        }

        .game-player-info {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
        }

        .game-player-name {
          font-weight: var(--fw-semibold);
          font-size: var(--fs-sm);
          display: block;
        }

        .game-player-rating {
          font-size: var(--fs-xs);
          color: var(--text-secondary);
        }

        .game-board-wrapper {
          position: relative;
        }

        :global(.game-clock) {
          padding: var(--sp-1) var(--sp-3);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          font-family: var(--font-mono);
          font-size: var(--fs-lg);
          font-weight: var(--fw-bold);
          min-width: 80px;
          text-align: center;
          transition: all var(--transition-fast);
        }

        :global(.game-clock-active) {
          background: var(--accent);
          color: white;
        }

        :global(.game-clock-low) {
          animation: lowTime 1s infinite;
        }

        :global(.game-clock-low.game-clock-active) {
          background: var(--error);
          animation: none;
        }

        .game-side-panel {
          width: 320px;
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
          flex-shrink: 0;
        }

        .game-panel-section {
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .game-panel-title {
          font-size: var(--fs-sm);
          font-weight: var(--fw-semibold);
          padding: var(--sp-3) var(--sp-4);
          border-bottom: 1px solid var(--border-secondary);
          color: var(--text-secondary);
        }

        :global(.move-list) {
          max-height: 360px;
          overflow-y: auto;
          padding: var(--sp-2);
        }

        :global(.move-list-empty) {
          text-align: center;
          padding: var(--sp-8);
          color: var(--text-tertiary);
          font-size: var(--fs-sm);
        }

        :global(.move-list-row) {
          display: flex;
          align-items: center;
          gap: var(--sp-1);
          padding: 1px 0;
        }

        :global(.move-number) {
          width: 32px;
          text-align: right;
          font-size: var(--fs-xs);
          color: var(--text-tertiary);
          flex-shrink: 0;
          font-family: var(--font-mono);
        }

        :global(.move-btn) {
          flex: 1;
          padding: 2px var(--sp-2);
          font-size: var(--fs-sm);
          font-family: var(--font-mono);
          background: none;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          color: var(--text-primary);
          text-align: left;
          transition: background var(--transition-fast);
        }

        :global(.move-btn:hover) {
          background: var(--bg-hover);
        }

        :global(.move-btn-active) {
          background: var(--accent-muted);
          color: var(--accent-text);
        }

        .game-result-banner {
          padding: var(--sp-4);
          border-radius: var(--radius-lg);
          text-align: center;
          animation: scaleIn 0.3s ease;
        }

        .game-result-win {
          background: var(--success-muted);
          border: 1px solid var(--success);
        }

        .game-result-loss {
          background: var(--error-muted);
          border: 1px solid var(--error);
        }

        .game-result-draw {
          background: var(--warning-muted);
          border: 1px solid var(--warning);
        }

        .game-result-text {
          font-size: var(--fs-xl);
          font-weight: var(--fw-bold);
          margin-bottom: var(--sp-1);
        }

        .game-result-reason {
          font-size: var(--fs-sm);
          color: var(--text-secondary);
          margin-bottom: var(--sp-4);
        }

        .game-result-actions {
          display: flex;
          gap: var(--sp-2);
          justify-content: center;
        }

        .game-controls {
          display: flex;
          gap: var(--sp-2);
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: var(--sp-3);
          flex-wrap: wrap;
        }

        .resign-confirm {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          font-size: var(--fs-sm);
          color: var(--error);
          font-weight: var(--fw-medium);
        }

        .draw-offer-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--sp-3);
          background: var(--info-muted);
          border: 1px solid var(--info);
          border-radius: var(--radius-lg);
          font-size: var(--fs-sm);
          font-weight: var(--fw-medium);
        }

        .connection-status {
          text-align: center;
          padding: var(--sp-2);
          font-size: var(--fs-sm);
          color: var(--error);
        }

        @media (max-width: 900px) {
          .game-container {
            flex-direction: column;
            align-items: center;
          }

          .game-side-panel {
            width: 100%;
            max-width: 600px;
          }
        }
      `}</style>
    </div>
  );
}
