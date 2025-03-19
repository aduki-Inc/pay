const { mpesa: { b2cUrl }} = require('../../../configs');
const getData = require('./data');
const payment = require('./request');
const getToken = require("../token");

// A service endpoint to push a stk to the user device
module.exports = async data => {
	try {
		const { phone, hash, remarks, amount } = data;
		if (!phone || !hash || !remarks || !amount) return { kind: 'error', data: { code: 138, error: 'Could not validate the payload data' }};
		const payload = await getData({ hash, phone, remarks, amount });
		const { valid, data: tokenData } = await getToken();
		if (!valid) return { kind: "error", data: { code: 139, error: 'Could not get the token' }};
		const response = await payment(b2cUrl, tokenData.token, payload);
		if (!response.valid) return { kind: 'error', data: response.data };
		// const processData = processResponse(response.data);
		// if (!processData.valid) return { kind: 'error', data: processData.data };
		// return { kind: 'accepted', data: processData.data };
		return { kind: 'accepted', data: response.data };
	} catch (e) {
		console.error('Error occurred while getting data.', e);
		return { kind: 'error', data: { code: 111, error: 'Could not validate the payload data' }};
	}
}