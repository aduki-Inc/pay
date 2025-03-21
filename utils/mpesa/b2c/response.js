module.exports = response => {
	const success = response["ResponseCode"] === "0";
	if(!success) return { valid: false, data: { code: 128, error: response["errorMessage"] } };
	return { valid: true, data: { code: 210, message: "Withdrawal request initiated successfully" } };
};