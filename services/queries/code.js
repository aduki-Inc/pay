const { Code } = require('../../models');
const crypto = require('crypto');
const { security: { randomKey } } = require('../../configs');
const { bull: { queues: { mail: mailQueue }} } = require('../../queues');

// Generate a unique hex code using a secret key and current timestamp
const generateHex = (len = 6) => {
	const timestamp = Date.now().toString();
	const hash = crypto.createHmac('sha256', randomKey)
		.update(timestamp)
		.digest('hex');
	return hash.slice(0, len).toUpperCase();
}

// Generate a random hex code of length `len: 6` and save to the database
const create = async user => {
	const hex = generateHex(6);
	const expiry = new Date(Date.now() + 600000); // 10 minutes from now
	
	// Use findOneAndUpdate with upsert to either update or create a new code
	const code = await Code.findOneAndUpdate(
		{ user: user.hex },
		{ code: hex, expiry },
		{ upsert: true, new: true, setDefaultsOnInsert: true }
	);
	
	// add a mail job to the queue
	await mailQueue.add('actionJob', {
		hex: user.hex,
		code: code.code,
		expiry: code.expiry,
		email: user.email,
		phone: user.phone
	}, { attempts: 3, backoff: 1000, removeOnComplete: true });
	
	return {
		hex: user.hex,
		code: code.code,
		expiry: code.expiry,
		email: user.email,
		phone: user.phone
	};
};

// Verify a code
const verify = async (user, code) => {
	const record = await Code.findOne({ user }).sort({ createdAt: -1 });
	if (!record) return false;

	return record.code === code && record.expiry > Date.now();
};

module.exports = { create, verify };