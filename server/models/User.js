const mongoose = require('mongoose');

// Enhanced User Schema with validation and structure
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        // Skip validation for admin role
        if (this.role === 'admin') return true;
        return /^.+@mahindrauniversity\.edu\.in$/.test(v);
      },
      message: props => `${props.value} is not a valid Mahindra University email! Admin accounts can use any email domain.`
    }
  },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['student', 'faculty', 'admin'] },
  
  // Faculty-specific fields
  designation: { type: String },
  school: { type: String },
  cabinLocation: { type: String },
  freeTimings: [{ day: String, hours: String }],
  overview: { type: String },
  projects: [{
    title: { type: String, required: true },
    description: { type: String, required: true },
    domain: { type: String, required: true },
    requiredSkills: [{ type: String }],
    studentsRequired: { type: Number, default: 1 },
    applicationDeadline: { type: Date },
    status: { type: String, default: 'Planning', enum: ['Planning', 'In Progress', 'Completed'] },
    attachmentUrls: [{ type: String }],
    members: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    applicationDetails: [{
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      studentName: { type: String },
      studentEmail: { type: String },
      status: { type: String, default: 'Applied', enum: ['Applied', 'Shortlisted', 'Selected', 'Rejected'] },
      appliedDate: { type: Date, default: Date.now },
      coverLetter: { type: String }
    }]
  }],
  
  // Student-specific fields
  rollNumber: { type: String },
  dateOfBirth: { type: Date },
  program: { type: String },
  specialization: { type: String },
  resumeUrl: { type: String },
  github: { type: String },
  linkedin: { type: String },
  skills: [{ type: String }],
  interests: [{ type: String }],
  applications: [{
    projectId: { type: mongoose.Schema.Types.ObjectId },
    projectTitle: { type: String },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    facultyName: { type: String },
    status: { type: String, default: 'Applied', enum: ['Applied', 'Shortlisted', 'Selected', 'Rejected'] },
    appliedDate: { type: Date, default: Date.now },
    coverLetter: { type: String }
  }],
  
  // Common fields
  profilePictureUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
