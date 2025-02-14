const { validate } = require('../../utils')

// Validator: function to validate account username data before saving
module.exports = async values => {
	const schema = {
		username: {
			type: 'string',
			required: true,
			maxLength: 255,
		},
	};
	
	return validate (values, schema);
};