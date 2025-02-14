const { validate } = require('../../utils')

// Validator: function to validate user name data before saving
module.exports = async values => {
	const schema = {
		name: {
			type: 'string',
			required: true,
			maxLength: 32,
		},
	};
	
	return validate (values, schema);
};