const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BookIssue = sequelize.define('BookIssue', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bookId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'books',
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    }
  },
  issuedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  issuedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  returnedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  returnedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('borrowed', 'returned', 'overdue', 'lost'),
    allowNull: false,
    defaultValue: 'borrowed'
  },
  fine: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'book_issues',
  timestamps: true,
  indexes: [
    {
      fields: ['bookId', 'studentId', 'status']
    },
    {
      fields: ['studentId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['dueDate']
    }
  ]
});

module.exports = { BookIssue }; 