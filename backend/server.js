require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const repoRoutes = require('./routes/repo');
const adminRoutes = require('./routes/admin');
const usersRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// Track server start time globally
global.serverStartTime = Date.now();

// Simple request counter for traffic analytics
let requestCount = 0;
app.use((req, res, next) => {
  requestCount++;
  next();
});

// Expose request count for admin
app.get('/api/request-count', (req, res) => {
  res.json({ count: requestCount });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/repo', repoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('cursor-move', (data) => {
    // broadcast to others in room
    socket.to(data.roomId).emit('remote-cursor', {
      id: socket.id,
      x: data.x,
      y: data.y,
      color: data.color,
      name: data.name
    });
  });
  socket.on('chat-message', (data) => {
    socket.to(data.roomId).emit('chat-message', data);
  });

  // Presence Tracking — supports multiple sockets per user
  if (!global.onlineUsers) global.onlineUsers = new Map(); // userId -> Set of socketIds

  socket.on('identify', (userId) => {
    socket.userId = userId;
    if (!global.onlineUsers.has(userId)) {
      global.onlineUsers.set(userId, new Set());
    }
    global.onlineUsers.get(userId).add(socket.id);
    io.emit('presence-update', Array.from(global.onlineUsers.keys()));
  });

  socket.on('direct-message', (data) => {
    // data: { senderId, receiverId, text, timestamp }
    const receiverSockets = global.onlineUsers.get(data.receiverId);
    if (receiverSockets) {
      // Send to ALL of receiver's sockets so every tab/component gets it
      for (const sid of receiverSockets) {
        io.to(sid).emit('direct-message', data);
      }
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      const sockets = global.onlineUsers.get(socket.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          global.onlineUsers.delete(socket.userId);
        }
      }
      io.emit('presence-update', Array.from(global.onlineUsers.keys()));
    }
    console.log('User disconnected:', socket.id);
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
