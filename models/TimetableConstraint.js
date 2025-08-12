const mongoose = require('mongoose');

const constraintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Constraint name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: [
      'TeacherUnavailable',
      'RoomUnavailable', 
      'ClassUnavailable',
      'SubjectPreference',
      'NoConsecutiveDifficult',
      'MaxPeriodsPerDay',
      'MinBreakBetweenSubjects',
      'PreferredTimeSlot',
      'AvoidTimeSlot',
      'DoublePeriodRequired',
      'LabRequired',
      'EquipmentRequired'
    ],
    required: [true, 'Constraint type is required']
  },
  description: {
    type: String,
    required: [true, 'Constraint description is required'],
    trim: true
  },
  severity: {
    type: String,
    enum: ['Hard', 'Soft'],
    required: [true, 'Constraint severity is required'],
    default: 'Soft'
  },
  weight: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
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
  },
  // Constraint parameters - flexible object to store different constraint data
  params: {
    // For TeacherUnavailable
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    
    // For time-based constraints
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    startTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
    },
    endTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
    },
    
    // For subject/class constraints
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolClass'
    },
    
    // For room/equipment constraints
    roomId: {
      type: String
    },
    equipment: [String],
    
    // For numeric constraints
    maxValue: Number,
    minValue: Number,
    
    // For preference constraints
    preferredDays: [String],
    avoidedDays: [String],
    preferredPeriods: [String],
    avoidedPeriods: [String],
    
    // Additional flexible parameters
    additionalData: mongoose.Schema.Types.Mixed
  },
  
  // Conditions when this constraint applies
  conditions: {
    appliesTo: {
      type: String,
      enum: ['All', 'Teacher', 'Subject', 'Class', 'Room', 'Time'],
      default: 'All'
    },
    specificIds: [String], // IDs this constraint applies to
    excludeIds: [String]   // IDs this constraint excludes
  },
  
  // Violation tracking
  violations: [{
    timetableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Timetable'
    },
    slotId: String,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Method to check if constraint is violated by a timetable slot
constraintSchema.methods.checkViolation = function(slot, timetable) {
  switch (this.type) {
    case 'TeacherUnavailable':
      return this.checkTeacherUnavailable(slot);
    case 'NoConsecutiveDifficult':
      return this.checkConsecutiveDifficult(slot, timetable);
    case 'MaxPeriodsPerDay':
      return this.checkMaxPeriodsPerDay(slot, timetable);
    case 'PreferredTimeSlot':
      return this.checkPreferredTimeSlot(slot);
    case 'AvoidTimeSlot':
      return this.checkAvoidTimeSlot(slot);
    default:
      return { violated: false, message: '' };
  }
};

constraintSchema.methods.checkTeacherUnavailable = function(slot) {
  if (this.params.teacherId && slot.teacherId.toString() === this.params.teacherId.toString()) {
    const slotDay = slot.day;
    const slotTime = slot.startTime;
    
    if (this.params.day && this.params.day === slotDay) {
      if (this.params.startTime && this.params.endTime) {
        const slotMinutes = this.timeToMinutes(slotTime);
        const startMinutes = this.timeToMinutes(this.params.startTime);
        const endMinutes = this.timeToMinutes(this.params.endTime);
        
        if (slotMinutes >= startMinutes && slotMinutes <= endMinutes) {
          return {
            violated: true,
            message: `Teacher is unavailable on ${slotDay} from ${this.params.startTime} to ${this.params.endTime}`
          };
        }
      }
    }
  }
  return { violated: false, message: '' };
};

constraintSchema.methods.checkConsecutiveDifficult = function(slot, timetable) {
  // This would check if there are too many difficult subjects in a row
  // Implementation would analyze adjacent time slots
  return { violated: false, message: '' };
};

constraintSchema.methods.checkMaxPeriodsPerDay = function(slot, timetable) {
  if (this.params.teacherId && slot.teacherId.toString() === this.params.teacherId.toString()) {
    const sameDay = timetable.slots.filter(s => 
      s.day === slot.day && 
      s.teacherId.toString() === slot.teacherId.toString()
    );
    
    if (sameDay.length > (this.params.maxValue || 6)) {
      return {
        violated: true,
        message: `Teacher exceeds maximum ${this.params.maxValue} periods per day`
      };
    }
  }
  return { violated: false, message: '' };
};

constraintSchema.methods.checkPreferredTimeSlot = function(slot) {
  if (this.params.subjectId && slot.subjectId.toString() === this.params.subjectId.toString()) {
    const preferredDays = this.params.preferredDays || [];
    const preferredPeriods = this.params.preferredPeriods || [];
    
    if (preferredDays.length > 0 && !preferredDays.includes(slot.day)) {
      return {
        violated: true,
        message: `Subject scheduled outside preferred days: ${preferredDays.join(', ')}`
      };
    }
  }
  return { violated: false, message: '' };
};

constraintSchema.methods.checkAvoidTimeSlot = function(slot) {
  const avoidedDays = this.params.avoidedDays || [];
  const avoidedPeriods = this.params.avoidedPeriods || [];
  
  if (avoidedDays.includes(slot.day)) {
    return {
      violated: true,
      message: `Slot scheduled on avoided day: ${slot.day}`
    };
  }
  
  return { violated: false, message: '' };
};

// Helper method to convert time string to minutes
constraintSchema.methods.timeToMinutes = function(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Index for better query performance
const TimetableConstraint = mongoose.model('TimetableConstraint', constraintSchema);

module.exports = TimetableConstraint;



