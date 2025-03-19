module.exports = async (url, token, payload) => {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify(payload),
	});
	
	if (!response.ok) return { valid: false, data: { code: 109, error: 'Could not initiate the withdrawal request' } };
	const data = await response.json();
	return { valid: true, data };
};
