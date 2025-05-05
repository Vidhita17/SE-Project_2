const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Get all projects
router.get('/', async (req, res) => {
  try {
    // Find all faculty users and collect their projects
    const faculty = await User.find({ role: 'faculty' });
    
    // Extract and flatten all projects with faculty info
    const projects = faculty.reduce((allProjects, facultyMember) => {
      const facultyProjects = (facultyMember.projects || []).map(project => ({
        id: project._id,
        title: project.title,
        description: project.description,
        status: project.status,
        domain: project.domain,
        requiredSkills: project.requiredSkills,
        studentsRequired: project.studentsRequired,
        applicationDeadline: project.applicationDeadline,
        members: project.members,
        attachmentUrls: project.attachmentUrls,
        createdAt: project.createdAt,
        facultyId: facultyMember._id,
        facultyName: facultyMember.name,
        facultyEmail: facultyMember.email
      }));
      
      return [...allProjects, ...facultyProjects];
    }, []);
    
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    // Since projects are embedded in faculty documents, this will be more complex
    // This is a placeholder implementation
    res.status(200).json({ message: `Get project with ID: ${req.params.id} - functionality to be implemented` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
