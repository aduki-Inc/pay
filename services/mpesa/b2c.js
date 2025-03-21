const { mpesa: { b2c } } = require('../../utils')
const BaseService = require("../base");
const { MpesaB2CWebsocket } = require('../../wss');

// service handles all mpesa b2c-related operations
class B2cService extends BaseService {
	constructor(app, api) {
		super(app, api);
		this.websocket = new MpesaB2CWebsocket(app);
		this.routes();
	}
	
	// all routes for the service dynamically
	routes() {
		this.add('post', `${this.api}/mpesa/b2c/queue/:hash`, this.#queue.bind(this), false);
		this.add('post', `${this.api}/mpesa/b2c/withdraw/:hash`, this.#withdraw.bind(this), false);
	}
	
	// A service endpoint to queue a withdrawal to the user device
	#queue = async (req, res) => {
		const { hash } = req.params;
		this.websocket.send(hash, { kind: "error", data: { code: 134, error: "Service request timeout" }});
		return this.jsonResponse(res, 400, { success: false, error: "Service request timeout" });
	}
	
	// A service endpoint to stk a withdrawal to the user device
	#withdraw = async (req, res) => {
		const { hash } = req.params;
		try {
			const {Result} = req.body;
			const {success, code, desc} = this.#mapCode(Result["ResultCode"]);
			if (!success) {
				this.websocket.send(hash, {kind: 'error', data: {code, error: desc}});
				return this.jsonResponse(res, 400, {success: false, error: desc});
			}
			const {ResultParameters} = Result;
			const info = {
				id: Result["OriginatorConversationID"],
				conversation: Result["ConversationID"],
				code: Result["TransactionID"]
			}
			const data = this.#withdrawalResult(ResultParameters);
			const resultData = this.#buildWithdrawalResult(data, info);
			this.websocket.send(hash, { kind: 'success', data: resultData });
			return this.jsonResponse(res, 200, { success: true, message: 'Withdrawal request received' });
		} catch (e) {
			this.websocket.send(hash, { kind: 'error', data: { code: 133, error: 'Internal server error' }});
			return this.jsonResponse(res, 400, { success: false, error: 'Internal server error' });
		}
	}
	
	#buildWithdrawalResult = (data, info) => {
		const { phone, name, text } = this.#separateNameAndNumber(data["ReceiverPartyPublicName"])
		return {
			amount: data["TransactionAmount"],
			receipt: data["TransactionReceipt"],
			date: data["TransactionCompletedDateTime"], // format: 20.03.2025 19:03:06
			user: { phone, name, text, registered: data["B2CRecipientIsRegisteredCustomer"] === "Y" },
			info
		};
	}
	
	#withdrawalResult = ResultParameters => {
		const result = ResultParameters['ResultParameter'];
		const data = {};
		result.map((item) => {
			const { Key, Value } = item;
			data[Key] = Value;
		});
		return data;
	}
	
	#mapCode = code => {
		const resultCodes = {
			0: { success: true, code: 211, desc: "The transaction was successful." },
			2001: { success: false, code: 130, desc: "Failed to process the service request." },
			1: { success: false, code: 131, desc: "Please try again later." },
		};
		
		return resultCodes[code] || { success: false, code: 132, desc: "Error occurred while processing the service request." };
	}
	
	#separateNameAndNumber = data => {
		// "0713253018 - Fredrick Ochieng Oluoch",
		try {
			let [phone, name] = data.split(" - ");
			if (/^0[17]/.test(phone)) phone = `254${phone.slice(1)}`;
			return { phone, name, text: data };
		} catch (e) {
			return { phone: null, name: null, text: data }
		}
	}
}

module.exports = B2cService;