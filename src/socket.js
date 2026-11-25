const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./db');
const bus = require('./events');

function initSocket(httpServer) {
  const io = new Server(httpServer, { cors: { origin: '*' } });

  // Only authenticated users may connect.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error: token missing'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('joinRoom', (room = 'general') => {
      socket.join(room);
      socket.room = room;
      console.log(`${socket.id} joined room ${room}`);
      socket.to(room).emit('systemMessage', `${socket.user.username} joined ${room}`);
    });

    socket.on('chatMessage', ({ room = 'general', text } = {}) => {
      if (!text || !text.trim()) return;
      if (!socket.rooms.has(room)) return socket.emit('errorMessage', 'Join the room first');
      const msg = db.messages.insert({ room, userId: socket.user.id, username: socket.user.username, text: text.trim() });
      bus.emit('chat:message', msg);
      io.to(room).emit('chatMessage', { room, username: msg.username, text: msg.text, at: msg.createdAt });
    });

    socket.on('typing', (room = 'general') => socket.to(room).emit('typing', socket.user.username));

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      if (socket.room) socket.to(socket.room).emit('systemMessage', `${socket.user.username} left ${socket.room}`);
    });
  });

  return io;
}

module.exports = initSocket;
