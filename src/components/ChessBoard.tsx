'use client';

import React from 'react';
import { Chessboard as ReactChessboard } from 'react-chessboard';

export interface ChessBoardProps {
  id?: string;
  position?: string;
  onPieceDrop?: (sourceSquare: string, targetSquare: string, piece: string) => boolean;
  boardOrientation?: 'white' | 'black';
  boardWidth?: number;
  animationDuration?: number;
  arePiecesDraggable?: boolean;
  customBoardStyle?: React.CSSProperties;
  customDarkSquareStyle?: React.CSSProperties;
  customLightSquareStyle?: React.CSSProperties;
  customSquareStyles?: Record<string, React.CSSProperties>;
}

export default function ChessBoard({
  id = 'chess-board',
  position,
  onPieceDrop,
  boardOrientation = 'white',
  boardWidth,
  animationDuration = 200,
  arePiecesDraggable = true,
  customBoardStyle,
  customDarkSquareStyle,
  customLightSquareStyle,
  customSquareStyles,
}: ChessBoardProps) {
  const options = {
    id,
    position,
    boardOrientation,
    allowDragging: arePiecesDraggable,
    animationDurationInMs: animationDuration,
    boardStyle: {
      width: boardWidth ? `${boardWidth}px` : '100%',
      height: boardWidth ? `${boardWidth}px` : '100%',
      ...customBoardStyle,
    },
    darkSquareStyle: customDarkSquareStyle || { backgroundColor: '#2d3748' },
    lightSquareStyle: customLightSquareStyle || { backgroundColor: '#718096' },
    squareStyles: customSquareStyles,
    onPieceDrop: onPieceDrop
      ? ({ sourceSquare, targetSquare, piece }: { sourceSquare: string; targetSquare: string | null; piece: any }) => {
          if (!targetSquare) return false;
          const pieceType = piece?.pieceType || '';
          return onPieceDrop(sourceSquare, targetSquare, pieceType);
        }
      : undefined,
  };

  return <ReactChessboard options={options} />;
}
