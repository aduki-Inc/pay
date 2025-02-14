module.exports = {
	port: process.env.MAIL_PORT,
	host: process.env.MAIL_HOST,
	secure: true,
	auth: {
		user: process.env.MAIL_USER,
		pass: process.env.MAIL_PASS
	},
}