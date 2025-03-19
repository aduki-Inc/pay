const read = require('./read');

// Read the mpesa withdraw certificate data: prod.cer and sand.cer
const b2c = async () => {
	const prod = await read('certs/withdraw/prod.cer');
	const sand = await read('certs/withdraw/sand.cer');
	return { prod, sand };
}

module.exports = async () => {
	const { prod, sand } = await b2c();
	// console.log(prod, sand);
	return { prod, sand }
}