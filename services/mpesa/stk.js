const BaseService = require('../base');
const { mpesa: { push } } = require('../../utils')
const { mpesa } = require('../../validators');
const { MpesaWebSocket } = require('../../wss')

// service handles all auth-related operations
class StkService extends BaseService {
	constructor(app, api) {
		super(app, api);
		this.websocket = new MpesaWebSocket(app);
		this.registerRoutes();
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
	registerRoutes() {
		const routes = [
			{ method: 'post', url: `${this.api}/mpesa/push`, handler: this.push.bind(this), isProtected: false },
			{ method: 'post', url: `${this.api}/mpesa/callback/:id/:hash`, handler: this.callback.bind(this), isProtected: false }
		];
		
		routes.forEach((route) => {
			this.registerRoute(route.method, route.url, route.handler, route.isProtected );
		});
	}
	
	
	// A service endpoint to push a stk to the user device
	push = async (req, res) => {
		const { data, error } = await this.validate(req.body, mpesa.stk);
		if (error) return this.jsonResponse(res, 400, { error: error, success: false });
		
		const { status, data: response } = await push(data);
		return this.jsonResponse(res, status, response);
	}
	
	#metadata = metadata => {
		const data = {};
		metadata.map((item) => {
			const { Name, Value } = item;
			data[Name] = Value;
		});
		return data;
	}
	
	#mapCode = code => {
		const resultCodes = {
			0: { success: true, short: "Success", code: 201, desc: "The transaction was successful." },
			1032: { success: false, code: 112, desc: "The request was canceled by the user." },
			1037: { success: false, code: 113, desc: "No response from the user." },
			1: { success: false, code: 114, desc: "The balance is insufficient for the transaction." },
			2001: { success: false, code: 115, desc: "The initiator information is invalid." },
			1019: { success: false, code: 116, desc: "Transaction has expired." },
			1001: { success: false, code: 117, desc: "Unable to lock subscriber, a transaction is already in process for the current subscriber." },
		};
		
		return resultCodes[code] || { success: false, code: 118, desc: "An unknown error occurred." };
	}
	
	// A service endpoint to receive the callback from safaricom API.
	callback = async (req, res) => {
		const { id, hash } = req.params;
		try {
			if(!req.body || !req.body["Body"]) {
				// send a webhook to the user
				this.websocket.send(hash, { kind: 'error', data: { code: 119, error: 'Invalid request' } });
				return this.jsonResponse(res, 400, { success: false, error: "Invalid request" })
			}
			const { Body } = req.body;
			const { stkCallback: { CallbackMetadata, ResultCode, ResultDesc } } = Body;
			// if the request isn't successful, then the transaction failed
			const { success, code, desc } = this.#mapCode(ResultCode);
			if (!success) {
				// send a webhook to the user
				this.websocket.send(hash, { kind: 'error', data: { code, error: desc } });
				return this.jsonResponse(res, 400, { success: false, error: desc });
			}
			
			const data = {
				id: id,
				...this.#metadata(CallbackMetadata),
			};
			
			// send a webhook to the user
			this.websocket.send(hash, { kind: 'success', data: { code: 200, payment: data, message: "Payment received" } });
			return this.jsonResponse(res, 200, { success: true, message: "Payment received" });
		} catch (e) {
			// send a webhook to the user
			this.websocket.send(hash, { kind: 'error', data: { code: 120, error: 'An error occurred' } });
			return this.jsonResponse(res, 500, {error: 'An error occurred', success: false})
		}
	}
}

module.exports = StkService;