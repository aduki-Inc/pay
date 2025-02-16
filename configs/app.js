convertToNumber = (value, alt) => {
	try {
		const num = parseInt(value);
		if(isNaN(num)) {
			return alt;
		}
		
		return num;
	} catch (error) {
		return alt;
	}
}

module.exports = {
	app: {
		host: process.env.APP_HOST,
		port: process.env.APP_PORT,
		name: process.env.APP_NAME,
		env:  process.env.APP_ENV,
		url: process.env.APP_URL,
	},
	security: {
		salt: process.env.AUTH_SALT,
		jwtSecret: process.env.JWT_SECRET,
		// alt value it to be 10 days in milliseconds
		jwtExpiry: convertToNumber(process.env.JWT_EXPIRES_IN, 864000000),
		refreshExpiry: process.env.JWT_REFRESH_EXPIRES_IN,
		randomKey: process.env.RANDOM_KEY,
	}
}