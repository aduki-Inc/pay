const {
	mpesa: {
		credentials: { code },
		urls: { stk: { callback }}
	}
} = require("../../../configs");
const push = data => {
	const { phone, amount, password, timestamp, hash } = data;
	return {
		BusinessShortCode: code,
		Password: password,
		Timestamp: timestamp,
		TransactionType: "CustomerPayBillOnline",
		Amount: amount,
		PartyA: phone,
		PartyB: code,
		PhoneNumber: phone,
		CallBackURL: `${callback}/${hash}`,
		AccountReference: "Pay online",
		TransactionDesc: "Payment",
	};
};

const status = data => {
	const { checkout, password, timestamp } = data;
	return {
		BusinessShortCode: code,
		Password: password,
		Timestamp: timestamp,
		CheckoutRequestID: checkout
	};
};

module.exports = { push, status };