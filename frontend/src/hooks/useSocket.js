import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const useSocket = (role, { onAttendanceUpdate, onStatsUpdate } = {}) => {
  const handlersRef = useRef({ onAttendanceUpdate, onStatsUpdate });

  useEffect(() => {
    handlersRef.current = { onAttendanceUpdate, onStatsUpdate };
  });

  useEffect(() => {
    if (!socket) {
      socket = io(SOCKET_URL, { transports: ['websocket'] });
    }

    if (role === 'admin') {
      socket.emit('join:admin');
    }

    const handleAttendance = (data) => handlersRef.current.onAttendanceUpdate?.(data);
    const handleStats = (data) => handlersRef.current.onStatsUpdate?.(data);

    socket.on('attendance:update', handleAttendance);
    socket.on('stats:update', handleStats);

    return () => {
      socket.off('attendance:update', handleAttendance);
      socket.off('stats:update', handleStats);
    };
  }, [role]);
};