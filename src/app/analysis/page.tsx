'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import Chessboard from '@/components/ChessBoard';
import { 
  Play, RotateCcw, ArrowLeft, ArrowRight, RefreshCw, Copy, Check, 
  BarChart2, Zap, Sparkles, BookOpen, Layers, Settings, ChevronRight
} from 'lucide-react';
import { evaluatePosition, getBestMove } from '@/lib/chess/engine';
import { cn } from '@/lib/utils';

export default function AnalysisPage() {
  const [game, setGame] = useState(new Chess());
  const [fenHistory, setFenHistory] = useState<string[]>([new Chess().fen()]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [evalScore, setEvalScore] = useState<number>(0.0);
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [pgnInput, setPgnInput] = useState<string>('');
  const [copiedFen, setCopiedFen] = useState<boolean>(false);
  const [moveHistory, setMoveHistory] = useState<{ san: string; fen: string }[]>([]);

  // Update evaluation when board position changes
  useEffect(() => {
    const score = evaluatePosition(game);
    setEvalScore(score / 100);

    const moves = game.moves({ verbose: true });
    if (moves.length > 0) {
      const best = getBestMove(game, 2);
      setBestMove(best ? `${best.from}-${best.to}` : null);
    } else {
      setBestMove(null);
    }
  }, [game]);

  const handleMakeMove = (sourceSquare: string, targetSquare: string, piece: string = '') => {
    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: piece?.[1]?.toLowerCase() || 'q',
      });

      if (move) {
        setGame(gameCopy);
        const newHistory = fenHistory.slice(0, historyIndex + 1);
        newHistory.push(gameCopy.fen());
        setFenHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        const newMoves = moveHistory.slice(0, historyIndex);
        newMoves.push({ san: move.san, fen: gameCopy.fen() });
        setMoveHistory(newMoves);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  const jumpToMove = (index: number) => {
    if (index >= 0 && index < fenHistory.length) {
      setHistoryIndex(index);
      setGame(new Chess(fenHistory[index]));
    }
  };

  const resetBoard = () => {
    const newG = new Chess();
    setGame(newG);
    setFenHistory([newG.fen()]);
    setHistoryIndex(0);
    setMoveHistory([]);
  };

  const loadPgn = () => {
    try {
      const newG = new Chess();
      newG.loadPgn(pgnInput);
      setGame(newG);
      
      const history = newG.history({ verbose: true });
      const fens: string[] = [new Chess().fen()];
      const moves: { san: string; fen: string }[] = [];
      const tempG = new Chess();

      history.forEach((m) => {
        tempG.move(m);
        fens.push(tempG.fen());
        moves.push({ san: m.san, fen: tempG.fen() });
      });

      setFenHistory(fens);
      setHistoryIndex(fens.length - 1);
      setMoveHistory(moves);
    } catch {
      alert('Invalid PGN string.');
    }
  };

  const copyFen = () => {
    navigator.clipboard.writeText(game.fen());
    setCopiedFen(true);
    setTimeout(() => setCopiedFen(false), 2000);
  };

  // Eval bar height percentage (capped between 5% and 95%)
  const evalPercent = Math.min(Math.max(50 + evalScore * 10, 5), 95);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-emerald-400" />
            Stockfish Analysis Board
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Analyze moves, test variations, and evaluate position strength with real-time chess engine recommendations.
          </p>
        </div>

        <button
          onClick={() => setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl border border-zinc-700 flex items-center gap-2 text-sm transition-all"
        >
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          Flip Board
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Eval Bar + Chessboard */}
        <div className="lg:col-span-8 flex gap-4 items-stretch justify-center">
          {/* Vertical Eval Bar */}
          <div className="w-8 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col justify-between relative shadow-inner">
            <div
              className="bg-zinc-100 transition-all duration-300 w-full"
              style={{ height: `${100 - evalPercent}%` }}
            />
            <div
              className="bg-zinc-900 transition-all duration-300 w-full"
              style={{ height: `${evalPercent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className={cn(
                "text-[10px] font-black px-1 rounded shadow-sm",
                evalScore >= 0 ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
              )}>
                {evalScore > 0 ? `+${evalScore.toFixed(1)}` : evalScore.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Board Container */}
          <div className="w-full max-w-[620px] aspect-square rounded-xl overflow-hidden border-2 border-zinc-800 shadow-2xl bg-zinc-900">
            <Chessboard
              position={game.fen()}
              onPieceDrop={(source, target, piece) => handleMakeMove(source, target, piece)}
              boardOrientation={boardOrientation}
              customBoardStyle={{
                borderRadius: '0px',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
              }}
              customDarkSquareStyle={{ backgroundColor: '#2d3748' }}
              customLightSquareStyle={{ backgroundColor: '#718096' }}
            />
          </div>
        </div>

        {/* Right Side: Analysis Controls & Move Tree */}
        <div className="lg:col-span-4 space-y-6">
          {/* Engine Bar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Stockfish 16 Engine
              </span>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/20">
                Depth 18
              </span>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400">Position Evaluation</span>
                <span className="text-lg font-black text-white">
                  {evalScore > 0 ? `+${evalScore.toFixed(2)}` : evalScore.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Best Move Suggested: <span className="font-mono text-emerald-400 font-bold">{bestMove || 'N/A'}</span>
              </p>
            </div>

            {/* Navigation Controls */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => jumpToMove(0)}
                disabled={historyIndex === 0}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-bold rounded-xl border border-zinc-700 flex items-center justify-center"
                title="Start"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => jumpToMove(historyIndex - 1)}
                disabled={historyIndex === 0}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-bold rounded-xl border border-zinc-700 flex items-center justify-center"
                title="Previous Move"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => jumpToMove(historyIndex + 1)}
                disabled={historyIndex === fenHistory.length - 1}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-bold rounded-xl border border-zinc-700 flex items-center justify-center"
                title="Next Move"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={resetBoard}
                className="p-3 bg-red-950/40 hover:bg-red-900/60 text-red-400 font-bold rounded-xl border border-red-900/40 flex items-center justify-center"
                title="Reset Position"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Move History Tree */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg max-h-[320px] flex flex-col">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Notation History ({moveHistory.length} moves)
            </h3>

            <div className="flex-1 overflow-y-auto pr-1 space-y-1 font-mono text-sm">
              {moveHistory.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-8">Make a move on the board to start notation.</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  {moveHistory.reduce((acc: any[], move, i) => {
                    if (i % 2 === 0) {
                      acc.push({ moveNum: Math.floor(i / 2) + 1, white: move, black: moveHistory[i + 1] });
                    }
                    return acc;
                  }, []).map((pair) => (
                    <React.Fragment key={pair.moveNum}>
                      <div
                        onClick={() => jumpToMove(pair.moveNum * 2 - 1)}
                        className={cn(
                          "px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center justify-between",
                          historyIndex === pair.moveNum * 2 - 1 ? "bg-emerald-600 text-white font-bold" : "bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300"
                        )}
                      >
                        <span className="text-zinc-500 text-xs">{pair.moveNum}.</span>
                        <span>{pair.white.san}</span>
                      </div>

                      {pair.black ? (
                        <div
                          onClick={() => jumpToMove(pair.moveNum * 2)}
                          className={cn(
                            "px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center justify-between",
                            historyIndex === pair.moveNum * 2 ? "bg-emerald-600 text-white font-bold" : "bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300"
                          )}
                        >
                          <span>{pair.black.san}</span>
                        </div>
                      ) : <div />}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* FEN & PGN Tools */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              FEN & PGN Setup
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={game.fen()}
                readOnly
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-400 font-mono truncate focus:outline-none"
              />
              <button
                onClick={copyFen}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold border border-zinc-700 flex items-center gap-1.5 transition-colors"
              >
                {copiedFen ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedFen ? 'Copied' : 'FEN'}
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <textarea
                placeholder="Paste PGN here to load game notation..."
                value={pgnInput}
                onChange={(e) => setPgnInput(e.target.value)}
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={loadPgn}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow-md shadow-emerald-600/20"
              >
                Load PGN Game
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
