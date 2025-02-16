const user = require('./user');
const mpesa = require('./mpesa');

// export all services
module.exports = (app, api) => {
	mpesa(app, api);
	user(app, api);
}