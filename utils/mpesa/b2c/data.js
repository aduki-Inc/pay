const {
	mpesa: {
		credentials: { code },
		initiator: { name, password},
		urls: { b2c: { result, queue }}
	}
} = require('../../../configs');
const { credential } = require('../../../certs');

// This file contains the withdrawal request object
module.exports = async ({hash, phone, amount}) => {
	const securityCredential = await credential(password)
	amount = amount.toString();
	return {
		OriginatorConversationID: hash,
		InitiatorName: name,
		SecurityCredential: securityCredential,
		CommandID: "BusinessPayment",
		Amount: amount,
		PartyA: code,
		PartyB: phone,
		Remarks: 'Withdrawal',
		QueueTimeOutURL: `${queue}/${hash}`,
		ResultURL: `${result}/${hash}`,
		Occassion: "Withdrawal"
	}
};