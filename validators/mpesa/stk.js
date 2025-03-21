// Validate withdrawal details: phone, amount, remarks
const phoneRegex = /^254[17]\d{8}$/;

// Validator: function to validate stk data (id, amount, phone, note )
module.exports = async values => {
	const validations = [
		{
			key: 'amount',
			validate: v => typeof v === 'number' && v >= 1 && v <= 70000,
			error: { code: 101, error: 'Amount should be 1 or more and ≤ 70,000' }
		},
		{
			key: 'phone',
			validate: v => phoneRegex.test(v),
			error: { code: 102, error: 'Invalid phone number' }
		}
	]
	
	for (const { key, validate, error } of validations) {
		if (!validate(values[key])) return { valid: false, data: error };
	}
	
	return { valid: true, data: values };
};