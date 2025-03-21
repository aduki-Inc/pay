const {
	mpesa: {
		credentials: { secret, key },
		urls: { auth}
	}
} = require("../../configs");

module.exports = async () => {
	const headers = { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}` };
	try {
		const response = await fetch(auth, { headers, method: "GET" });
		if (!response.ok) return { valid: false, data: { code: 99, error: 'Could not initiate the service request' }};
		const data = await response.json();
		return { valid: true, data: { token: data.access_token } };
	} catch (e) {
		return { valid: false, data: { code: 99, error: 'Could not initiate the service request' }};
	}
};