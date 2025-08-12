const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // School Information
  schoolInfo: {
    name: {
      type: String,
      required: [true, 'School name is required'],
      trim: true
    },
    motto: {
      type: String,
      trim: true
    },
    logo: {
      type: String,
      default: null
    },
    address: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'Kenya'
    }
  },

  // Academic Calendar Settings
  academicCalendar: {
    currentAcademicYear: {
      type: String,
      required: [true, 'Current academic year is required'],
      default: '2024-2025'
    },
    currentTerm: {
      type: String,
      required: [true, 'Current term is required'],
      enum: ['Term 1', 'Term 2', 'Term 3'],
      default: 'Term 1'
    },
    terms: [{
      name: {
        type: String,
        required: true,
        enum: ['Term 1', 'Term 2', 'Term 3']
      },
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      },
      isActive: {
        type: Boolean,
        default: false
      }
    }],
    academicYears: [{
      year: {
        type: String,
        required: true
      },
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      },
      isActive: {
        type: Boolean,
        default: false
      }
    }]
  },

  // Admission Number Settings
  admissionNumberSettings: {
    pattern: {
      type: String,
      required: [true, 'Admission number pattern is required'],
      default: 'STD{year}{form}{sequence}',
      description: 'Use {year}, {form}, {sequence} as placeholders'
    },
    formSpecificPatterns: [{
      formLevel: {
        type: String,
        required: true
      },
      pattern: {
        type: String,
        required: true
      },
      description: String
    }],
    sequenceLength: {
      type: Number,
      default: 4,
      min: 1,
      max: 6
    },
    startSequence: {
      type: Number,
      default: 1
    },
    prefix: {
      type: String,
      default: ''
    },
    suffix: {
      type: String,
      default: ''
    },
    resetSequenceYearly: {
      type: Boolean,
      default: true
    },
    resetSequencePerForm: {
      type: Boolean,
      default: false
    }
  },

  // Timetable Settings
  timetableSettings: {
    schoolDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    periodsPerDay: {
      type: Number,
      default: 8,
      min: 1,
      max: 12
    },
    periodDuration: {
      type: Number,
      default: 40, // minutes
      min: 30,
      max: 120
    },
    breakDuration: {
      type: Number,
      default: 10, // minutes
      min: 5,
      max: 30
    },
    lunchBreakDuration: {
      type: Number,
      default: 30, // minutes
      min: 15,
      max: 60
    },
    schoolStartTime: {
      type: String,
      default: '08:00',
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
    },
    schoolEndTime: {
      type: String,
      default: '16:00',
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
    },
    allowDoublePeriods: {
      type: Boolean,
      default: true
    },
    maxConsecutiveDifficultSubjects: {
      type: Number,
      default: 2,
      min: 1,
      max: 4
    }
  },

  // Grading Settings
  gradingSettings: {
    gradingSystem: {
      type: String,
      enum: ['Letter Grades', 'Percentage', 'Points', 'Custom'],
      default: 'Letter Grades'
    },
    passingGrade: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    gradeScale: [{
      grade: {
        type: String,
        required: true
      },
      minScore: {
        type: Number,
        required: true
      },
      maxScore: {
        type: Number,
        required: true
      },
      points: {
        type: Number,
        required: true
      },
      description: String
    }]
  },

  // Fee Settings
  feeSettings: {
    currency: {
      type: String,
      default: 'KES',
      enum: ['KES', 'USD', 'EUR', 'GBP']
    },
    currencySymbol: {
      type: String,
      default: 'KSh'
    },
    lateFeePercentage: {
      type: Number,
      default: 5,
      min: 0,
      max: 50
    },
    gracePeriod: {
      type: Number,
      default: 7, // days
      min: 0,
      max: 30
    },
    paymentMethods: [{
      type: String,
      enum: ['Mpesa', 'Bank Transfer', 'Cash', 'Card', 'Cheque']
    }]
  },

  // Communication Settings
  communicationSettings: {
    smsEnabled: {
      type: Boolean,
      default: false
    },
    emailEnabled: {
      type: Boolean,
      default: true
    },
    pushNotificationsEnabled: {
      type: Boolean,
      default: true
    },
    smsProvider: {
      type: String,
      enum: ['AfricasTalking', 'Twilio', 'Custom'],
      default: 'AfricasTalking'
    },
    emailProvider: {
      type: String,
      enum: ['Gmail', 'Outlook', 'Custom SMTP'],
      default: 'Gmail'
    }
  },

  // Report Settings
  reportSettings: {
    includeLogo: {
      type: Boolean,
      default: true
    },
    includeSchoolInfo: {
      type: Boolean,
      default: true
    },
    defaultReportFormat: {
      type: String,
      enum: ['PDF', 'Excel', 'Word'],
      default: 'PDF'
    },
    reportFooter: {
      type: String,
      default: 'Generated by Jafasol School Management System'
    },
    signatureRequired: {
      type: Boolean,
      default: true
    },
    signatureImage: {
      type: String,
      default: null
    }
  },

  // System Settings
  systemSettings: {
    timezone: {
      type: String,
      default: 'Africa/Nairobi'
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY',
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']
    },
    timeFormat: {
      type: String,
      default: '12',
      enum: ['12', '24']
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'sw']
    },
    theme: {
      type: String,
      default: 'default',
      enum: ['default', 'dark', 'light', 'custom']
    },
    autoBackup: {
      type: Boolean,
      default: true
    },
    backupFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    }
  },

  // Security Settings
  securitySettings: {
    passwordPolicy: {
      minLength: {
        type: Number,
        default: 8,
        min: 6,
        max: 20
      },
      requireUppercase: {
        type: Boolean,
        default: true
      },
      requireLowercase: {
        type: Boolean,
        default: true
      },
      requireNumbers: {
        type: Boolean,
        default: true
      },
      requireSpecialChars: {
        type: Boolean,
        default: false
      }
    },
    sessionTimeout: {
      type: Number,
      default: 30, // minutes
      min: 5,
      max: 480
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: 3,
      max: 10
    },
    lockoutDuration: {
      type: Number,
      default: 15, // minutes
      min: 5,
      max: 60
    }
  }
}, {
  timestamps: true
});

