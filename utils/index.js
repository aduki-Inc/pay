const token = require('./token');
const { validate, sanitize} = require('./validator');
const generateHash = require('./hash');
module.exports = {
	token,
	hash: { generate: generateHash },
	validate, sanitize
}