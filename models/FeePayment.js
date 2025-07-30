const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FeePayment = sequelize.define('FeePayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  method: {
    type: DataTypes.ENUM('Mpesa', 'Bank', 'Cash'),
    allowNull: false
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Completed', 'Failed'),
    defaultValue: 'Completed'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'fee_payments',
  indexes: [
    {
      fields: ['studentId']
    },
    {
      fields: ['method']
    },
    {
      fields: ['date']
    },
    {
      fields: ['transactionId']
    }
  ]
});

module.exports = FeePayment; 