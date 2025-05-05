const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active || true,
      createdAt: user.createdAt
    })));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get all projects
// @route   GET /api/admin/projects
// @access  Private/Admin
router.get('/projects', protect, authorize('admin'), async (req, res) => {
  try {
    const facultyWithProjects = await User.find({ role: 'faculty' })
      .select('name projects');
    
    // Extract all projects with faculty information
    const projects = [];
    facultyWithProjects.forEach(faculty => {
      faculty.projects.forEach(project => {
        projects.push({
          id: project._id,
          title: project.title,
          description: project.description,
          status: project.status || 'Open',
          domain: project.domain,
          facultyId: faculty._id,
          facultyName: faculty.name,
          applicants: project.applicationDetails ? project.applicationDetails.length : 0,
          createdAt: project.createdAt
        });
      });
    });
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get all applications
// @route   GET /api/admin/applications
// @access  Private/Admin
router.get('/applications', protect, authorize('admin'), async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' })
      .select('name projects.title projects.applicationDetails');
    
    // Extract all applications with faculty and project information
    const applications = [];
    faculty.forEach(faculty => {
      faculty.projects.forEach(project => {
        if (project.applicationDetails && project.applicationDetails.length > 0) {
          project.applicationDetails.forEach(app => {
            applications.push({
              id: app._id,
              projectId: project._id,
              projectTitle: project.title,
              facultyId: faculty._id,
              facultyName: faculty.name,
              studentId: app.studentId,
              studentName: app.studentName,
              studentEmail: app.studentEmail,
              appliedDate: app.appliedDate,
              status: app.status
            });
          });
        }
      });
    });
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private/Admin
router.get('/profile', protect, authorize('admin'), async (req, res) => {
  try {
    const admin = await User.findById(req.user._id).select('-password');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    res.json({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt,
      lastLogin: admin.lastLogin || admin.updatedAt,
      profilePictureUrl: admin.profilePictureUrl
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private/Admin
router.put('/profile', protect, authorize('admin'), async (req, res) => {
  try {
    const { name } = req.body;
    
    // Find admin and update
    const admin = await User.findById(req.user._id);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Update fields
    admin.name = name || admin.name;
    
    // Handle profile picture upload if included
    if (req.files && req.files.profilePicture) {
      const file = req.files.profilePicture;
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate unique filename
      const filename = `profile_${admin._id}_${Date.now()}${path.extname(file.name)}`;
      const filepath = path.join(uploadsDir, filename);
      
      // Move the file
      await file.mv(filepath);
      
      // Set profile picture URL
      admin.profilePictureUrl = `/uploads/${filename}`;
    }
    
    // Save admin
    await admin.save();
    
    res.json({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt,
      lastLogin: admin.lastLogin,
      profilePictureUrl: admin.profilePictureUrl
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add more routes for updating user status, deleting projects, etc.

module.exports = router;