// Indexes
// Methods
settingsSchema.methods.generateAdmissionNumber = function(formLevel, academicYear) {
  const settings = this.admissionNumberSettings;
  let pattern = settings.pattern;
  
  // Check for form-specific pattern
  const formPattern = settings.formSpecificPatterns.find(fp => fp.formLevel === formLevel);
  if (formPattern) {
    pattern = formPattern.pattern;
  }
  
  // Replace placeholders
  pattern = pattern.replace('{year}', academicYear.slice(-2));
  pattern = pattern.replace('{form}', formLevel);
  
  // Generate sequence
  const sequence = this.generateSequence(formLevel, academicYear);
  pattern = pattern.replace('{sequence}', sequence.toString().padStart(settings.sequenceLength, '0'));
  
  return settings.prefix + pattern + settings.suffix;
};

settingsSchema.methods.generateSequence = function(formLevel, academicYear) {
  // This would typically query the database to get the next sequence
  // For now, return a placeholder
  return Math.floor(Math.random() * 1000) + 1;
};

settingsSchema.methods.getCurrentTermDates = function() {
  const currentTerm = this.academicCalendar.terms.find(t => t.name === this.academicCalendar.currentTerm);
  return currentTerm || null;
};

settingsSchema.methods.isTermActive = function() {
  const currentTerm = this.getCurrentTermDates();
  if (!currentTerm) return false;
  
  const now = new Date();
  return now >= currentTerm.startDate && now <= currentTerm.endDate;
};

settingsSchema.methods.getNextTerm = function() {
  const terms = ['Term 1', 'Term 2', 'Term 3'];
  const currentIndex = terms.indexOf(this.academicCalendar.currentTerm);
  const nextIndex = (currentIndex + 1) % terms.length;
  return terms[nextIndex];
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;



