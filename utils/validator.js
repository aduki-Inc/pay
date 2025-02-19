// validate email using regex
const validateEmail = email => {
	const re = /\S+@\S+\.\S+/;
	return re.test(email);
}

// validate phone number: at least 10 digits
const validatePhone = phone => {
	return phone.length >= 10;
}

// validate password
const validatePassword = password => {
	// 1. password should be at least 6 characters long
	// 2. password should contain at least one uppercase letter
	// 3. password should contain at least one lowercase letter
	// 4. password should contain at least one number
	// 5. password should contain at least one special character
	const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/;
	return re.test(password);
}

// validate dob using date
const validateDob = dob => {
	const dateOfBirth = new Date(dob);
	const currentDate = new Date();
	
	// check if the user is under 18 years old
	if (dateOfBirth.getFullYear() > currentDate.getFullYear() - 18) {
		return false;
	}
}

// Sanitize function to sanitize form fields: sanitize(string)
const sanitize = value => {
	// Remove possible trailing and leading white spaces
	value = value.trim();
	
	// Escape HTML special characters to prevent XSS
	const escapeHtml = str =>
		str.replace(/[&<>"']/g, match => {
			switch (match) {
				case '&': return '&amp;';
				case '<': return '&lt;';
				case '>': return '&gt;';
				case '"': return '&quot;';
				case "'": return '&#39;';
				default: return match;
			}
		});
	
	// Return sanitized value
	return escapeHtml(value);
};

// validate function to validate form fields
const validate = (values, schema) => {
	for (const key in schema) {
		const rule = schema[key];
		const keyStr = key.toString();
		if (rule.required ){
			if (values[key] === undefined || values[key] === null || values[key] === ''){
				throw new Error(`${key} is required`);
			}
		}
		
		if(rule.type === 'boolean' && typeof values[key] !== 'boolean') {
			throw new Error(`${key} should be a boolean`);
		}
		
		if (rule.type === 'string'){
			if(typeof values[key] !== 'string') {
				throw new Error(`${key} should be a string`);
			} else {
				// sanitize string
				values[key] = sanitize(values[key]);
			}
		}
		
		// validate rule: content
		if (rule.type === 'content') {
			// the value should be an object
			if (typeof values[key] !== 'object') {
				throw new Error(`${key} should be an object`);
			}
			
			// check if the object has the required properties
			if (!values[key].encrypted || !values[key].nonce) {
				throw new Error(`${key} should have encrypted and nonce properties`);
			}
			
			// check if the encrypted and nonce properties are strings
			if (typeof values[key].encrypted !== 'string' || typeof values[key].nonce !== 'string') {
				throw new Error(`${key} encrypted and nonce should be strings`);
			}
		}
		
		// if the value is a number and has min and max values
		if (rule.type === 'number' && typeof values[key] !== 'number') {
			throw new Error(`${key} should be a number`);
		}
		
		// validate rule: min and max values for number
		if (rule.min && values[key] < rule.min) {
			throw new Error(`${key} should not be less than ${rule.min}`);
		}
		
		if (rule.max && values[key] > rule.max) {
			throw new Error(`${key} should not be more than ${rule.max}`);
		}
		
		// validate rule: password
		if (rule.type === 'password') {
			if (!validatePassword(values[key])) {
				throw new Error(`${key} should contain at least one uppercase letter, one lowercase letter, one number, one special character and should be at least 6 characters long`);
			}
		}
		
		if (rule.maxLength && values[key].length > rule.maxLength) {
			throw new Error(`${key} should not be more than ${rule.maxLength} characters`);
		}
		
		if (rule.minLength && values[key].length < rule.minLength) {
			throw new Error(`${key} should not be less than ${rule.minLength} characters`);
		}
		
		if (rule.maxValue && values[key] > rule.maxValue) {
			throw new Error(`${key} should not be more than ${rule.maxValue}`);
		}
		
		if (rule.minValue && values[key] < rule.minValue) {
			throw new Error(`${key} should not be less than ${rule.minValue}`);
		}
		
		// check and validate email
		if (rule.type === 'email') {
			if (!validateEmail(values[key])) {
				throw new Error('Email is not valid');
			}
		}
		
		// check and validate dob
		if (rule.type === 'dob') {
			if (validateDob(values[key])) {
				throw new Error('You must be 18 years and above');
			}
		}
		
		// check and validate phone number
		if (rule.type === 'phone') {
			if (!validatePhone(values[key])) {
				throw new Error('Phone number is not valid');
			}
		}
		
		// check and validate mpesa phone number
		if (rule.type === 'mpesaPhone') {
			if (!validateMpesaPhone(values[key])) {
				throw new Error('Invalid Mpesa phone number');
			}
		}
		
		// check enum values
		if (rule.enum && !rule.enum.includes(values[key])) {
			throw new Error(`${key} should be one of ${rule.enum.join(', ')}`);
		}
	}
	
	// return sanitized values: object
	return values;
}

// export functions
module.exports = {
	validate,
	sanitize
}