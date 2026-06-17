require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const ridesRoutes = require('./routes/rides');
const locationsRoutes = require('./routes/locations');
const adminRoutes = require('./routes/admin');
const routesRoutes = require('./routes/routes');
const { seedLocations } = require('./data/locations');

const app = express();

// Allowed Origins for CORS
const allowedOrigins = [
  'http://localhost:5000',      // Local Express server
  'http://localhost:3000',      // Local fallback
  'http://127.0.0.1:5000',      // Local IP
  'http://127.0.0.1:3000',      // Local IP fallback
  'https://totoapp.onrender.com', // Production
  'https://totobooking.vercel.app', // Alternative production
  'https://totobooking.netlify.app' // Alternative production
];

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // For development, allow all localhost
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve Frontend Files
app.use(
  express.static(
    path.join(__dirname, 'public')
  )
);

// Connect to MongoDB
connectDB();
seedLocations();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Backend is running' 
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/routes', routesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 Toto Backend Server Running        ║
║  📍 URL: http://localhost:${PORT}      ║
║  🗄️  MongoDB: Connected                 ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
