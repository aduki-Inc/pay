const mongoose = require('mongoose');

// This schema represents a transaction
const transaction =  new mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
	hex: { type: String, required: true, unique: true },
	account: { type: String, required: true, ref: 'Account' },
	amount: { type: Number, required: true },
	method: { type: String, enum: ['mpesa', 'card', 'paypal', 'stripe', 'bank'], required: true },
	status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
	note: { type: String, default: null },
	supporter: { type: String, default: null },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});


// Middleware to update the `updatedAt` timestamp on modification
transaction.pre('save', function (next) {
	this.updatedAt = Date.now();
	next();
});

// Virtual to get account that owns the transaction
transaction.virtual('owner', {
	ref: 'Account',
	localField: 'account',
	foreignField: 'hex'
});


//export the model
module.exports = transaction;