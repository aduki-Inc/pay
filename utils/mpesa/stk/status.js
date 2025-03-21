const {
	mpesa: {
		credentials: { code, passKey},
		urls: { stk: { status }}
	}
} = require('../../../configs');
const timestamp = require('../../timestamp');
const getToken = require('../token');
const getPassword = require('./password');
const { status: statusPayload } = require('./payload')
const { status: processResponse } = require('./response');
const request = require('./request');

// A service endpoint to stk a stk to the user device
module.exports = async checkout => {
	try {
		const { valid, data } = await getToken();
		if (!valid) return { kind: "error", data };
		const password = getPassword(code, passKey, timestamp);
		const payload = statusPayload({checkout, password, timestamp});
		const response = await request(status, payload, data.token);
		if (!response.valid) return { kind: 'error', data: response.data };
		const processData = processResponse(response.data);
		if (!processData.valid) return { kind: 'error', data: processData.data };
		return { kind: 'success', data: processData.data };
	} catch (e) {
		return { kind: 'error', data: { code: 108, error: 'Something went wrong while processing the request' }};
	}
}