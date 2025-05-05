const User = require('../models/User');

// @desc    Get all faculty members
// @route   GET /api/faculty
// @access  Public
const getAllFaculty = async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' })
      .select('-password -__v')
      .sort({ name: 1 });
    
    res.json(faculty);
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({ message: 'Error fetching faculty data' });
  }
};

// @desc    Get faculty member by ID
// @route   GET /api/faculty/:id
// @access  Public
const getFacultyById = async (req, res) => {
  try {
    const faculty = await User.findOne({ 
      _id: req.params.id, 
      role: 'faculty' 
    }).select('-password -__v');
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    res.json(faculty);
  } catch (error) {
    console.error('Error fetching faculty member:', error);
    res.status(500).json({ message: 'Error fetching faculty data' });
  }
};

// @desc    Update faculty profile
// @route   PUT /api/faculty/:id
// @access  Private (faculty owner or admin)
const updateFacultyProfile = async (req, res) => {
  try {
    // Check if user is updating their own profile or is an admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    
    const { name, designation, school, cabinLocation, freeTimings, overview } = req.body;
    
    // Handle profile picture if included
    let profilePictureUrl;
    if (req.file) {
      profilePictureUrl = `/uploads/${req.file.filename}`;
    }
    
    // Parse freeTimings if it's a string
    let parsedFreeTimings;
    if (freeTimings && typeof freeTimings === 'string') {
      try {
        parsedFreeTimings = JSON.parse(freeTimings);
      } catch (error) {
        console.error('Error parsing freeTimings:', error);
      }
    }
    
    // Update user data
    const updateData = {
      name,
      designation,
      school,
      cabinLocation,
      overview,
      updatedAt: Date.now()
    };
    
    // Only add fields if they exist
    if (parsedFreeTimings) updateData.freeTimings = parsedFreeTimings;
    if (profilePictureUrl) updateData.profilePictureUrl = profilePictureUrl;
    
    const updatedFaculty = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -__v');
    
    if (!updatedFaculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    
    res.json(updatedFaculty);
  } catch (error) {
    console.error('Error updating faculty:', error);
    res.status(500).json({ message: 'Error updating faculty profile' });
  }
};

// @desc    Add a project to faculty
// @route   POST /api/faculty/:id/projects
// @access  Private (faculty owner or admin)
const addFacultyProject = async (req, res) => {
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
      members: Array.isArray(members) ? members : members.split(',').map(m => m.trim()),
      domain: domain || '',
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : requiredSkills.split(',').map(s => s.trim()),
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
    res.status(500).json({ message: 'Error adding project' });
  }
};

module.exports = {
  getAllFaculty,
  getFacultyById,
  updateFacultyProfile,
  addFacultyProject
};
