const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, trim: true },
  vehicleType: { type: String, required: true, trim: true },
  capacity: { type: Number, required: true },
  driverName: { type: String, required: true, trim: true },
  driverPhone: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Active', 'Inactive', 'Maintenance'], default: 'Active' },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  schoolSubdomain: { type: String, required: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema); 