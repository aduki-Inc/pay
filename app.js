const mongoose = require('mongoose');
const uWs = require('uWebSockets.js');
const path = require('path');
require('dotenv').config();

const { mongo: { uri, options }, app: { host, port} } = require('./configs');
const services = require('./services');
// const { bull: { SocketWorker }} = require('./queues');

// Connect to the MongoDB database
mongoose.connect(uri, options).then(r => {
	console.log('Connected to MongoDB');
}).catch(e => {
	console.error('Failed to connect to MongoDB:', e);
});

mongoose.connection.on('connected', () => console.log('Mongoose connected to MongoDB'));
mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected from MongoDB'));
mongoose.connection.on('reconnected', () => console.log('Mongoose reconnected to MongoDB'));

const credentials = {
	key_file_name: path.join(__dirname, './ssl', 'key.pem'),
	cert_file_name: path.join(__dirname, './ssl', 'cert.pem')
};

// Create the WebSocket server
const app = uWs.SSLApp(credentials)
	// Listen to the port
	.listen(host, port, (listenSocket) => {
		if (listenSocket) {
			console.log(`Listening on: ${host}:${port}`);
		} else {
			console.error(`Failed to listen to port ${port}`);
		}
	})
	
	// Register all the servers
	services(app, '/api/v1');