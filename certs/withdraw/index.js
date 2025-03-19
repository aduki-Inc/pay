const crypto = require('crypto');
const data  = require('./data')

// fn: Generate a security credential
const credential = async password => {
	const { prod, sand } = await data();
	const buffer = await Buffer.from(password, 'utf8');
	const encrypted = await crypto.publicEncrypt(
		{
			key: prod,
			padding: crypto.constants.RSA_PKCS1_PADDING
		},
		buffer
	);
	return encrypted.toString('base64');
}

module.exports = credential;