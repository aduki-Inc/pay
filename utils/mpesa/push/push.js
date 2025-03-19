const { mpesa: { shortCode, passKey, stkPush }} = require('../../../configs');
const timestamp = require('../../timestamp');
const getToken = require('../token');
const getPassword = require('./password');
const getPayload = require('./payload');
const processResponse = require('./response');
const stk = require('./stk');

// A service endpoint to push a stk to the user device
module.exports = async data => {
	try {
		const { phone, amount, id, hash } = data;
		const { valid, data: tokenData } = await getToken();
		if (!valid) return { kind: "error", data };
		const { token } = tokenData;
		const password = getPassword(shortCode, passKey, timestamp);
		const payload = getPayload({ phone, amount, shortCode, password, timestamp, id, hash });
		const response = await stk(stkPush, payload, token );
		if (!response.valid) return { kind: 'error', data: response.data };
		const processData = processResponse(response.data);
		if (!processData.valid) return { kind: 'error', data: processData.data };
		return { kind: 'accepted', data: processData.data };
	} catch (e) {
		return { kind: 'error', data: { code: 111, error: 'Could not validate the payload data' }};
	}
}