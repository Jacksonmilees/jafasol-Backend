const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  logoUrl: {
    type: String,
    default: 'https://picsum.photos/seed/default/200/200'
  },
  plan: {
    type: String,
    enum: ['Basic', 'Premium', 'Enterprise'],
    default: 'Basic'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended', 'Pending'],
    default: 'Active'
  },
  subdomain: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  storageUsage: {
    type: Number,
    default: 0
  },
  modules: [{
    type: String,
    enum: ['attendance', 'fees', 'academics', 'analytics', 'communication', 'transport', 'library']
  }],
  settings: {
    theme: {
      type: String,
      default: 'default'
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    features: {
      attendance: { type: Boolean, default: true },
      fees: { type: Boolean, default: true },
      academics: { type: Boolean, default: true },
      analytics: { type: Boolean, default: false },
      communication: { type: Boolean, default: false },
      transport: { type: Boolean, default: false },
      library: { type: Boolean, default: false }
    }
  },
  subscription: {
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    paymentMethod: {
      type: String,
      enum: ['mpesa', 'card', 'bank'],
      default: 'mpesa'
    }
  },
  stats: {
    totalStudents: { type: Number, default: 0 },
    totalTeachers: { type: Number, default: 0 },
    totalClasses: { type: Number, default: 0 },
    monthlyRevenue: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Index for efficient queries
schoolSchema.index({ email: 1 });
schoolSchema.index({ subdomain: 1 });
schoolSchema.index({ status: 1 });
schoolSchema.index({ plan: 1 });
schoolSchema.index({ createdAt: -1 });

// Virtual for full domain
schoolSchema.virtual('fullDomain').get(function() {
  return this.subdomain ? `${this.subdomain}.jafasol.com` : null;
});

// Virtual for login URL
schoolSchema.virtual('loginUrl').get(function() {
  return this.subdomain ? `https://${this.subdomain}.jafasol.com` : null;
});

// Method to check if school is active
schoolSchema.methods.isActive = function() {
  return this.status === 'Active';
};

// Method to get storage usage percentage
schoolSchema.methods.getStorageUsagePercentage = function() {
  const maxStorage = this.plan === 'Enterprise' ? 100 : this.plan === 'Premium' ? 50 : 25;
  return (this.storageUsage / maxStorage) * 100;
};

// Pre-save middleware to update stats
schoolSchema.pre('save', async function(next) {
  if (this.isModified('stats')) {
    this.stats.lastActive = new Date();
  }
  next();
});

module.exports = mongoose.model('School', schoolSchema); 