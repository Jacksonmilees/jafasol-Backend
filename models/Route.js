const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeName: { type: String, required: true, trim: true },
  startPoint: { type: String, required: true, trim: true },
  endPoint: { type: String, required: true, trim: true },
  stops: [{ type: String, required: true }],
  estimatedTime: { type: String, required: true, trim: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  schoolSubdomain: { type: String, required: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema); 