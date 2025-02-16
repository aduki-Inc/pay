const register = require('./register');
const login = require('./login');
const avatar = require('./avatar');
const country = require('./country');
const email = require('./email');
const name = require('./name');
const phone = require('./phone');
const password = require('./password');
const about = require('./about');
const recover = require('./recover');

module.exports = {
	register, login, avatar,
	country, email, name,
	phone, password, about,
	recover,
}