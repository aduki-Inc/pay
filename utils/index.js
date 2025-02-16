const token = require('./token');
const { validate, sanitize} = require('./validator');
const generateHash = require('./hash');
const timestamp = require('./timestamp');
module.exports = {
	token, timestamp,
	hash: { generate: generateHash },
	validate, sanitize
}