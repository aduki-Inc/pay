const BaseService = require('../base');
const {
	mpesa: {
		consumerKey, consumerSecret, credentialUrl,
		partyB, passKey, callbackUrl, shortCode, stkPush
	}
} = require('../../configs');
const { timestamp } = require('../../utils')
const { mpesa } = require('../../validators');

// service handles all auth-related operations
class StkService extends BaseService {
	constructor(app, api) {
		super(app, api);
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
			{ method: 'post', url: `${this.api}/mpesa/callback/:id`, handler: this.callback.bind(this), isProtected: false }
		];
		
		routes.forEach((route) => {
			this.registerRoute(route.method, route.url, route.handler, route.isProtected );
		});
	}
	
	#token = async () => {
		const headers = {
			Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
		};
		
		try {
			const response = await fetch(credentialUrl, { headers, method: "GET" });
			if (!response.ok) return { token: null, error: `HTTP Error with status code ${response.status}` }
			const data = await response.json();
			return { token: data.access_token, error: null }
		} catch (e) {
			return { token: null, error: `Failed to fetch access token: ${e.message}` }
		}
	};
	
	#password = (shortCode, passKey, timestamp) => {
		return Buffer.from(shortCode + passKey + timestamp).toString("base64");
	};
	
	#payload = (phone, amount, shortCode, password, timestamp, id) => {
		return {
			BusinessShortCode: shortCode,
			Password: password,
			Timestamp: timestamp,
			TransactionType: "CustomerBuyGoodsOnline",
			Amount: amount,
			PartyA: phone,
			PartyB: partyB,
			PhoneNumber: phone,
			CallBackURL: `${callbackUrl}/${id}`,
			AccountReference: "Pay online",
			TransactionDesc: "Payment",
		};
	};
	
	#stk = async (url, payload, token) => {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify(payload),
		});
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return response.json();
	};
	
	#response = response => {
		const success = response?.ResponseCode === "0";
		return {
			success,
			data: response,
			message: success ? "Payment request sent" : "Failed to send payment request"
		};
	};
	
	// A service endpoint to push a stk to the user device
	push = async (req, res) => {
		try {
			const { data, error } = await this.validate(req.body, mpesa.stk)
			if (error) return this.jsonResponse(res, 400, { error: error, success: false });
			const { phone, amount, id } = data;
			const { token, error: tokenError } = await this.#token();
			if (tokenError) return this.jsonResponse(res, 500, { error: tokenError, success: false });
			const password = this.#password(shortCode, passKey, timestamp);
			const payload = this.#payload(phone, amount, shortCode, password, timestamp, id);
			const responseData = await this.#stk(stkPush, payload, token );
			return this.jsonResponse(res, 200, this.#response(responseData))
		} catch (e) {
			return this.jsonResponse(res, 500, { error: 'An error occurred', success: false })
		}
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
			0: { success: true, short: "Success", desc: "The transaction was successful." },
			1032: { success: false, desc: "The request was canceled by the user." },
			1037: { success: false,desc: "No response from the user." },
			1: { success: false, desc: "The balance is insufficient for the transaction." },
			2001: { success: false, desc: "The initiator information is invalid." },
			1019: { success: false, desc: "Transaction has expired." },
			1001: { success: false, desc: "Unable to lock subscriber, a transaction is already in process for the current subscriber." },
		};
		
		return resultCodes[code] || { success: false, desc: "An unknown error occurred." };
	}
	
	// A service endpoint to receive the callback from safaricom API.
	callback = async (req, res) => {
		try {
			const { id } = req.params;
			if(!req.body || !req.body["Body"]) return this.jsonResponse(res, 400, { success: false, error: "Invalid request" })
			const { Body } = req.body;
			const { stkCallback: { CallbackMetadata, ResultCode, ResultDesc } } = Body;
			// if the request isn't successful, then the transaction failed
			const { success, desc } = this.#mapCode(ResultCode);
			if (!success) return this.jsonResponse(res, 400, { success: false, error: desc });
			
			const data = {
				id: id,
				...this.#metadata(CallbackMetadata),
				ResultCode,
				ResultDesc,
			};
			
			console.log(data);
			return this.jsonResponse(res, 200, { success: true, message: "Payment received" });
		} catch (e) {
			console.error('Error processing callback:', e);
			return this.jsonResponse(res, 500, {error: 'An error occurred', success: false})
		}
	}
}

module.exports = StkService;