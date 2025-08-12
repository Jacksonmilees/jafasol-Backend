const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Fee structure name is required'],
    trim: true
  },
  description: {
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
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolClass',
    required: [true, 'Class is required']
  },
  fees: {
    type: [{
      name: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true,
        min: [0, 'Amount cannot be negative']
      },
      dueDate: {
        type: Date,
        required: true
      },
      isOptional: {
        type: Boolean,
        default: false
      },
      description: String
    }],
    default: []
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
feeStructureSchema.index({ academicYear: 1, term: 1 });
feeStructureSchema.index({ classId: 1 });
feeStructureSchema.index({ isActive: 1 });

// Virtual for mandatory fees
feeStructureSchema.virtual('mandatoryFees').get(function() {
  return this.fees.filter(fee => !fee.isOptional);
});

// Virtual for optional fees
feeStructureSchema.virtual('optionalFees').get(function() {
  return this.fees.filter(fee => fee.isOptional);
});

// Virtual for mandatory total
feeStructureSchema.virtual('mandatoryTotal').get(function() {
  return this.mandatoryFees.reduce((sum, fee) => sum + fee.amount, 0);
});

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);

module.exports = { FeeStructure };

