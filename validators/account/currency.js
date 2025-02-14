const { validate } = require('../../utils');

// Validator: function to validate account currency data before saving
module.exports = async values => {
	const schema = {
		currency: {
			type: 'string',
			required: true,
			enum: ['USD', 'KES'],
		},
	};
	
	return validate(values, schema);
};