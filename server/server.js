// backend/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const uploadRoutes = require('./routes/upload');
const { socketHandler } = require('./utils/socketHandler');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "https://kichu-kotha.vercel.app",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', uploadRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Kichu Kotha server is running!'
  });
});

// Socket.io
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Kichu Kotha server running on port ${PORT}`));