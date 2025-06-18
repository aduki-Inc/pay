module.exports = async (url, payload, token) => {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify(payload),
	});
	console.log("Response from M-Pesa STK Push:", await response.json());
	if (!response.ok) return { valid: false, data: { code: 106, error: 'Could not initiate the service request' } };
	const data = await response.json();
	return { valid: true, data };
};
