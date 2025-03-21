module.exports = {
	credentials: {
		secret: process.env.MPESA_CONSUMER_SECRET,
		key: process.env.MPESA_CONSUMER_KEY,
		passKey: process.env.MPESA_PASS_KEY,
		code: process.env.MPESA_SHORT_CODE,
	},
	initiator: {
		name: process.env.MPESA_INITIATOR_NAME,
		password: process.env.MPESA_INITIATOR_PASSWORD,
	},
	urls: {
		auth: `${process.env.MPESA_API}/oauth/v1/generate?grant_type=client_credentials`,
		stk: {
			push: `${process.env.MPESA_API}/mpesa/stkpush/v1/processrequest`,
			status: `${process.env.MPESA_API}/mpesa/stkpushquery/v1/query`,
			callback: `${process.env.APP_API}/mpesa/stk/callback`,
		},
		b2c: {
			withdraw: `${process.env.MPESA_API}/mpesa/b2c/v3/paymentrequest`,
			result: `${process.env.APP_API}/b2c/withdraw`,
			queue: `${process.env.APP_API}/b2c/queue`,
		}
	}
};