const { validate } = require('../../utils')

// Validator: function to validate user email data before saving
module.exports = async values => {
	const schema = {
		email: {
			type: 'string',
			required: true,
			maxLength: 32,
		},
	};
	
	return validate (values, schema);
};