require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
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

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

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
    socket.join(roomName);
    socket.data = { ...socket.data, appointmentId, userId, role };
    socket.to(roomName).emit('peer-joined', { userId, role });
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
app.use(helmet());
app.use(cors());
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Ok', platform: 'Alive Health UG', timestamp: new Date() });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Alive Health UG server running on port ${PORT}`);
});