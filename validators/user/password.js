const { validate } = require('../../utils');

// Validator: function to validate user password data before saving
module.exports = async values => {
	const schema = {
		password: {
			type: 'password',
			required: true,
		},
	};
	
	return validate (values, schema);
};