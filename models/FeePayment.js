const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeInvoice',
    required: [true, 'Invoice ID is required']
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0.01, 'Payment amount must be greater than 0']
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'Mobile Money', 'Credit Card', 'Other'],
    required: [true, 'Payment method is required']
  },
  referenceNumber: {
    type: String,
    trim: true
  },
  receiptNumber: {
    type: String,
    required: [true, 'Receipt number is required'],
    unique: true,
    trim: true
  },
  paymentDate: {
    type: Date,
    required: [true, 'Payment date is required'],
    default: Date.now
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Received by user is required']
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Cancelled', 'Refunded'],
    default: 'Completed'
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
feePaymentSchema.index({ invoiceId: 1 });
feePaymentSchema.index({ studentId: 1 });
feePaymentSchema.index({ receiptNumber: 1 });
feePaymentSchema.index({ paymentDate: 1 });
feePaymentSchema.index({ status: 1 });
feePaymentSchema.index({ isActive: 1 });

// Virtual for formatted payment date
feePaymentSchema.virtual('formattedPaymentDate').get(function() {
  return this.paymentDate.toLocaleDateString();
});

// Virtual for payment status color
feePaymentSchema.virtual('statusColor').get(function() {
  const colors = {
    'Pending': 'yellow',
    'Completed': 'green',
    'Failed': 'red',
    'Cancelled': 'gray',
    'Refunded': 'orange'
  };
  return colors[this.status] || 'gray';
});

const FeePayment = mongoose.model('FeePayment', feePaymentSchema);

module.exports = { FeePayment };

