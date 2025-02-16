const StkService = require('./stk');
// export all services
module.exports = (app, api) => {
	new StkService(app, api);
}