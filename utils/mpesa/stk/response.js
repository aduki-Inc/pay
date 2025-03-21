const push = response => {
	const success = response["ResponseCode"] === "0";
	if(!success) return { valid: false, data: { code: 107, error: "Could not send the stk stk request" } };
	const data = {
		request: response["MerchantRequestID"],
		checkout: response["CheckoutRequestID"],
	}
	return { valid: true, data }
};

const status = response => {
	const success = response["ResponseCode"] === "0";
	if(!success) return { valid: false, data: { code: 107, error: "Could not process the service request" } };
	const data = { code: 200, message: 'The service request is processed successfully.'}
	return { valid: true, data }
};

module.exports = { push, status };