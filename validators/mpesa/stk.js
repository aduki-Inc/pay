const { validate } = require('../../utils');

// Validator: function to validate stk data (id, amount, phone, note )
module.exports = async values => {
	const schema = {
		id: { type: 'string', required: true },
		amount: { type: 'number', required: true, min: 1, max: 150000 },
		phone: { type: 'string', required: true },
		note: { type: 'string', required: false },
	};

	return validate(values, schema);
};