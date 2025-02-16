const { validate } = require('../../utils');

// Validator: function to validate user recovery data before saving
module.exports = async values => {
	const schema = {
		email: {
			type: 'string',
			required: true,
			length: 255,
		},
	};
	
	return validate(values, schema);
};