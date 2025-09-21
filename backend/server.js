const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const config = require('./config');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const donationRoutes = require('./routes/donations');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'EcoEvents API is running',
    timestamp: new Date().toISOString()
  });
});

// Socket.io for real-time chat
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room
  socket.on('join', (userId) => {
    socket.join(userId);
    connectedUsers.set(socket.id, userId);
    console.log(`User ${userId} joined room`);
  });

  // Handle private messages
  socket.on('sendMessage', async (data) => {
    try {
      const { to, message, from } = data;
      
      // Emit message to recipient
      socket.to(to).emit('receiveMessage', {
        from,
        message,
        timestamp: new Date().toISOString()
      });

      // Emit confirmation to sender
      socket.emit('messageSent', {
        to,
        message,
        timestamp: new Date().toISOString()
      });

      console.log(`Message from ${from} to ${to}: ${message}`);
    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(data.to).emit('userTyping', {
      from: data.from,
      isTyping: data.isTyping
    });
  });

  // Handle user going online/offline
  socket.on('userStatus', (data) => {
    socket.to(data.to).emit('userStatusUpdate', {
      userId: data.userId,
      isOnline: data.isOnline
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const userId = connectedUsers.get(socket.id);
    if (userId) {
      connectedUsers.delete(socket.id);
      console.log(`User ${userId} disconnected`);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: config.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  
  // Start server
  server.listen(config.PORT, () => {
    console.log(`EcoEvents server running on port ${config.PORT}`);
    console.log(`Environment: ${config.NODE_ENV}`);
  });
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});

module.exports = { app, server, io };
