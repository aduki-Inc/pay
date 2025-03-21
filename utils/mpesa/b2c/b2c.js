const { mpesa: { urls: { b2c: { withdraw } } }} = require('../../../configs');
const getData = require('./data');
const payment = require('./request');
const getToken = require("../token");
const processResponse = require('./response');

// A service endpoint to stk a stk to the user device
module.exports = async data => {
	try {
		const { phone, hash, amount } = data;
		if (!phone || !hash || !amount) return { kind: 'error', data: { code: 124, error: 'Could not validate the payload data' }};
		const payload = await getData({ hash, phone, amount });
		const { valid, data: tokenData } = await getToken();
		if (!valid) return { kind: "error", data: tokenData };
		const response = await payment(withdraw, tokenData.token, payload);
		if (!response.valid) return { kind: 'error', data: response.data };
		const processData = processResponse(response.data);
		if (!processData.valid) return { kind: 'error', data: processData.data };
		return { kind: 'accepted', data: processData.data };
	} catch (e) {
		return { kind: 'error', data: { code: 129, error: 'Something went wrong while processing the request' }};
	}
}