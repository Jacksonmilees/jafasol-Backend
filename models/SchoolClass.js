const mongoose = require('mongoose');

const schoolClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    unique: true,
    trim: true
  },
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    trim: true
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Graduated'],
    default: 'Active'
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for class teacher
schoolClassSchema.virtual('teacher', {
  ref: 'Teacher',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true
});

// Virtual for students count
schoolClassSchema.virtual('studentsCount', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'classId',
  count: true
});

// Index for better query performance
schoolClassSchema.index({ name: 1 });
schoolClassSchema.index({ grade: 1 });
schoolClassSchema.index({ teacherId: 1 });
schoolClassSchema.index({ status: 1 });

const SchoolClass = mongoose.model('SchoolClass', schoolClassSchema);

module.exports = SchoolClass; 