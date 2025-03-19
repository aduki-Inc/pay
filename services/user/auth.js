const BaseService = require('../base');
const { User } = require('../../models');
const { user} = require('../../validators');
const { code } = require('../queries');
const bycrypt = require('bcryptjs');

// service handles all auth-related operations
class AuthService extends BaseService {
	constructor(app, api) {
		super(app, api);
		this.routes();
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
	routes() {
		this.add('put', `${this.api}/user/add`, this.create, false);
		this.add('get', `${this.api}/user/:hash`, this.get, false);
		this.add('post', `${this.api}/user/login`, this.login, false);
		this.add('post', `${this.api}/user/recover`, this.recover, false);
		this.add('post', `${this.api}/user/verify`, this.verify, false);
		this.add('patch', `${this.api}/user/password`, this.changePassword, false);
	}
	
	// description A service endpoint to create a new user
	create = async (req, res) => {
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
			console.error('Error creating an account:', error);
			this.jsonResponse(res, 500, { error: 'Internal Server Error', success: false });
		}
	}
	
	// A service endpoint to log in a user
	login = async (req, res) => {
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
			console.error('Error logging in', error);
			this.jsonResponse(res, 500, { error: 'Internal Server Error', success: false });
		}
	}
	
	get = async (req, res) => {
		const { hash } = req.params;
		try {
			const user = await User.findOne({ hex: hash }).exec();
			if (!user) return this.jsonResponse(res, 404, { error: 'User not found', success: false });
			return this.jsonResponse(res, 200, {
				success: true, user: {
					email: user.email, name: user.name,
					phone: user.phone, about: user.about, country: user.country,
					avatar: user.avatar, hex: user.hex,
				}
			});
		} catch (error) {
			console.error('Error fetching user:', error);
			this.jsonResponse(res, 500, { error: 'Internal Server Error', success: false });
		}
	}

	// Recover a user's password
	recover = async (req, res) => {
		const { data, error } = await this.validate(req.body, user.recover);
		if (error) return this.jsonResponse(res, 400, { error, success: false });
		try {
			const user = await User.findOne({ email: data.email }).exec();
			if (!user) return this.jsonResponse(res, 404, { error: 'User not found', success: false });
			
			// generate a new code
			const codeData = code.create(user);
			return this.jsonResponse(res, 200, { code: codeData, success: true });
		} catch (error) {
			console.error('Error recovering password:', error);
			this.jsonResponse(res, 500, { error: 'Internal Server Error', success: false });
		}
	}
	
	// Verify a code
	verify = async (req, res) => {
		const { data, error } = await this.validate(req.body, user.verify);
		if (error) return this.jsonResponse(res, 400, { error, success: false });
		try {
			const user = await User.findOne({ hex: data.hex }).exec();
			if (!user) return this.jsonResponse(res, 404, { error: 'User not found', success: false });
			const verified = await code.verify(user.hex, data.code);
			if (!verified) return this.jsonResponse(res, 401, { error: 'Invalid code', success: false });
			return this.jsonResponse(res, 200, { success: true });
		} catch (error) {
			console.error('Error verifying code:', error);
			this.jsonResponse(res, 500, { error: 'Internal Server Error', success: false });
		}
	}
	
	// change a user's password
	changePassword = async (req, res) => {
		const { data, error } = await this.validate(req.body, user.password);
		if (error) return this.jsonResponse(res, 400, { error, success: false });
		try {
			const user = await User.findOne({ email: data.email }).exec();
			if (!user) return this.jsonResponse(res, 404, { error: 'User not found', success: false });
			user.password = data.password;
			await user.save();
			return this.jsonResponse(res, 200, { success: true });
		} catch (error) {
			console.error('Error changing password:', error);
			this.jsonResponse(res, 500, { error: 'Internal Server Error', success: false });
		}
	}
}

module.exports = AuthService;