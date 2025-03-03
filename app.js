const mongoose = require('mongoose');
const uWs = require('uWebSockets.js');
const path = require('path');
require('dotenv').config();
const { app: { host, port} } = require('./configs');
const services = require('./services');
const wss = require('./wss');
const { bull: { SocketWorker }} = require('./queues');

const credentials = {
	key_file_name: path.join(__dirname, './ssl', 'key.pem'),
	cert_file_name: path.join(__dirname, './ssl', 'cert.pem')
};

// Active connections
const activeConnections = new Map();

// Create the WebSocket server
const app = uWs.SSLApp(credentials).ws('/events', {
	compression: uWs.SHARED_COMPRESSOR,
	maxPayloadLength: 16 * 1024 * 1024,
	idleTimeout: 960,
	
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
	wss(app)
	new SocketWorker(activeConnections);