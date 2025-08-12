const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolClass',
    required: [true, 'Class ID is required']
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject ID is required']
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher ID is required']
  },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: [true, 'Day is required']
  },
  periodId: {
    type: String,
    required: [true, 'Period ID is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
  },
  roomId: {
    type: String,
    trim: true
  },
  isExam: {
    type: Boolean,
    default: false
  },
  examType: {
    type: String,
    enum: ['Midterm', 'Final', 'Quiz', 'Practical'],
    required: function() {
      return this.isExam;
    }
  },
  isDoublePeriod: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  term: {
    type: String,
    required: [true, 'Term is required']
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
timetableEntrySchema.index({ classId: 1, day: 1, startTime: 1 });
timetableEntrySchema.index({ teacherId: 1, day: 1, startTime: 1 });
timetableEntrySchema.index({ subjectId: 1 });
timetableEntrySchema.index({ academicYear: 1, term: 1 });
timetableEntrySchema.index({ isActive: 1 });

// Compound index for unique entries per class per day per period
timetableEntrySchema.index({ classId: 1, day: 1, periodId: 1, academicYear: 1, term: 1 }, { unique: true });

// Virtual for duration in minutes
timetableEntrySchema.virtual('durationMinutes').get(function() {
  if (!this.startTime || !this.endTime) return null;
  
  const start = new Date(`2000-01-01T${this.startTime}:00`);
  const end = new Date(`2000-01-01T${this.endTime}:00`);
  
  return Math.round((end - start) / (1000 * 60));
});

// Virtual for time slot
timetableEntrySchema.virtual('timeSlot').get(function() {
  return `${this.startTime} - ${this.endTime}`;
});

// Virtual for day number for sorting
timetableEntrySchema.virtual('dayNumber').get(function() {
  const dayMap = {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  return dayMap[this.day] || 0;
});

const TimetableEntry = mongoose.model('TimetableEntry', timetableEntrySchema);

module.exports = { TimetableEntry }; 