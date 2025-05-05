const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./authRoutes');
const facultyRoutes = require('./facultyRoutes');
const studentRoutes = require('./studentRoutes');
const projectRoutes = require('./projectRoutes');
const adminRoutes = require('./adminRoutes');

// Health check route
router.get('/status', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/faculty', facultyRoutes);
router.use('/students', studentRoutes);
router.use('/projects', projectRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
