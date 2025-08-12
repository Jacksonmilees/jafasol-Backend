const mongoose = require('mongoose');

const bookIssueSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book ID is required']
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Issued by user is required']
  },
  issueDate: {
    type: Date,
    required: [true, 'Issue date is required'],
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  returnDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Issued', 'Returned', 'Overdue', 'Lost'],
    default: 'Issued'
  },
  fine: {
    type: Number,
    default: 0,
    min: [0, 'Fine cannot be negative']
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
bookIssueSchema.index({ bookId: 1 });
bookIssueSchema.index({ studentId: 1 });
bookIssueSchema.index({ status: 1 });
bookIssueSchema.index({ dueDate: 1 });
bookIssueSchema.index({ isActive: 1 });

// Virtual for days overdue
bookIssueSchema.virtual('daysOverdue').get(function() {
  if (this.status === 'Returned' || !this.dueDate) return 0;
  
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = now - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
});

// Virtual for is overdue
bookIssueSchema.virtual('isOverdue').get(function() {
  return this.daysOverdue > 0 && this.status === 'Issued';
});

// Virtual for days remaining
bookIssueSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'Returned' || !this.dueDate) return null;
  
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
});

const BookIssue = mongoose.model('BookIssue', bookIssueSchema);

module.exports = { BookIssue };

