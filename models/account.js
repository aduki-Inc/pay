const mongoose = require('mongoose');

// description This schema represents a account of a user
const account = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  hex: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  user: { type: String, required: true, ref: 'User' },
  balance: { type: Number, default: 0 },
  currency: { type: String, enum: ['USD', 'KES'], default: 'KES' },
  about: { type: String, required: true },
  kind: { type: String, enum: ['bank', 'paybill', 'till', 'phone', 'intl'], default: 'phone' },
	status: { type: String, enum: ['active', 'inactive', 'suspended', 'closed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Middleware to update the `updatedAt` timestamp on modification
account.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual to get user that owns the account
account.virtual('owner', {
  ref: 'User',
  localField: 'user',
  foreignField: 'hex'
});

// Virtual to get all the transactions owned by the account
account.virtual('transactions', {
  ref: 'Transaction',
  localField: 'hex',
  foreignField: 'account'
});

// Virtual to get all the apis owned by the account
account.virtual('apis', {
  ref: 'Api',
  localField: 'hex',
  foreignField: 'account'
});


module.exports = account;