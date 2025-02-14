const nodeMailer = require('nodemailer');
const { mail } = require('../configs');
// define transporter
const transporter = nodeMailer.createTransport({
	port: mail.host,
	host: mail.host,
	secure: true,
	auth: mail.auth
});

// define mail options
const mailOptions = data => {
	return {
		from: `"Fandua" <${mail.auth.user}>`,
		to: data.to,
		subject: data.subject,
		html: data.html,
	}
}

// export all configurations
module.exports = { transporter, mailOptions };