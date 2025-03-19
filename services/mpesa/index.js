const stk = require('./stk');
const b2c = require('./b2c');

// export all services
module.exports = (app, api) => {
	new stk(app, api);
	new b2c(app, api);
}