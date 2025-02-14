const mongoose = require('mongoose');
const bycrypt = require('bcryptjs');

// description This schema represents a user in the application
const user = new mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
	hex: { type: String, required: true, unique: true },
	email: { type: String, required: true, unique: true },
	verified: { type: Boolean, default: false },
	password: { type: String, required: true },
	name: { type: String, required: true },
	phone: { type: String, required: true, unique: true },
	about: { type: String, default: null },
	country: { type: String, required: true },
	avatar: { type: String, default: null },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
})

// Code: schema to store verification codes
const code = new mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	code: { type: String, required: true },
	expiry: { type: Date, required: true },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});

// Middleware to update the `updatedAt` timestamp on modification
user.pre('save', function (next) {
	this.updatedAt = Date.now();
	
	// Encrypt the password before saving
	this.password = bycrypt.hashSync(this.password, 10);
	
	next();
});

// Middleware to update the `updatedAt` timestamp on modification
code.pre('save', function (next) {
	this.updatedAt = Date.now();
	next();
});

// Virtual to get all the accounts owned by the user
user.virtual('accounts', {
	ref: 'Account',
	localField: 'hex',
	foreignField: 'user'
});

// Virtual to get all the codes owned by the user
user.virtual('codes', {
	ref: 'Code',
	localField: 'hex',
	foreignField: 'user'
});

// Mongoose Model
module.exports = { user, code };