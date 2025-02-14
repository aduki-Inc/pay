const { validate } = require('../../utils')

// Validator: function to validate user about data before saving
module.exports = async values => {
	const schema = {
		about: {
			type: 'string',
			required: false
		},
	};
	
	return validate (values, schema);
};