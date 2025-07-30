const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    enum: ['Admin', 'Teacher', 'Student', 'Parent', 'Staff']
  },
  description: {
    type: String,
    required: [true, 'Role description is required'],
    trim: true
  },
  permissions: {
    type: Map,
    of: [String],
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
roleSchema.index({ name: 1 });
roleSchema.index({ isActive: 1 });

const Role = mongoose.model('Role', roleSchema);

module.exports = Role; 