const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LearningResource = sequelize.define('LearningResource', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('document', 'video', 'audio', 'link', 'interactive'),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  grade: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER, // in seconds
    allowNull: true
  },
  tags: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  viewCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'learning_resources',
  timestamps: true,
  indexes: [
    {
      fields: ['title']
    },
    {
      fields: ['subject']
    },
    {
      fields: ['grade']
    },
    {
      fields: ['type']
    },
    {
      fields: ['uploadedBy']
    }
  ]
});

module.exports = { LearningResource }; 