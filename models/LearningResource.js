const mongoose = require('mongoose');

const learningResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['Document', 'Video', 'Audio', 'Link', 'Image', 'Presentation', 'Worksheet', 'Quiz'],
    required: [true, 'Resource type is required']
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
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  fileUrl: {
    type: String,
    required: false,
    trim: true
  },
  fileSize: {
    type: Number,
    required: false
  },
  mimeType: {
    type: String,
    required: false
  },
  originalFilename: {
    type: String,
    required: false
  },
  externalUrl: {
    type: String,
    required: false,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty for non-link resources
        return /^https?:\/\/.+/.test(v);
      },
      message: 'External URL must be a valid HTTP/HTTPS URL'
    }
  },
  tags: {
    type: [String],
    default: []
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  language: {
    type: String,
    default: 'English'
  },
  duration: {
    type: Number, // in minutes
    required: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
learningResourceSchema.index({ type: 1 });
learningResourceSchema.index({ subjectId: 1 });
learningResourceSchema.index({ classId: 1 });
learningResourceSchema.index({ uploadedBy: 1 });
learningResourceSchema.index({ isPublic: 1 });
learningResourceSchema.index({ isActive: 1 });
learningResourceSchema.index({ tags: 1 });

// Text index for search functionality
learningResourceSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for file size in human readable format
learningResourceSchema.virtual('fileSizeFormatted').get(function() {
  if (!this.fileSize) return null;
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
  return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for duration in human readable format
learningResourceSchema.virtual('durationFormatted').get(function() {
  if (!this.duration) return null;
  
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Virtual for average rating
learningResourceSchema.virtual('averageRating').get(function() {
  return this.rating.toFixed(1);
});

const LearningResource = mongoose.model('LearningResource', learningResourceSchema);

module.exports = { LearningResource }; 