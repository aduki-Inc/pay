const { validate } = require('../../utils');

// Validator: function to validate stk data (id, amount, phone, note )
module.exports = async values => {
	// check for note if not provided use the default note
	if (!values.note) values.note = 'Paid via Mpesa STK Push';
	const schema = {
		id: { type: 'string', required: true },
		amount: { type: 'number', required: true, min: 1, max: 150000 },
		phone: { type: 'string', required: true },
		note: { type: 'string', required: false },
	};

	return validate(values, schema);
};