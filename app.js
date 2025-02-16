const mongoose = require('mongoose');
const { Worker } = require('bullmq');
// const { actionQueue, activityQueue } = require('../bull');
const uWs = require('uWebSockets.js');
const path = require('path');
require('dotenv').config();

const { mongo: { uri, options }, app: { host, port} } = require('./configs');
const { authorize, checkConversation } = require("./middlewares").authMiddleware;
const services = require('./services');
const { bull: { SocketWorker }} = require('./queues');

// Connect to the MongoDB database
mongoose.connect(uri, options).then(r => {
	console.log('Connected to MongoDB');
}).catch(e => {
	console.error('Failed to connect to MongoDB:', e);
});

const credentials = {
	key_file_name: path.join(__dirname, './ssl', 'key.pem'),
	cert_file_name: path.join(__dirname, './ssl', 'cert.pem')
};

// Active connections
const activeConnections = new Map(); // Key: user hex, Value: WebSocket connection reference

// Create the WebSocket server
const app = uWs.SSLApp(credentials).ws('/events', {
	compression: uWs.SHARED_COMPRESSOR,
	maxPayloadLength: 16 * 1024 * 1024,
	idleTimeout: 960,
	
	upgrade: async (res, req, context) => {
		const cookies = req.getHeader('cookie');
		try {
			// Use the authorization middleware
			const user = await authorize(cookies);
			
			if (!user || res.done) {
				res.cork(() => {
					res.writeStatus('401 Unauthorized');
					res.end();
				});
			}
			
			// Pass user data to the WebSocket
			res.upgrade(
				{ ...user }, // Pass the user data
				req.getHeader('sec-websocket-key'),
				req.getHeader('sec-websocket-protocol'),
				req.getHeader('sec-websocket-extensions'),
				context
			);
		} catch (error) {
			console.error('Upgrade error:', error);
			res.cork(() => {
				res.writeStatus('500 Internal Server Error');
				res.end();
			});
		}
	},
	
	open: (ws, req) => {
		console.log('A WebSocket connected');
		
		// add to active connections
		activeConnections.set(ws.user.hex, ws);
		ws.subscribe('/chats');
	},
		
	message: async (ws, message, isBinary) => {
		console.log('A WebSocket message received', message.toString());
	},
		
	drain: (ws) => {
		console.log('A WebSocket backpressure drained');
	},
		
	close: (ws, code, message) => {
		console.log('A WebSocket closed with code:', code, 'and message:', message);
		
		// Remove from active connections
		activeConnections.delete(ws.user.hex);
	},
	
	error: (ws, error) => {
		console.error('A WebSocket error occurred:', error);
	}
	})
	
	// Listen to the port
	.listen(host, port, (listenSocket) => {
		if (listenSocket) {
			console.log(`Listening on port: ${port}`);
		} else {
			console.error(`Failed to listen to port ${port}`);
		}
	});

	// Register all the servers
	services(app, '/api/v1');

	// WebSocket for specific conversations
	app.ws('/chat/:hex', {
		compression: uWs.SHARED_COMPRESSOR,
		maxPayloadLength: 16 * 1024 * 1024,
		idleTimeout: 960,
		
		upgrade: async (res, req, context) => {
			// Capture all required data synchronously
			const headers = {
				cookies: req.getHeader('cookie'),
				secWebSocketKey: req.getHeader('sec-websocket-key'),
				secWebSocketProtocol: req.getHeader('sec-websocket-protocol'),
				secWebSocketExtensions: req.getHeader('sec-websocket-extensions')
			};
			
			// Handle aborted requests
			res.onAborted(() => {
				res.done = true;
			});
			
			try {
				// console.log('Conversation handler reached!')
				// Use the authorization middleware
				const user = await authorize(headers.cookies);
				
				if (!user || res.done) {
					res.cork(() => {
						res.writeStatus('401 Unauthorized');
						res.end();
					});
					return;
				}
				
				const hex = req.getParameter(0); // Get the conversationId from the URL
				console.log('Hex is:', hex)
				const conversation = await checkConversation({ user: user.hex, hex: hex });
				
				// console.log('Conversation is fetched:', conversation);
				if (!conversation || res.done) {
					res.cork(() => {
						res.writeStatus('404 Not Found');
						res.end();
					});
					return;
				}
				
				res.upgrade(
					{ user: user, conversation: { hex: hex, participants: conversation.participants } },
					headers.secWebSocketKey,
					headers.secWebSocketProtocol,
					headers.secWebSocketExtensions,
					context
				);
			} catch (error) {
				console.error('Upgrade error:', error);
				res.cork(() => {
					res.writeStatus('500 Internal Server Error');
					res.end();
				});
			}
		},
		
		open: (ws) => {
			try {
				const { hex, participants } = ws.conversation;
				console.log(`WebSocket connected for conversation: ${hex}`);
				// console.log('Participants:', participants);
				ws.subscribe(`/chat/${hex}`);
				
				// send a message to the conversation
				ws.publish(`/chat/${hex}`, JSON.stringify({
					type: 'system',
					message: 'A user joined the conversation',
					createdAt: new Date()
				}));
			} catch (error) {
				console.error('Open handler error:', error);
			}
		},
		
		message: (ws, message, isBinary) => {
			try {
				const { hex } = ws.conversation;
				// convert a message from ArrayBuffer to string
				message = Buffer.from(message).toString();
				
				// convert a message to JSON
				message = JSON.parse(message);
				
				// process the message via MessageController
				console.log('Message received:', message);
			} catch (error) {
				console.error('Message handling error:', error);
			}
		},
		
		close: (ws, code, message) => {
			try {
				const { hex } = ws.conversation;
				console.log(`WebSocket closed for conversation ${hex}:`, code, message.toString());
			} catch (error) {
				console.error('Close handler error:', error);
			}
		},
	});
	
	// Initialize the SocketWorker
	new SocketWorker(activeConnections);