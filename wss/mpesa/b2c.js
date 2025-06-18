const uWs = require('uWebSockets.js');
const { mpesa: { b2c } } = require('../../utils')
const { mpesa: { withdraw: validateWithdraw } } = require("../../validators");

// Create the websocket server for mpesa
class MpesaB2CWebSocket {
	constructor(app) {
		this.app = app;
		this.connections = new Map();
		this.init(app);
	}

	init = app => {
		// WebSocket for specific conversations
		app.ws('/mpesa/b2c/:hash', {
			compression: uWs.SHARED_COMPRESSOR,
			maxPayloadLength: 16 * 1024 * 1024,
			idleTimeout: 960,

			upgrade: async (res, req, context) => {
				try {
					const hash = req.getParameter(0);
					// Pass user data to the WebSocket
					res.upgrade(
						{ hash: hash }, // Pass the user data
						req.getHeader('sec-websocket-key'),
						req.getHeader('sec-websocket-protocol'),
						req.getHeader('sec-websocket-extensions'),
						context
					);
				} catch (error) {
					console.error('Upgrade error:', error);
				}
			},

			open: (ws, req) => {
				console.log('A WebSocket connected');
				this.connections.set(ws.hash, ws);
				ws.subscribe(`/mpesa/b2c/${ws.hash}`);
			},

			message: async (ws, message, isBinary) => {
				try {
					const data = JSON.parse(Buffer.from(message).toString('utf-8'));
					// If the message is a stk request
					if (data.kind === 'withdraw') {
						await this.#withdraw(ws, data.payload);
					}
				} catch (e) {
					console.error('An error occurred:', e.message);
					ws.send(JSON.stringify({ kind: 'error', error: e.message }));
				}
			},

			drain: (ws) => {
				console.log('A WebSocket backpressure drained');
			},

			close: (ws, code, message) => {
				console.log('A WebSocket closed with code:', code, 'and message:', message);
			},
		});
	}

	validate = async (data, callback) => {
		try {
			const { valid, data: validated } = await callback(data);
			return { valid, data: validated };
		} catch (e) {
			return { valid: false, data: { code: 123, error: 'Could not validate the payload data' } };
		}
	}

	send = (hash, message) => {
		if (this.connections.has(hash)) {
			this.connections.get(hash).send(JSON.stringify(message));
		}
	}

	// A service endpoint to stk a stk to the user device
	#withdraw = async (ws, payload) => {
		payload.hash = ws.hash;
		const { valid, data } = await this.validate(payload, validateWithdraw);
		if (!valid) return ws.send(JSON.stringify({ kind: 'error', data: data }));
		const { kind, data: pushData } = await b2c(data);
		ws.send(JSON.stringify({ kind, data: pushData }));
	}
}

module.exports = MpesaB2CWebSocket;