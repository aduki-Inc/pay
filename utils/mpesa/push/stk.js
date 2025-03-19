module.exports = async (url, payload, token) => {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify(payload),
	});
	if (!response.ok) return { valid: false, data: { code: 109, error: 'Could not send the stk push request' } };
	const data = await response.json();
	
	return { valid: true, data };
};
