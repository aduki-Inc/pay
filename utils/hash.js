const crypto = require('crypto');
// fn to generate hash

const generateHash = prefix => {
	// get milliseconds date from 1970 + 2 random numbers
	let data = Date.now().toString() + Math.random().toString() + Math.random().toString();
	let hash = crypto.createHash('sha256').update(data).digest('hex');
	
	// trim the hash to 19 characters, then add the prefix: to uppercase
	return (prefix + hash.slice(0, 19)).toUpperCase();
}

// export the function
module.exports = generateHash;