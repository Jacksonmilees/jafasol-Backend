const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Exam = sequelize.define('Exam', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('CAT', 'Mid-Term', 'End-Term', 'Mock'),
    allowNull: false
  },
  term: {
    type: DataTypes.STRING,
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Upcoming', 'Ongoing', 'Completed'),
    defaultValue: 'Upcoming'
  },
  subjects: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  marksLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'exams',
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['startDate']
    }
  ]
});

module.exports = Exam; 