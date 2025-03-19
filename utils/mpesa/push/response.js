module.exports = response => {
	const success = response["ResponseCode"] === "0";
	if(!success) return { valid: false, data: { code: 110, error: "Could not send the stk push request" } };
	return { valid: true, data: { code: 200, message: "Stk push request sent to the user" } };
};