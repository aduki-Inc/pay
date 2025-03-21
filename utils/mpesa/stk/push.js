const {
	mpesa: {
		credentials: { code, passKey},
		urls: { stk: { push }}
	}
} = require('../../../configs');
const timestamp = require('../../timestamp');
const getToken = require('../token');
const getPassword = require('./password');
const { push: pushPayload } = require('./payload');
const { push: processResponse } = require('./response');
const request = require('./request');

// A service endpoint to stk a stk to the user device
module.exports = async data => {
	try {
		const { phone, amount, hash } = data;
		const { valid, data: tokenData } = await getToken();
		if (!valid) return { kind: "error", tokenData };
		const password = getPassword(code, passKey, timestamp);
		const payload = pushPayload({ phone, amount, password, timestamp, hash });
		const response = await request(push, payload, tokenData.token);
		if (!response.valid) return { kind: 'error', data: response.data };
		const processData = processResponse(response.data);
		if (!processData.valid) return { kind: 'error', data: processData.data };
		return { kind: 'accepted', data: processData.data };
	} catch (e) {
		console.error(e);
		return { kind: 'error', data: { code: 108, error: 'Something went wrong while processing the request' }};
	}
}