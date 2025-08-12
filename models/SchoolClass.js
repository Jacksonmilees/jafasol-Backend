const mongoose = require('mongoose');

const schoolClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    unique: true,
    trim: true,
    maxLength: [50, 'Class name cannot exceed 50 characters']
  },
  formLevel: {
    type: String,
    required: [true, 'Form level is required'],
    trim: true,
    maxLength: [20, 'Form level cannot exceed 20 characters']
  },
  stream: {
    type: String,
    required: [true, 'Stream is required'],
    trim: true,
    maxLength: [10, 'Stream cannot exceed 10 characters']
  },
  teacher: {
    type: String,
    required: false, // Make teacher optional initially
    trim: true,
    maxLength: [100, 'Teacher name cannot exceed 100 characters'],
    default: null
  },
  classTeacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: false, // Make teacher assignment optional
    default: null
  },
  students: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Number of students cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: 'Number of students must be an integer'
    }
  },
  capacity: {
    type: Number,
    required: true,
    default: 50,
    min: [1, 'Capacity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Capacity must be an integer'
    }
  },
  academicYear: {
    type: String,
    required: true,
    default: '2024',
    trim: true,
    maxLength: [20, 'Academic year cannot exceed 20 characters']
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

// Virtual for class teacher details
schoolClassSchema.virtual('teacherDetails', {
  ref: 'Teacher',
  localField: 'classTeacherId',
  foreignField: '_id',
  justOne: true
});

// Virtual for students count (when populated)
schoolClassSchema.virtual('studentsCount', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'classId',
  count: true
});

const SchoolClass = mongoose.model('SchoolClass', schoolClassSchema);

module.exports = SchoolClass; 