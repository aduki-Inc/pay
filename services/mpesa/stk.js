const BaseService = require('../base');
const { mpesa: { push } } = require('../../utils')
const { mpesa } = require('../../validators');
const { MpesaWebSocket } = require('../../wss')

// service handles all auth-related operations
class StkService extends BaseService {
	constructor(app, api) {
		super(app, api);
		this.websocket = new MpesaWebSocket(app);
		this.routes();
	}
	
	validate = async (data, callback) => {
		try {
			const validated = await callback(data);
			return { data: validated, error: null };
		} catch (e) {
			return { data: null, error: e.message };
		}
	}
	
	// all routes for the service dynamically
	routes() {
		this.add('post', `${this.api}/mpesa/stk/push`, this.push.bind(this), false);
		this.add('post', `${this.api}/mpesa/stk/callback/:hash`, this.callback.bind(this), false);
	}
	
	// A service endpoint to stk a stk to the user device
	push = async (req, res) => {
		const { data, error } = await this.validate(req.body, mpesa.stk);
		if (error) return this.jsonResponse(res, 400, { error: error, success: false });
		
		const { status, data: response } = await push(data);
		return this.jsonResponse(res, status, response);
	}
	
	#buildStkResult = data => {
		return {
			id: data.hash,
			amount: data["Amount"],
			receipt: data["MpesaReceiptNumber"],
			date: this.#intToDateISOString(data["TransactionDate"]),
			phone: data["PhoneNumber"],
		};
	}
	
	#intToDateISOString = intDate => {
		// format: 20250321121546
		const strDate = intDate.toString();
		const year = strDate.substring(0, 4);
		const month = strDate.substring(4, 6);
		const day = strDate.substring(6, 8);
		const hour = strDate.substring(8, 10);
		const minute = strDate.substring(10, 12);
		const second = strDate.substring(12, 14);
		
		// Create a Date object in the East African Timezone (UTC+3)
		const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`);
		return date.toISOString();
	};
	
	#metadata = metadata => {
		const items = metadata['Item'];
		const data = {};
		items.forEach(item => {
			const { Name, Value } = item;
			data[Name] = Value;
		});
		
		return data;
	}
	
	#mapCode = code => {
		const resultCodes = {
			0: { success: true, short: "Success", code: 201, desc: "The transaction was successful." },
			1032: { success: false, code: 109, desc: "The request was canceled by the user." },
			1037: { success: false, code: 1110, desc: "No response from the user." },
			1: { success: false, code: 111, desc: "The balance is insufficient for the transaction." },
			2001: { success: false, code: 112, desc: "The initiator information is invalid." },
			1019: { success: false, code: 113, desc: "Transaction has expired." },
			1001: { success: false, code: 114, desc: "Unable to lock subscriber, a transaction is already in process for the current subscriber." },
		};
		
		return resultCodes[code] || { success: false, code: 115, desc: "An unknown error occurred." };
	}
	
	// A service endpoint to receive the callback from safaricom API.
	callback = async (req, res) => {
		const { hash } = req.params;
		try {
			const { Body } = req.body;
			const { stkCallback: { CallbackMetadata, ResultCode } } = Body;
			// if the request isn't successful, then the transaction failed
			const { success, code, desc } = this.#mapCode(ResultCode);
			if (!success) {
				// send a webhook to the user
				this.websocket.send(hash, { kind: 'error', data: { code, error: desc } });
				return this.jsonResponse(res, 400, { success: false, error: desc });
			}
			const data = { hash, ...this.#metadata(CallbackMetadata)}
			const dataBuild = this.#buildStkResult(data);
			// send a webhook to the user
			this.websocket.send(hash, { kind: 'success', data: dataBuild });
			return this.jsonResponse(res, 200, { success: true, message: "Payment received" });
		} catch (e) {
			// send a webhook to the user
			this.websocket.send(hash, { kind: 'error', data: { code: 115, error: 'An error occurred' } });
			return this.jsonResponse(res, 500, {error: 'An error occurred', success: false})
		}
	}
}

module.exports = StkService;