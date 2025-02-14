const jwt = require("jsonwebtoken");
const { security: { jwtExpiry, jwtSecret, refreshExpiry} } = require('../configs')

// A utility function for generating a jwt token with the user claims
const generateToken = async claims => {
	return jwt.sign({ user: claims }, jwtSecret, {
		expiresIn: jwtExpiry
	});
}

// A utility function for validating a jwt token and returning the user claims
const validateToken = async (token) => {
	try {
		const decoded = jwt.verify(token, jwtSecret);
		return { user: decoded.user, error: null };
	} catch (err) {
		return { user: null, error: err };
	}
}

module.exports = { sign: generateToken, verify: validateToken };