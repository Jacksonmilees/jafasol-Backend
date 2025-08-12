const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Book = sequelize.define('Book', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isbn: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  copies: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  availableCopies: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  publishedYear: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  publisher: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('available', 'maintenance', 'lost'),
    allowNull: false,
    defaultValue: 'available'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'books',
  timestamps: true,
  indexes: [
    {
      fields: ['title']
    },
    {
      fields: ['author']
    },
    {
      fields: ['isbn'],
      unique: true
    },
    {
      fields: ['category']
    }
  ]
});

module.exports = { Book }; 