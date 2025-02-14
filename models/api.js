const mongoose = require('mongoose');

// api: This schema represents a api for accessing the application
const api = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  accout: { type: String, required: true, ref: 'Account' },
  name: { type: String, required: true },
  key: { type: String, required: true, unique: true },
  secret: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Middleware to update the `updatedAt` timestamp on modification
api.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual to get account that owns the api
api.virtual('owner', {
  ref: 'Account',
  localField: 'account',
  foreignField: 'hex'
});

module.exports = api;