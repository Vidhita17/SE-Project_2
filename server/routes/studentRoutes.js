const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Get student profile by ID
router.get('/:id', protect, async (req, res) => {
  try {
    // Check if user is accessing their own profile or is an admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access this profile' });
    }
    
    const student = await User.findById(req.params.id).select('-password');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student applications
router.get('/:id/applications', protect, async (req, res) => {
  try {
    // Check if user is accessing their own applications or is an admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these applications' });
    }
    
    const student = await User.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Find all faculty with projects that this student has applied to
    const faculty = await User.find({ 
      role: 'faculty',
      'projects.applicationDetails.studentId': student._id
    });
    
    // Extract application details
    const applications = [];
    faculty.forEach(faculty => {
      faculty.projects.forEach(project => {
        const studentApplication = project.applicationDetails.find(
          app => app.studentId.toString() === student._id.toString()
        );
        
        if (studentApplication) {
          applications.push({
            id: studentApplication._id,
            projectId: project._id,
            projectTitle: project.title,
            facultyId: faculty._id,
            facultyName: faculty.name,
            status: studentApplication.status,
            appliedDate: studentApplication.appliedDate,
            coverLetter: studentApplication.coverLetter
          });
        }
      });
    });
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching student applications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Apply to a project
router.post('/:id/applications', protect, async (req, res) => {
  try {
    // Check if user is submitting their own application
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to submit application for another student' });
    }
    
    const { projectId, facultyId, coverLetter } = req.body;
    
    // Validate required fields
    if (!projectId || !facultyId) {
      return res.status(400).json({ message: 'Project ID and Faculty ID are required' });
    }
    
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Find faculty and project
    const faculty = await User.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    // Find project in faculty's projects array
    const projectIndex = faculty.projects.findIndex(p => p._id.toString() === projectId);
    if (projectIndex === -1) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if student has already applied to this project
    const alreadyApplied = faculty.projects[projectIndex].applicationDetails.some(
      app => app.studentId.toString() === student._id.toString()
    );
    
    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied to this project' });
    }
    
    // Create application
    const newApplication = {
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      status: 'Applied',
      appliedDate: new Date(),
      coverLetter
    };
    
    // Add application to project
    faculty.projects[projectIndex].applicationDetails.push(newApplication);
    await faculty.save();
    
    res.status(201).json({ 
      message: 'Application submitted successfully',
      application: newApplication
    });
  } catch (error) {
    console.error('Error applying to project:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Withdraw application
router.delete('/:id/applications/:applicationId', protect, async (req, res) => {
  try {
    // Check if user is withdrawing their own application
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to withdraw application for another student' });
    }
    
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Find faculty with the application
    const faculty = await User.findOne({
      role: 'faculty',
      'projects.applicationDetails._id': req.params.applicationId
    });
    
    if (!faculty) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Find project and application
    let projectIndex = -1;
    let applicationIndex = -1;
    
    for (let i = 0; i < faculty.projects.length; i++) {
      const appIndex = faculty.projects[i].applicationDetails.findIndex(
        app => app._id.toString() === req.params.applicationId
      );
      
      if (appIndex !== -1) {
        projectIndex = i;
        applicationIndex = appIndex;
        break;
      }
    }
    
    if (projectIndex === -1 || applicationIndex === -1) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Verify the application belongs to the student
    if (faculty.projects[projectIndex].applicationDetails[applicationIndex].studentId.toString() !== student._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to withdraw this application' });
    }
    
    // Check if application can be withdrawn (only if status is 'Applied')
    const appStatus = faculty.projects[projectIndex].applicationDetails[applicationIndex].status;
    if (appStatus !== 'Applied') {
      return res.status(400).json({ 
        message: `Cannot withdraw application with status '${appStatus}'` 
      });
    }
    
    // Remove application
    faculty.projects[projectIndex].applicationDetails.splice(applicationIndex, 1);
    await faculty.save();
    
    res.json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student profile data (for dashboard)
router.get('/:id/profile', protect, async (req, res) => {
  try {
    // Check if user is accessing their own profile or is an admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access this profile' });
    }
    
    const student = await User.findById(req.params.id).select('-password');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Return formatted profile data
    res.json({
      id: student._id,
      name: student.name,
      email: student.email,
      rollNumber: student.rollNumber,
      program: student.program,
      specialization: student.specialization,
      school: student.school,
      github: student.github,
      linkedin: student.linkedin,
      resumeUrl: student.resumeUrl
    });
  } catch (error) {
    console.error('Error fetching student profile data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update student profile
router.put('/:id', protect, async (req, res) => {
  try {
    // Check if user is updating their own profile or is an admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    
    const student = await User.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Fields that can be updated
    const {
      name,
      rollNumber,
      program,
      specialization,
      school,
      github,
      linkedin
    } = req.body;
    
    // Update fields
    if (name) student.name = name;
    if (rollNumber) student.rollNumber = rollNumber;
    if (program) student.program = program;
    if (specialization) student.specialization = specialization;
    if (school) student.school = school;
    if (github !== undefined) student.github = github;
    if (linkedin !== undefined) student.linkedin = linkedin;
    
    // Handle resume upload if included
    if (req.files && req.files.resume) {
      const resume = req.files.resume;
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads/resumes');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate unique filename
      const filename = `resume_${student._id}_${Date.now()}${path.extname(resume.name)}`;
      const filepath = path.join(uploadsDir, filename);
      
      // Move the file
      await resume.mv(filepath);
      
      // Update resume URL in student document
      student.resumeUrl = `/uploads/resumes/${filename}`;
    }
    
    await student.save();
    
    res.json({
      id: student._id,
      name: student.name,
      email: student.email,
      rollNumber: student.rollNumber,
      program: student.program,
      specialization: student.specialization,
      school: student.school,
      github: student.github,
      linkedin: student.linkedin,
      resumeUrl: student.resumeUrl
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student resume
router.get('/:id/resume', async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('resumeUrl');
    
    if (!student || !student.resumeUrl) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    // Remove leading slash if present
    const resumePath = student.resumeUrl.startsWith('/') 
      ? path.join(__dirname, '..', student.resumeUrl)
      : path.join(__dirname, '../', student.resumeUrl);
    
    // Check if file exists
    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ message: 'Resume file not found' });
    }
    
    res.sendFile(resumePath);
  } catch (error) {
    console.error('Error retrieving resume:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
