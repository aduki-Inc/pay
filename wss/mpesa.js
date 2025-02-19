const uWs = require('uWebSockets.js');
const { hash: { generateLong }, mpesa: { push }} = require('../utils')
const { mpesa } = require("../validators");

// Create the websocket server for mpesa
class MpesaWebSocket {
	constructor(app, connections) {
		this.app = app;
		this.connections = new Map();
		this.init(app);
	}
	
	init = app => {
		// WebSocket for specific conversations
		app.ws('/mpesa/:id', {
			compression: uWs.SHARED_COMPRESSOR,
			maxPayloadLength: 16 * 1024 * 1024,
			idleTimeout: 960,
			
			upgrade: async (res, req, context) => {
				try {
					const connectionHash = generateLong('U0WS');
					const id = req.getParameter(0);
					// Pass user data to the WebSocket
					res.upgrade(
						{ hash: connectionHash, id }, // Pass the user data
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
				ws.subscribe(`/mpesa/${ws.id}`);
				
				// send a message to the user with a user-generated hash
				ws.send(JSON.stringify({ kind: 'hash', hash: ws.hash }));
			},
			
			message: async (ws, message, isBinary) => {
				try {
					const data = JSON.parse(Buffer.from(message).toString('utf-8'));
					// If the message is a push request
					if (data.kind === 'push') {
						await this.#push(ws, data.payload);
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
			return { valid: false, data: { code: 106, error: 'Could not validate the payload data' }};
		}
	}
	
	send = (hash, message) => {
		if (this.connections.has(hash)) {
			this.connections.get(hash).send(JSON.stringify(message));
		}
	}
	
	// A service endpoint to push a stk to the user device
	#push = async (ws, payload) => {
		const { valid, data } = await this.validate(payload, mpesa.stk);
		if (!valid) return ws.send(JSON.stringify({ kind: 'error', data: data }));
		const { kind, data: pushData } = await push(data);
		ws.send(JSON.stringify({ kind, data: pushData }));
	}
}

module.exports = MpesaWebSocket;