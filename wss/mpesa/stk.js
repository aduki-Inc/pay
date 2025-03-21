const uWs = require('uWebSockets.js');
const {
	mpesa: {
		stk: { push,status }
	}
} = require('../../utils')
const { mpesa: stk } = require("../../validators");

// Create the websocket server for stk
class MpesaWebSocket {
	constructor(app) {
		this.app = app;
		this.connections = new Map();
		this.init(app);
	}
	
	init = app => {
		// WebSocket for specific conversations
		app.ws('/mpesa/stk/:hash', {
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
				ws.subscribe(`/mpesa/${ws.hash}`);
			},
			
			message: async (ws, message, isBinary) => {
				try {
					const data = JSON.parse(Buffer.from(message).toString('utf-8'));
					// If the message is a stk request
					if (data.kind === 'push') {
						await this.#push(ws, data.payload);
					} else if (data.kind === 'status') {
						await this.#status(ws, data.payload);
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
	
	validate = async (data, hash, callback) => {
		try {
			const { valid, data: validated } = await callback(data);
			validated.hash = hash;
			return { valid, data: validated };
		} catch (e) {
			return { valid: false, data: { code: 103, error: 'Could not validate the payload data' }};
		}
	}
	
	send = (hash, message) => {
		if (this.connections.has(hash)) {
			this.connections.get(hash).send(JSON.stringify(message));
		}
	}
	
	// A service endpoint to stk a stk to the user device
	#push = async (ws, payload) => {
		const { valid, data } = await this.validate(payload, ws.hash, stk.stk);
		if (!valid) return ws.send(JSON.stringify({ kind: 'error', data: data }));
		const { kind, data: pushData } = await push(data);
		ws.send(JSON.stringify({ kind, data: pushData }));
	}
	
	#status = async (ws, payload) => {
		const {checkout} = payload;
		if (!checkout) return ws.send(JSON.stringify({
			kind: 'error',
			data: {code: 116, error: 'The checkout request is required'}
		}));
		const {kind, data} = await status(checkout);
		ws.send(JSON.stringify({ kind, data }));
	}
}

module.exports = MpesaWebSocket;