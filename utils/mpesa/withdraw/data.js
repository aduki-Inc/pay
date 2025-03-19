const { mpesa: { b2cResultUrl, b2cQueueUrl, initiatorName, b2cPartyA, initiatorPassword }} = require('../../../configs')
const { credential } = require('../../../certs');

// This file contains the withdrawal request object
module.exports = async ({hash, phone, amount, remarks}) => {
	const securityCredential = await credential(initiatorPassword)
	amount = amount.toString();
	return {
		OriginatorConversationID: "feb5e3j2-ubbc-4745-844c-ee37b546f627",
		InitiatorName: initiatorName,
		SecurityCredential: securityCredential,
		CommandID: "BusinessPayment",
		Amount: amount,
		PartyA: b2cPartyA,
		PartyB: phone,
		Remarks: remarks,
		QueueTimeOutURL: `${b2cQueueUrl}/${hash}`,
		ResultURL: `${b2cResultUrl}/${hash}`,
		Occassion: "Withdrawal"
	}
};