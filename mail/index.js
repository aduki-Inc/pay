const { sendMail } = require('./send');
const templates = require('./templates');
module.exports = { send: sendMail, templates };