const { validate } = require('../../utils');

// Validator: function to validate user avatar data before saving
module.exports = async values => {
	const schema = {
		avatar: {
			type: 'string',
			required: true,
		},
	};

	return validate (values, schema);
};