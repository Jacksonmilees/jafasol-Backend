const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FeeInvoice = sequelize.define('FeeInvoice', {
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
  description: {
    type: DataTypes.STRING,
    allowNull: false
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
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Paid', 'Partial', 'Unpaid'),
    defaultValue: 'Unpaid'
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  }
}, {
  tableName: 'fee_invoices',
  indexes: [
    {
      fields: ['studentId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['date']
    }
  ]
});

module.exports = FeeInvoice; 