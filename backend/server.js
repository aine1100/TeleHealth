require('dotenv').config({ path: require('path').join(__dirname, '.env') });
require('dotenv').config(); // fallback: repo-root .env when started via npm start
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const errorHandler = require('./middleware/errorHandler');
const consultChatService = require('./services/consultChatService');
const { User } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const clinicRoutes = require('./routes/clinics');
const paymentRoutes = require('./routes/payments');
const medicineRoutes = require('./routes/medicines');
const notificationRoutes = require('./routes/notifications');
const patientRoutes = require('./routes/patients');
const pharmacyRoutes = require('./routes/pharmacies');

const app = express();
const server = http.createServer(app);

const parseCorsOrigin = () => {
  if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN.trim() === '*') {
    return true;
  }
  return process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
};

const corsOrigin = parseCorsOrigin();

const io = new Server(server, {
  cors: {
    origin: corsOrigin === true ? '*' : corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});
app.set('io', io);

const { startMedicineReminderScheduler } = require('./services/medicineReminderScheduler');
startMedicineReminderScheduler(io);

io.on('connection', (socket) => {
  socket.on('join-user-room', ({ userId, role }) => {
    if (!userId) return;
    if (role === 'doctor') {
      socket.join(`doctor-waiting-${userId}`);
    }
    if (role === 'patient') {
      socket.join(`patient-${userId}`);
    }
  });

  socket.on('join-appointment-room', ({ appointmentId, userId, role }) => {
    if (!appointmentId) return;
    const roomName = `appointment-${appointmentId}`;

    const existingPeers = [];
    const room = io.sockets.adapter.rooms.get(roomName);
    if (room) {
      for (const socketId of room) {
        const peerSocket = io.sockets.sockets.get(socketId);
        if (!peerSocket || peerSocket.id === socket.id) continue;
        existingPeers.push({
          userId: peerSocket.data?.userId,
          role: peerSocket.data?.role
        });
      }
    }

    socket.join(roomName);
    socket.data = { ...socket.data, appointmentId, userId, role };
    socket.emit('room-peers', { appointmentId, peers: existingPeers });
    socket.to(roomName).emit('peer-joined', { appointmentId, userId, role });
  });

  socket.on('webrtc-ready', ({ appointmentId, userId, role }) => {
    if (!appointmentId) return;
    socket.to(`appointment-${appointmentId}`).emit('webrtc-ready', { appointmentId, userId, role });
  });

  socket.on('consult-chat-message', async ({ appointmentId, text }) => {
    try {
      if (!appointmentId || !socket.data?.userId) return;
      const user = await User.findById(socket.data.userId).select('role firstName lastName');
      if (!user) return;

      const message = await consultChatService.sendChatMessage({
        user,
        appointmentId,
        text
      });

      io.to(`appointment-${appointmentId}`).emit('consult-chat-message', message);
    } catch (error) {
      socket.emit('consult-chat-error', { message: error.message || 'Unable to send message' });
    }
  });

  socket.on('request-offer', ({ appointmentId, senderId, role }) => {
    if (!appointmentId) return;
    socket.to(`appointment-${appointmentId}`).emit('request-offer', {
      appointmentId,
      senderId,
      role
    });
  });

  socket.on('offer', ({ appointmentId, offer, senderId }) => {
    socket.to(`appointment-${appointmentId}`).emit('offer', { offer, senderId });
  });

  socket.on('answer', ({ appointmentId, answer, senderId }) => {
    socket.to(`appointment-${appointmentId}`).emit('answer', { answer, senderId });
  });

  socket.on('ice-candidate', ({ appointmentId, candidate, senderId }) => {
    socket.to(`appointment-${appointmentId}`).emit('ice-candidate', { candidate, senderId });
  });

  socket.on('leave-appointment-room', ({ appointmentId }) => {
    socket.leave(`appointment-${appointmentId}`);
  });
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Alive Health UG API',
      version: '1.0.0',
      description: 'Authentication, organization onboarding, and platform APIs for Alive Health UG'
    },
    servers: [{ url: 'http://localhost:5000' }]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(
  cors({
    origin: corsOrigin,
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Socket.io for real-time features
// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id);
  
//   socket.on('join-waiting-room', (appointmentId) => {
//     socket.join(`waiting-${appointmentId}`);
//   });
  
//   socket.on('join-video-call', (roomId) => {
//     socket.join(roomId);
//     socket.to(roomId).emit('user-joined', socket.id);
//   });
  
//   socket.on('offer', (data) => {
//     socket.to(data.roomId).emit('offer', data.offer);
//   });
  
//   socket.on('answer', (data) => {
//     socket.to(data.roomId).emit('answer', data.answer);
//   });
  
//   socket.on('ice-candidate', (data) => {
//     socket.to(data.roomId).emit('ice-candidate', data.candidate);
//   });
  
//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });
// });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/pharmacies', pharmacyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Ok', platform: 'Alive Health UG', timestamp: new Date() });
});

// Single-service hosting: serve React build from backend/public (same origin as /api + socket.io)
const clientBuildPath = path.join(__dirname, 'public');
const clientIndex = path.join(clientBuildPath, 'index.html');

if (fs.existsSync(clientIndex)) {
  app.use(
    express.static(clientBuildPath, {
      maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
      index: false
    })
  );

  app.get('*', (req, res, next) => {
    if (
      req.method !== 'GET' &&
      req.method !== 'HEAD'
    ) {
      return next();
    }
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/uploads') ||
      req.path.startsWith('/socket.io')
    ) {
      return next();
    }
    return res.sendFile(clientIndex);
  });

  console.log('📦 Serving frontend from', clientBuildPath);
} else {
  console.log('ℹ️  No frontend build in backend/public (API-only mode)');
}

// Error handler
app.use(errorHandler);

// Start server — bind 0.0.0.0 so other devices on the LAN can connect
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const getLanAddresses = () => {
  const nets = os.networkInterfaces();
  const addresses = [];
  Object.values(nets).forEach((interfaces) => {
    interfaces?.forEach((net) => {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    });
  });
  return addresses;
};

server.listen(PORT, HOST, () => {
  console.log(`🚀 Alive Health UG server running on http://${HOST}:${PORT}`);
  console.log(`   Local:  http://localhost:${PORT}/api/health`);
  getLanAddresses().forEach((ip) => {
    console.log(`   LAN:    http://${ip}:${PORT}/api/health`);
    console.log(`   App:    http://${ip}:3000  ← open this on other PCs`);
  });
});