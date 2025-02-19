// validate mpesa phone number
// 1. starts with 254
// 2. followed by a 1 or 7
// 3. followed by 8 digits
const validatePhone = phone => {
	const re = /^254[17]\d{8}$/;
	return re.test(phone);
}

// validate mpesa amount
// 1. the amount should be a number
// 2. the amount should be 1 or more
// 3. the amount should be less than or equal to 150,000
const validateAmount = amount => {
	return amount > 0 && amount <= 150000;
}

// validate mpesa id
// 1. the id should be string
// 2. the id should be provided
// 3. the id should not contain special characters, spaces, apostrophes, or quotes just A-Z, a-z, 0-9, and -_
const validateId = id => {
	const re = /^[a-zA-Z0-9_-]*$/;
	return re.test(id);
}

// Validator: function to validate stk data (id, amount, phone, note )
module.exports = async values => {
	// check for note if not provided use the default note
	if (!values.note) values.note = 'Paid via Mpesa STK Push';

	// validate the values: phone
	values.phone = values.phone.toString();
	if (!validatePhone(values.phone)) return { valid: false, data: { code: 101, error: 'Invalid phone number' }};
	
	// validate the values: amount
	if(typeof values.amount !== 'number') return { valid: false, data: { code: 102, error: 'Amount should be a number' }};
	
	// validate the values: amount 1 0r more
	if(!validateAmount(values.amount)) return { valid: false, data: { code: 103, error: 'Amount should be 1 or more and less or equal to 150,000' }};
	
	// validate the values: id
	if(!values.id || typeof values.id !== 'string' || !validateId(values.id)) return { valid: false, data: { code: 104, error: 'Invalid id' }};
	
	// validate the values: note
	if(values.note && typeof values.note !== 'string') return { valid: false, data: { code: 105, error: 'Note should be a string' }};

	return { valid: true, data: values };
};