'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

let globalSocket: Socket | null = null;

export function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io({
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return globalSocket;
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket>(getSocket());

  useEffect(() => {
    const socket = socketRef.current;

    function onConnect() {
      setConnected(true);
    }

    function onDisconnect() {
      setConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) setConnected(true);
    if (!socket.connected) socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return { socket: socketRef.current, connected };
}

export function useGameSocket(gameId: string) {
  const { socket, connected } = useSocket();
  const [gameState, setGameState] = useState<any>(null);
  const [moves, setMoves] = useState<any[]>([]);

  useEffect(() => {
    if (!connected || !gameId) return;

    socket.emit('join-game', gameId);

    function onGameState(state: any) {
      setGameState(state);
      setMoves(state.moves || []);
    }

    function onMoveMade(data: any) {
      setGameState((prev: any) => ({
        ...prev,
        fen: data.fen,
        whiteTime: data.whiteTime,
        blackTime: data.blackTime,
        turn: data.turn,
        isCheck: data.isCheck,
      }));
      setMoves(prev => [...prev, {
        san: data.move.san,
        from: data.move.from,
        to: data.move.to,
      }]);
    }

    function onGameOver(data: any) {
      setGameState((prev: any) => ({
        ...prev,
        status: 'completed',
        result: data.result,
        terminationReason: data.reason,
        whiteTime: data.whiteTime,
        blackTime: data.blackTime,
      }));
    }

    socket.on('game-state', onGameState);
    socket.on('move-made', onMoveMade);
    socket.on('game-over', onGameOver);

    return () => {
      socket.off('game-state', onGameState);
      socket.off('move-made', onMoveMade);
      socket.off('game-over', onGameOver);
    };
  }, [socket, connected, gameId]);

  const makeMove = useCallback((userId: string, move: { from: string; to: string; promotion?: string }) => {
    socket.emit('make-move', { gameId, userId, move });
  }, [socket, gameId]);

  const resign = useCallback((userId: string) => {
    socket.emit('resign', { gameId, userId });
  }, [socket, gameId]);

  const offerDraw = useCallback((userId: string) => {
    socket.emit('offer-draw', { gameId, userId });
  }, [socket, gameId]);

  const acceptDraw = useCallback((userId: string) => {
    socket.emit('accept-draw', { gameId, userId });
  }, [socket, gameId]);

  return {
    socket,
    connected,
    gameState,
    moves,
    makeMove,
    resign,
    offerDraw,
    acceptDraw,
  };
}
