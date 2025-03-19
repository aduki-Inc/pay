const { mpesa: { b2c } } = require('../../utils')
const BaseService = require("../base");
const { MpesaB2CWebsocket } = require('../../wss');

// service handles all mpesa withdraw-related operations
class B2cService extends BaseService {
	constructor(app, api) {
		super(app, api);
		this.websocket = new MpesaB2CWebsocket(app);
		this.routes();
	}
	
	validate = async (data, callback) => {
		try {
			const validated = await callback(data);
			return { data: validated, error: null };
		} catch (e) {
			return { data: null, error: e.message };
		}
	}
	
	// all routes for the service dynamically
	routes() {
		this.add('get', '/*', this.invalid.bind(this), false);
		this.add('post', `${this.api}/mpesa/b2c/:hash`, this.b2c.bind(this), false);
	}
	
	invalid = async (req, res) => {
		return this.jsonResponse(res, 404, { error: 'Invalid request', success: false });
	}
	
	// A service endpoint to push a withdrawal to the user device
	b2c = async (req, res) => {
		const { hash } = req.params;
		const { amount, reference } = req.body;
		
		const { status, data: response } = b2c({ amount, reference });
		return this.jsonResponse(res, status, response);
	}
}

module.exports = B2cService;