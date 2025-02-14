const { app, security } = require('./app');
const { mongo, redis } = require('./data');
const mpesa = require('./mpesa');
const mail = require('./mail');

module.exports = {
	app, security, mail,
	mongo, redis, mpesa
}