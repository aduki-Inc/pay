const { mpesa: { partyB, callbackUrl } } = require("../../configs");
module.exports = (data) => {
	const { phone, amount, shortCode, password, timestamp, id, hash } = data;
	return {
		BusinessShortCode: shortCode,
		Password: password,
		Timestamp: timestamp,
		TransactionType: "CustomerBuyGoodsOnline",
		Amount: amount,
		PartyA: phone,
		PartyB: partyB,
		PhoneNumber: phone,
		CallBackURL: `${callbackUrl}/${id}/${hash}`,
		AccountReference: "Pay online",
		TransactionDesc: "Payment",
	};
};