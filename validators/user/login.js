const { validate } = require('../../utils');

// Validator: function to validate user login data before saving
module.exports = async values => {
	const schema = {
		email: {
			type: 'email',
			required: true,
		},
		password: {
			type: 'password',
			required: true,
		},
	};

	return validate (values, schema);
};