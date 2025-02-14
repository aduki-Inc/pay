const { validate } = require('../../utils')

// Validator: function to validate user phone data before saving
module.exports = async values => {
	const schema = {
		phone: {
			type: 'string',
			required: true,
			maxLength: 32,
		},
	};
	
	return validate (values, schema);
}