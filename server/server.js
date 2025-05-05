const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import modules
const connectDB = require('./config/db');
const routes = require('./routes');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 9000;

// Middleware
app.use(cors({
  origin: '*', // Allow requests from any origin during development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB
connectDB();

// API Routes - all routes are prefixed with /api
app.use('/api', routes);

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'University Portal API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
