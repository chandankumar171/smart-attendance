const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.CLIENT_URL
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Admin joins a dedicated room to receive real-time updates
    socket.on('join:admin', () => {
      socket.join('admin-room');
      console.log(`Admin joined room: ${socket.id}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Emit attendance update to all admins
const emitAttendanceUpdate = (data) => {
  if (io) {
    io.to('admin-room').emit('attendance:update', data);
  }
};

// Emit daily stats update
const emitStatsUpdate = (stats) => {
  if (io) {
    io.to('admin-room').emit('stats:update', stats);
  }
};

const getIo = () => io;

module.exports = { initSocket, emitAttendanceUpdate, emitStatsUpdate, getIo };