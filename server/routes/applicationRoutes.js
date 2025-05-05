const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');

// @desc    Submit application to a project
// @route   POST /api/applications
// @access  Private (students only)
router.post('/', protect, authorize('student'), async (req, res) => {
  try {
    const { projectId, facultyId, coverLetter } = req.body;
    
    // Validate required fields
    if (!projectId || !facultyId) {
      return res.status(400).json({ message: 'Project ID and Faculty ID are required' });
    }
    
    // Get student information
    const student = await User.findById(req.user._id);
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

// @desc    Get all applications for a student
// @route   GET /api/applications/student/:studentId
// @access  Private (student owner or admin)
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    // Check if user is accessing their own applications or is an admin
    if (req.user._id.toString() !== req.params.studentId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these applications' });
    }
    
    const student = await User.findById(req.params.studentId);
    
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

// @desc    Withdraw an application
// @route   DELETE /api/applications/:applicationId
// @access  Private (student owner)
router.delete('/:applicationId', protect, async (req, res) => {
  try {
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
    if (faculty.projects[projectIndex].applicationDetails[applicationIndex].studentId.toString() !== req.user._id.toString()) {
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

// @desc    Update application status (for faculty)
// @route   PUT /api/applications/:applicationId/status
// @access  Private (faculty owner or admin)
router.put('/:applicationId/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['Applied', 'Shortlisted', 'Selected', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // Find faculty with the application
    const faculty = await User.findOne({
      role: 'faculty',
      'projects.applicationDetails._id': req.params.applicationId
    });
    
    if (!faculty) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Check if user is the faculty member or an admin
    if (req.user._id.toString() !== faculty._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this application' });
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

module.exports = router;
