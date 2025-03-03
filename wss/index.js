const MpesaWebSocket = require('./mpesa');
module.exports = app => {
	new MpesaWebSocket(app)
}