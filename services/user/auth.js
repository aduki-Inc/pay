const BaseService = require('../base');
const { User } = require('../../models');
const { user} = require('../../validators');
const bycrypt = require('bcryptjs');

// service handles all auth-related operations
class AuthService extends BaseService {
	constructor(app, api) {
		super(app, api);
		this.registerRoutes();
	}
	
	validate = async (data, callback) => {
		try {
			const validated = await callback(data);
			return { data: validated, error: null };
		} catch (e) {
			console.error('Error validating data:', e);
			return { data: null, error: e.message };
		}
	}
	
	// validate the password
	validatePassword = async (password, hash) => {
		try {
			return await bycrypt.compare(password, hash);
		} catch (e) {
			console.error('Error validating password:', e);
			return false;
		}
	}
	
	// all routes for the service dynamically
	registerRoutes() {
		const routes = [
			{ method: 'put', url: `${this.api}/user/add`, handler: this.create.bind(this) },
			{ method: 'get', url: `${this.api}/user/retrieve`, handler: this.retrieve.bind(this) },
			{ method: 'patch', url: `${this.api}/user/edit/keys`, handler: this.updateKeys.bind(this) },
			{ method: 'patch', url: `${this.api}/user/edit/status`, handler: this.updateStatus.bind(this) },
			{ method: 'patch', url: `${this.api}/user/edit/avatar`, handler: this.updateAvatar.bind(this) },
			{ method: 'patch', url: `${this.api}/user/edit/verification`, handler: this.updateVerification.bind(this) },
			{ method: 'patch', url: `${this.api}/user/edit/name`, handler: this.updateName.bind(this) },
			{ method: 'del', url: `${this.api}/user/remove`, handler: this.delete.bind(this) }
		];
		
		routes.forEach((route) => {
			this.registerRoute(route.method, route.url, route.handler);
		});
	}
	
	// description A service endpoint to create a new user
	create = async ({ req, res }) => {
		// validate the data
		const { data, error } = await this.validate(req.body, user.register);
		
		// If there is an error, return a bad request error
		if (error) {
			return this.jsonResponse(res, 400, { error, success: false });
		}
		
		try {
			// check if the user already exists using its
			const existingUser = await User.findOne({ hex: data.hex }).exec();
			// if the user already exists, return a conflict error
			if(existingUser) return this.jsonResponse(res, 409, { error: 'User already exists', success: false });
			const user = new User(data);
			// save the user
			await user.save();
			this.jsonResponse(res, 201, { user, success: true });
		} catch (error) {
			console.error('Error fetching messages:', error);
			this.jsonResponse(res, 500, { error: 'Internal Server Error', success: false });
		}
	}
	
	// A service endpoint to log in a user
	login = async ({ req, res }) => {
		// validate the data
		const { data, error } = await this.validate(req.body, user.login);
		
		if (error) return this.jsonResponse(res, 400, { error, success: false });
		
		try {
			const user = await User.findOne({ hex: data.hex }).exec();
			if (!user) return this.jsonResponse(res, 404, { error: 'User not found', success: false });
			const validPassword = await this.validatePassword(data.password, user.password);
			if (!validPassword) return this.jsonResponse(res, 401, { error: 'Invalid password', success: false });
			return this.jsonResponse(res, 200, { user, success: true });
		} catch (error) {
			console.error('Error fetching messages:', error);
			this.jsonResponse(res, 500, { error: 'Internal Server Error', success: false });
		}
	}

	// Recover a user's password
	recover = async ({ req, res }) => {
		const { data, error } = await this.validate(req.body, user.recover);
		if (error) return this.jsonResponse(res, 400, { error, success: false });
		try {
			const user = await User.findOne({ hex: data.hex }).exec();
			if (!user) return this.jsonResponse(res, 404, { error: 'User not found', success: false });
			// send the user a password recovery email
			return this.jsonResponse(res, 200, { success: true });
		} catch (error) {
			console.error('Error fetching messages:', error);
			this.jsonResponse(res, 500, { error: 'Internal Server Error', success: false });
		}
	}
}

module.exports = UserService;