const { validate } = require('../../utils');

// Validator: function to validate user country data before saving
module.exports = async values => {
	const schema = {
		country: {
			type: 'string',
			required: true,
			maxLength: 32,
		},
	};

	return validate (values, schema);
};