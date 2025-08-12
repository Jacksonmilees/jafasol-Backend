const mongoose = require('mongoose');

const feeInvoiceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  feeStructureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure',
    required: [true, 'Fee structure ID is required']
  },
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true
  },
  items: {
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
      }
    }],
    default: []
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  balance: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Pending'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
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
feeInvoiceSchema.index({ studentId: 1 });
feeInvoiceSchema.index({ invoiceNumber: 1 });
feeInvoiceSchema.index({ status: 1 });
feeInvoiceSchema.index({ dueDate: 1 });
feeInvoiceSchema.index({ isActive: 1 });

// Virtual for payment percentage
feeInvoiceSchema.virtual('paymentPercentage').get(function() {
  if (this.totalAmount === 0) return 100;
  return Math.round((this.paidAmount / this.totalAmount) * 100);
});

// Virtual for is overdue
feeInvoiceSchema.virtual('isOverdue').get(function() {
  if (this.status === 'Paid' || this.status === 'Cancelled') return false;
  return new Date() > this.dueDate;
});

// Virtual for days overdue
feeInvoiceSchema.virtual('daysOverdue').get(function() {
  if (!this.isOverdue) return 0;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = now - due;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

const FeeInvoice = mongoose.model('FeeInvoice', feeInvoiceSchema);

module.exports = { FeeInvoice };

