const User = require('../models/User');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
const getAllProjects = async (req, res) => {
  try {
    const facultyWithProjects = await User.find(
      { role: 'faculty', 'projects.0': { $exists: true } }
    ).select('name projects');
    
    // Flatten projects from all faculty
    const allProjects = [];
    
    facultyWithProjects.forEach(faculty => {
      faculty.projects.forEach(project => {
        allProjects.push({
          id: project._id,
          title: project.title,
          description: project.description,
          status: project.status,
          members: project.members,
          facultyName: faculty.name,
          facultyId: faculty._id
        });
      });
    });
    
    res.json(allProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching project data' });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private (admin only)
const deleteProject = async (req, res) => {
  try {
    // Only admin can delete any project
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete projects' });
    }

    const { facultyId, projectId } = req.params;
    
    // Find the faculty and update to remove the project
    const faculty = await User.findById(facultyId);
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    // Find and remove the project
    const projectIndex = faculty.projects.findIndex(
      p => p._id.toString() === projectId
    );
    
    if (projectIndex === -1) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Remove the project
    faculty.projects.splice(projectIndex, 1);
    await faculty.save();
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Error deleting project' });
  }
};

module.exports = {
  getAllProjects,
  deleteProject
};
