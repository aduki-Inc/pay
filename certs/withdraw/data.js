const read = require('./read');

// Read the mpesa b2c certificate data: prod.cer and sand.cer
const b2c = async () => {
	const prod = await read('certs/b2c/prod.cer');
	const sand = await read('certs/b2c/sand.cer');
	return { prod, sand };
}

module.exports = async () => {
	const { prod, sand } = await b2c();
	return { prod, sand }
}