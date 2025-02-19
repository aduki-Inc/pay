const { mpesa: { consumerSecret, consumerKey, credentialUrl } } = require("../../configs");

module.exports = async () => {
	const headers = { Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}` };
	try {
		const response = await fetch(credentialUrl, { headers, method: "GET" });
		if (!response.ok) return { valid: false, data: { code: 107, error: 'Could not initiate the stk push request' } };
		const data = await response.json();
		return { valid: true, data: { token: data.access_token } };
	} catch (e) {
		return { valid: false, data: { code: 108, error: 'Could not initiate the stk push request' } };
	}
};