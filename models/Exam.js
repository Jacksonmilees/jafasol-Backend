const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exam name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['CAT', 'Mid-Term', 'End-Term', 'Mock'],
    required: [true, 'Exam type is required']
  },
  term: {
    type: String,
    required: [true, 'Term is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: false
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed'],
    default: 'Upcoming'
  },
  subjects: {
    type: [{
      subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
      },
      subjectName: String,
      maxMarks: Number,
      passMarks: Number
    }],
    default: []
  },
  marksLocked: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true
  },
  instructions: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
examSchema.index({ type: 1 });
examSchema.index({ status: 1 });
examSchema.index({ startDate: 1 });
examSchema.index({ academicYear: 1, term: 1 });

// Virtual for exam duration
examSchema.virtual('duration').get(function() {
  if (this.startDate && this.endDate) {
    return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Virtual for exam status based on dates
examSchema.virtual('computedStatus').get(function() {
  const now = new Date();
  if (this.startDate && this.endDate) {
    if (now < this.startDate) return 'Upcoming';
    if (now >= this.startDate && now <= this.endDate) return 'Ongoing';
    return 'Completed';
  }
  return this.status;
});

module.exports = mongoose.model('Exam', examSchema); 