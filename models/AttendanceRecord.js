const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Excused'],
    required: [true, 'Status is required']
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recorded by user is required']
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: false
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolClass',
    required: false
  },
  period: {
    type: String,
    required: false
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isExcused: {
    type: Boolean,
    default: false
  },
  excuseReason: {
    type: String,
    trim: true
  },
  excuseDocument: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
attendanceRecordSchema.index({ studentId: 1, date: 1 });
attendanceRecordSchema.index({ date: 1 });
attendanceRecordSchema.index({ status: 1 });
attendanceRecordSchema.index({ recordedBy: 1 });

// Virtual for formatted date
attendanceRecordSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString();
});

// Virtual for time
attendanceRecordSchema.virtual('time').get(function() {
  return this.date.toLocaleTimeString();
});

// Compound index for unique attendance records per student per day
attendanceRecordSchema.index({ studentId: 1, date: 1 }, { unique: true });

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

module.exports = { AttendanceRecord }; 