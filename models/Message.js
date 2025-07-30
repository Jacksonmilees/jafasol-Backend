const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  recipientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('email', 'sms', 'notification', 'announcement'),
    allowNull: false,
    defaultValue: 'email'
  },
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'read', 'failed'),
    allowNull: false,
    defaultValue: 'sent'
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'messages',
  timestamps: true,
  indexes: [
    {
      fields: ['senderId', 'createdAt']
    },
    {
      fields: ['recipientId', 'status']
    },
    {
      fields: ['type']
    }
  ]
});

module.exports = { Message }; 