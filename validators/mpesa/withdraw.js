// Validate withdrawal details: phone, amount, remarks
const phoneRegex = /^254[17]\d{8}$/;

module.exports = async values => {
	const validations = [
		{
			key: 'phone',
			validate: v => phoneRegex.test(v),
			error: { code: 130, error: 'Invalid phone number' }
		},
		{
			key: 'amount',
			validate: v => typeof v === 'number' && v >= 1 && v <= 150000,
			error: { code: 131, error: 'Amount should be 1 or more and ≤ 150,000' }
		},
		{
			key: 'remarks',
			validate: v => typeof v === 'string',
			error: { code: 132, error: 'Remarks must be a string' }
		}
	];
	
	for (const { key, validate, error } of validations) {
		if (!validate(values[key])) return { valid: false, data: error };
	}
	return { valid: true, data: values };
};