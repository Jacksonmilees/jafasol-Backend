const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  teacherId: {
    type: String,
    required: [true, 'Teacher ID is required'],
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required']
  },
  // Class Teacher Role (1:1 relationship)
  isClassTeacher: {
    type: Boolean,
    default: false
  },
  assignedClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolClass',
    default: null
  },
  
  // Subject Teacher Role (M:M relationships)
  isSubjectTeacher: {
    type: Boolean,
    default: true
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolClass'
  }],
  qualification: {
    type: String,
    required: [true, 'Qualification is required'],
    trim: true
  },
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: [0, 'Experience cannot be negative']
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On-leave', 'Retired'],
    default: 'Active'
  },
  profilePicture: {
    type: String,
    default: null
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
teacherSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Validation: Ensure class teacher assignment is unique
teacherSchema.pre('save', async function(next) {
  if (this.isClassTeacher && this.assignedClass) {
    const existingClassTeacher = await this.constructor.findOne({
      assignedClass: this.assignedClass,
      isClassTeacher: true,
      _id: { $ne: this._id }
    });
    
    if (existingClassTeacher) {
      const error = new Error(`Class already has a class teacher: ${existingClassTeacher.fullName}`);
      error.name = 'ClassTeacherConflict';
      return next(error);
    }
  }
  next();
});

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher; 