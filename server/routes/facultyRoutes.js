const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// @desc    Get all faculty
// @route   GET /api/faculty
// @access  Public
router.get('/', async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' })
      .select('-password -projects.applicationDetails')
      .sort({ name: 1 });
    
    res.json(faculty);
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get faculty by ID
// @route   GET /api/faculty/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const faculty = await User.findOne({ 
      _id: req.params.id,
      role: 'faculty'
    }).select('-password');
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    res.json(faculty);
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update faculty profile
// @route   PUT /api/faculty/:id
// @access  Private (faculty owner or admin)
router.put('/:id', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    // Check if user is updating their own profile or is an admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    
    const faculty = await User.findById(req.params.id);
    
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    // Fields that can be updated
    const updateData = {
      name: req.body.name || faculty.name,
      designation: req.body.designation,
      school: req.body.school,
      cabinLocation: req.body.cabinLocation,
      overview: req.body.overview,
      updatedAt: Date.now()
    };
    
    // Handle free timings (sent as JSON string)
    if (req.body.freeTimings) {
      try {
        updateData.freeTimings = JSON.parse(req.body.freeTimings);
      } catch (err) {
        console.error('Error parsing freeTimings:', err);
      }
    }
    
    // Handle profile picture upload
    if (req.file) {
      // Remove old profile picture if exists
      if (faculty.profilePictureUrl) {
        const oldPicturePath = path.join(__dirname, '..', faculty.profilePictureUrl.replace(/^\//, ''));
        if (fs.existsSync(oldPicturePath)) {
          fs.unlinkSync(oldPicturePath);
        }
      }
      
      updateData.profilePictureUrl = `/uploads/${req.file.filename}`;
    }
    
    // Update faculty
    const updatedFaculty = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).select('-password');
    
    res.json(updatedFaculty);
  } catch (error) {
    console.error('Error updating faculty:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Add a project to faculty
// @route   POST /api/faculty/:id/projects
// @access  Private (faculty owner or admin)
router.post('/:id/projects', protect, async (req, res) => {
  try {
    // Check if user is updating their own profile or is an admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to add projects for this faculty' });
    }
    
    const { 
      title, 
      description, 
      status, 
      members,
      domain,
      requiredSkills,
      studentsRequired,
      applicationDeadline,
      attachmentUrls
    } = req.body;
    
    const faculty = await User.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    // Create new project
    const newProject = {
      title,
      description,
      status: status || 'Planning',
      members: Array.isArray(members) ? members : [],
      domain: domain || '',
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      studentsRequired: studentsRequired || 1,
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
      attachmentUrls: attachmentUrls || [],
      createdAt: Date.now()
    };
    
    // Add project to faculty
    faculty.projects.push(newProject);
    await faculty.save();
    
    // Return the new project
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({ message: 'Error adding project', error: error.message });
  }
});

// @desc    Update a project
// @route   PUT /api/faculty/:facultyId/projects/:projectId
// @access  Private (faculty owner or admin)
router.put('/:facultyId/projects/:projectId', protect, async (req, res) => {
  try {
    const { facultyId, projectId } = req.params;
    
    // Check if user is updating their own project or is an admin
    if (req.user._id.toString() !== facultyId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }
    
    const { 
      title, 
      description, 
      status, 
      members,
      domain,
      requiredSkills,
      studentsRequired,
      applicationDeadline
    } = req.body;
    
    const faculty = await User.findById(facultyId);
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    // Find project index
    const projectIndex = faculty.projects.findIndex(p => p._id.toString() === projectId);
    
    if (projectIndex === -1) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Update project with new data
    const currentProject = faculty.projects[projectIndex];
    
    // Only update fields that are provided
    if (title) currentProject.title = title;
    if (description) currentProject.description = description;
    if (status) currentProject.status = status;
    if (domain) currentProject.domain = domain;
    
    // For array fields, only update if provided
    if (members) {
      currentProject.members = Array.isArray(members) ? members : members.split(',').map(m => m.trim());
    }
    
    if (requiredSkills) {
      currentProject.requiredSkills = Array.isArray(requiredSkills) ? requiredSkills : requiredSkills.split(',').map(s => s.trim());
    }
    
    if (studentsRequired) {
      currentProject.studentsRequired = studentsRequired;
    }
    
    if (applicationDeadline) {
      currentProject.applicationDeadline = new Date(applicationDeadline);
    }
    
    // Add updatedAt timestamp
    currentProject.updatedAt = Date.now();
    
    // Save changes
    await faculty.save();
    
    // Return the updated project
    res.status(200).json(faculty.projects[projectIndex]);
    
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Delete a project
// @route   DELETE /api/faculty/:facultyId/projects/:projectId
// @access  Private (faculty owner or admin)
router.delete('/:facultyId/projects/:projectId', protect, async (req, res) => {
  try {
    const { facultyId, projectId } = req.params;
    
    // Check if user is the faculty member or an admin
    if (req.user._id.toString() !== facultyId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }
    
    const faculty = await User.findById(facultyId);
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    // Find project index
    const projectIndex = faculty.projects.findIndex(p => p._id.toString() === projectId);
    
    if (projectIndex === -1) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Remove the project
    faculty.projects.splice(projectIndex, 1);
    await faculty.save();
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update application status
// @route   PUT /api/faculty/:facultyId/projects/:projectId/applications/:applicationId
// @access  Private (faculty owner or admin)
router.put('/:facultyId/projects/:projectId/applications/:applicationId', protect, async (req, res) => {
  try {
    const { facultyId, projectId, applicationId } = req.params;
    const { status } = req.body;
    
    // Check if user is the faculty member or an admin
    if (req.user._id.toString() !== facultyId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }
    
    // Validate status
    const validStatuses = ['Applied', 'Shortlisted', 'Selected', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const faculty = await User.findById(facultyId);
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    // Find project and application
    const projectIndex = faculty.projects.findIndex(p => p._id.toString() === projectId);
    
    if (projectIndex === -1) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const applicationIndex = faculty.projects[projectIndex].applicationDetails.findIndex(
      app => app._id.toString() === applicationId
    );
    
    if (applicationIndex === -1) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Update application status
    faculty.projects[projectIndex].applicationDetails[applicationIndex].status = status;
    
    // If the status is "Selected", optionally update the project members list
    if (status === 'Selected') {
      const application = faculty.projects[projectIndex].applicationDetails[applicationIndex];
      
      // Check if student is already in members list
      const studentAlreadyMember = faculty.projects[projectIndex].members.includes(application.studentName);
      
      if (!studentAlreadyMember) {
        // Add student to members list if not already there
        faculty.projects[projectIndex].members.push(application.studentName);
      }
    }
    
    await faculty.save();
    
    res.json({
      message: 'Application status updated successfully',
      application: faculty.projects[projectIndex].applicationDetails[applicationIndex]
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get applications for a specific project
// @route   GET /api/faculty/:facultyId/projects/:projectId/applications
// @access  Private (faculty owner or admin)
router.get('/:facultyId/projects/:projectId/applications', protect, async (req, res) => {
  try {
    const { facultyId, projectId } = req.params;
    
    // Check if user is the faculty member or an admin
    if (req.user._id.toString() !== facultyId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these applications' });
    }
    
    const faculty = await User.findById(facultyId);
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    // Find project
    const project = faculty.projects.find(p => p._id.toString() === projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Return applications
    res.json(project.applicationDetails || []);
    
  } catch (error) {
    console.error('Error fetching project applications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
