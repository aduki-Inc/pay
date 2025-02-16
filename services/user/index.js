const AuthService = require('./auth');
const EditService = require('./edit');
// export all services
module.exports = (app, api) => {
	new AuthService(app, api);
	new EditService(app, api);
}