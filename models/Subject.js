const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    trim: true
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: [1, 'Credits must be at least 1']
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Index for better query performance
subjectSchema.index({ name: 1 });
subjectSchema.index({ code: 1 });
subjectSchema.index({ grade: 1 });
subjectSchema.index({ status: 1 });

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject; 