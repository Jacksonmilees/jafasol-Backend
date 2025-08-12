const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    unique: true,
    trim: true,
    maxLength: [100, 'Subject name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    trim: true,
    maxLength: [10, 'Subject code cannot exceed 10 characters']
  },
  curriculum: {
    type: String,
    required: [true, 'Curriculum is required'],
    enum: ['8-4-4', 'International', 'CBC', 'American', 'British', 'Indian', 'Nigerian', 'South African'],
    default: '8-4-4'
  },
  formLevels: {
    type: [String],
    required: [true, 'Form levels are required'],
    validate: {
      validator: function(levels) {
        return levels && levels.length > 0 && levels.every(level => 
          typeof level === 'string' && level.trim().length > 0
        );
      },
      message: 'Form levels must be an array of non-empty strings'
    }
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  // Timetabling constraints
  periodsPerWeek: {
    type: Number,
    required: [true, 'Periods per week is required'],
    min: [1, 'Must have at least 1 period per week'],
    max: [20, 'Cannot exceed 20 periods per week'],
    default: 3
  },
  periodDuration: {
    type: Number, // in minutes
    required: [true, 'Period duration is required'],
    min: [30, 'Period must be at least 30 minutes'],
    max: [120, 'Period cannot exceed 120 minutes'],
    default: 40
  },
  difficultyLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
    required: true
  },
  preferredTimeSlots: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    period: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening'],
      required: true
    }
  }],
  requiresLab: {
    type: Boolean,
    default: false
  },
  requiresEquipment: [{
    type: String,
    trim: true
  }],
  canBeDoublePeriod: {
    type: Boolean,
    default: false
  },
  examDuration: {
    type: Number, // in minutes
    min: [30, 'Exam must be at least 30 minutes'],
    max: [180, 'Exam cannot exceed 180 minutes'],
    default: 60
  },
  subjectCategory: {
    type: String,
    enum: ['Core', 'Science', 'Arts', 'Language', 'Mathematics', 'Physical Education', 'Technical', 'Optional'],
    default: 'Core'
  },
  assignedTeachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  }]
}, {
  timestamps: true
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject; 