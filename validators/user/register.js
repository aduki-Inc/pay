const { validate } = require('../../utils')
const { hash: { generate } } = require('../../utils');

// Validator: function to validate user registration data before saving
module.exports = async values => {
	// generate a unique hex for the user
	values.hex = await generate ('U03')
	values.verified = false;
	const schema = {
		hex: {
			type: 'string',
			required: true,
			maxLength: 32,
		},
		email: {
			type: 'string',
			required: true,
			maxLength: 32,
		},
		verified: {
			type: 'boolean',
			required: true,
		},
		password: {
			type: 'password',
			required: true,
		},
		name: {
			type: 'string',
			required: true,
			maxLength: 32,
		},
		phone: {
			type: 'string',
			required: true,
			maxLength: 32,
		},
		about: {
			type: 'string',
			required: false
		},
		country: {
			type: 'string',
			required: true,
			maxLength: 32,
		},
		avatar: {
			type: 'string',
			required: false,
			maxLength: 255,
		},
	};
	
	return validate (values, schema);
};