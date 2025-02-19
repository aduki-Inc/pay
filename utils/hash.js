const crypto = require('crypto');
const { security: { randomKey } } = require('../configs');

const generateHash = prefix => {
	// get milliseconds date from 1970
	let data = `${Date.now()}${randomKey}}`;
	let hash = crypto.createHash('sha256').update(data).digest('hex');
	
	// trim the hash to 19 characters, then add the prefix: to uppercase
	return (prefix + hash.slice(0, 19)).toUpperCase();
}

const longHash = prefix => {
	// get milliseconds date from 1970
	let data = `${Date.now()}${randomKey}}`;
	let hash = crypto.createHash('sha256').update(data).digest('hex');
	
	// trim the hash to 32 characters, then add the prefix: to uppercase
	return (prefix + hash.slice(0, 32)).toUpperCase();
}

// export the function
module.exports = { generate: generateHash, generateLong: longHash };