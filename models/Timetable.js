const mongoose = require('mongoose');

const timetableSlotSchema = new mongoose.Schema({
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
    ref: 'Teacher',
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
  }
});

const timetableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Timetable name is required'],
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
  type: {
    type: String,
    enum: ['Teaching', 'Exam'],
    required: [true, 'Timetable type is required'],
    default: 'Teaching'
  },
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Archived'],
    default: 'Draft'
  },
  slots: [timetableSlotSchema],
  generatedBy: {
    type: String,
    enum: ['Manual', 'Auto'],
    default: 'Manual'
  },
  generationSettings: {
    optimizeFor: {
      type: String,
      enum: ['BalancedWorkload', 'TeacherPreferences', 'SubjectDistribution', 'MinimizeConflicts'],
      default: 'BalancedWorkload'
    },
    allowBackToBackDifficult: {
      type: Boolean,
      default: false
    },
    maxPeriodsPerDayPerTeacher: {
      type: Number,
      default: 6,
      min: 1,
      max: 10
    },
    preferMorningForDifficult: {
      type: Boolean,
      default: true
    }
  },
  conflicts: [{
    type: {
      type: String,
      enum: ['TeacherDoubleBooked', 'RoomDoubleBooked', 'ClassDoubleBooked', 'SubjectOverload', 'TeacherOverload']
    },
    description: String,
    severity: {
      type: String,
      enum: ['Critical', 'Warning', 'Info']
    },
    slotIds: [String],
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  statistics: {
    totalSlots: {
      type: Number,
      default: 0
    },
    totalConflicts: {
      type: Number,
      default: 0
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageTeacherLoad: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Pre-save middleware to update statistics
timetableSchema.pre('save', function(next) {
  this.statistics.totalSlots = this.slots.length;
  this.statistics.totalConflicts = this.conflicts.filter(c => !c.resolved).length;
  
  // Calculate completion percentage based on required slots vs actual slots
  const requiredSlots = this.calculateRequiredSlots();
  this.statistics.completionPercentage = requiredSlots > 0 ? 
    Math.round((this.slots.length / requiredSlots) * 100) : 0;
  
  next();
});

// Method to calculate required slots based on subjects and classes
timetableSchema.methods.calculateRequiredSlots = function() {
  // This would be calculated based on subjects' periodsPerWeek and number of classes
  // For now, return a default value
  return 100;
};

// Method to detect conflicts
timetableSchema.methods.detectConflicts = function() {
  const conflicts = [];
  const slotsByTime = {};
  
  // Group slots by day and time
  this.slots.forEach(slot => {
    const timeKey = `${slot.day}-${slot.startTime}`;
    if (!slotsByTime[timeKey]) {
      slotsByTime[timeKey] = [];
    }
    slotsByTime[timeKey].push(slot);
  });
  
  // Check for conflicts
  Object.entries(slotsByTime).forEach(([timeKey, slots]) => {
    if (slots.length > 1) {
      // Check teacher conflicts
      const teacherIds = slots.map(s => s.teacherId.toString());
      const uniqueTeachers = [...new Set(teacherIds)];
      if (teacherIds.length !== uniqueTeachers.length) {
        conflicts.push({
          type: 'TeacherDoubleBooked',
          description: `Teacher is scheduled for multiple classes at ${timeKey}`,
          severity: 'Critical',
          slotIds: slots.map(s => s._id.toString()),
          resolved: false
        });
      }
      
      // Check class conflicts
      const classIds = slots.map(s => s.classId.toString());
      const uniqueClasses = [...new Set(classIds)];
      if (classIds.length !== uniqueClasses.length) {
        conflicts.push({
          type: 'ClassDoubleBooked',
          description: `Class is scheduled for multiple subjects at ${timeKey}`,
          severity: 'Critical',
          slotIds: slots.map(s => s._id.toString()),
          resolved: false
        });
      }
    }
  });
  
  this.conflicts = conflicts;
  return conflicts;
};

// Index for better query performance
const Timetable = mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;



