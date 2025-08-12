const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient ID is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  messageType: {
    type: String,
    enum: ['Internal', 'External', 'Announcement', 'Notification'],
    default: 'Internal'
  },
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Delivered', 'Read', 'Archived'],
    default: 'Draft'
  },
  readAt: {
    type: Date,
    default: null
  },
  attachments: {
    type: [{
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      path: String
    }],
    default: []
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: null
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ recipientId: 1, createdAt: -1 });
messageSchema.index({ status: 1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ priority: 1 });
messageSchema.index({ isUrgent: 1 });

// Virtual for message preview
messageSchema.virtual('preview').get(function() {
  return this.content.length > 100 ? this.content.substring(0, 100) + '...' : this.content;
});

// Virtual for isRead
messageSchema.virtual('isRead').get(function() {
  return this.readAt !== null;
});

// Virtual for timeAgo
messageSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
});

const Message = mongoose.model('Message', messageSchema);

module.exports = { Message }; 