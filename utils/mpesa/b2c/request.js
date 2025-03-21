module.exports = async (url, token, payload) => {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify(payload),
	});
	if (!response.ok) {
		const data = await response.json();
		if(data["errorCode"] === "500.002.1001") return { valid: false, data: { code: 127, error: 'Duplicate request transaction ID' }};
		return { valid: false, data: { code: 127, error: 'Failed to process the service request' }};
	}
	const data = await response.json();
	console.log(data);
	return { valid: true, data };
};
