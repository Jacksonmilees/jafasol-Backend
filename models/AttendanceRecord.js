const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AttendanceRecord = sequelize.define('AttendanceRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
    allowNull: false,
    defaultValue: 'present'
  },
  timeIn: {
    type: DataTypes.TIME,
    allowNull: true
  },
  timeOut: {
    type: DataTypes.TIME,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  recordedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'attendance_records',
  timestamps: true,
  indexes: [
    {
      fields: ['studentId', 'date'],
      unique: true
    },
    {
      fields: ['date']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = { AttendanceRecord }; 