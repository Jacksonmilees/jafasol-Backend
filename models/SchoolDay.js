const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Period name is required'],
    trim: true
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
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [5, 'Duration must be at least 5 minutes'],
    max: [180, 'Duration cannot exceed 180 minutes']
  },
  type: {
    type: String,
    enum: ['Teaching', 'Break', 'Lunch', 'Assembly', 'Study'],
    required: [true, 'Period type is required']
  },
  isTeachingPeriod: {
    type: Boolean,
    default: function() {
      return this.type === 'Teaching';
    }
  }
});

const schoolDaySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: [true, 'Day is required']
  },
  periods: [periodSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  term: {
    type: String,
    required: [true, 'Term is required']
  }
}, {
  timestamps: true
});

// Validation to ensure periods don't overlap
schoolDaySchema.pre('save', function(next) {
  const periods = this.periods.sort((a, b) => {
    const aTime = a.startTime.split(':').map(Number);
    const bTime = b.startTime.split(':').map(Number);
    return (aTime[0] * 60 + aTime[1]) - (bTime[0] * 60 + bTime[1]);
  });

  for (let i = 0; i < periods.length - 1; i++) {
    const current = periods[i];
    const next = periods[i + 1];
    
    const currentEnd = current.endTime.split(':').map(Number);
    const nextStart = next.startTime.split(':').map(Number);
    
    const currentEndMinutes = currentEnd[0] * 60 + currentEnd[1];
    const nextStartMinutes = nextStart[0] * 60 + nextStart[1];
    
    if (currentEndMinutes > nextStartMinutes) {
      return next(new Error(`Period overlap detected: ${current.name} ends at ${current.endTime} but ${next.name} starts at ${next.startTime}`));
    }
  }
  
  next();
});

// Index for better query performance
const SchoolDay = mongoose.model('SchoolDay', schoolDaySchema);

module.exports = SchoolDay;



