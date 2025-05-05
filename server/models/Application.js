const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  coverLetter: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Applied', 'Shortlisted', 'Selected', 'Rejected'],
    default: 'Applied'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  feedback: {
    type: String,
    default: ''
  },
  interviewDate: Date,
  interviewLocation: String,
  interviewNotes: String
}, { timestamps: true });

// Virtual field to determine if application can be withdrawn
ApplicationSchema.virtual('canWithdraw').get(function() {
  return this.status === 'Applied';
});

// Virtual field to determine if the application is active
ApplicationSchema.virtual('isActive').get(function() {
  return ['Applied', 'Shortlisted'].includes(this.status);
});

module.exports = mongoose.model('Application', ApplicationSchema);
