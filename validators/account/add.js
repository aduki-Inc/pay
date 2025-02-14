const { validate } = require('../../utils');
const { hash: { generate } } = require('../../utils');

// Validator: function to validate account data before saving
module.exports = async (values, user) => {
	values.hex = await generate('A0U');
	values.user = user.username;
	values.balance = 0;
	values.status = 'active';
	const schema = {
		hex: {
			type: 'string',
			required: true,
			maxLength: 255,
		},
		username: {
			type: 'string',
			required: true,
			maxLength: 255,
		},
		user: {
			type: 'string',
			required: true,
			maxLength: 255,
		},
		balance: {
			type: 'number',
			required: false,
		},
		currency: {
			type: 'string',
			required: false,
			enum: ['USD', 'KES'],
		},
		about: {
			type: 'string',
			required: true
		},
		kind: {
			type: 'string',
			required: false,
			enum: ['bank', 'paybill', 'till', 'phone', 'intl'],
		},
		status: {
			type: 'string',
			required: false,
			enum: ['active', 'inactive', 'suspended', 'closed'],
		},
	};

	return validate(values, schema);
};