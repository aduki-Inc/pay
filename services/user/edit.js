const BaseService = require('../base');
const { User } = require('../../models');
const { user} = require('../../validators');

// service handles all auth-related operations
class EditService extends BaseService {
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
	
	// all routes for the service dynamically
	routes() {
		this.add('patch', `${this.api}/user/edit/email`, this.email.bind(this), true);
		this.add('patch', `${this.api}/user/edit/phone`, this.phone.bind(this), true);
		this.add('patch', `${this.api}/user/edit/password`, this.password.bind(this), true);
		this.add('patch', `${this.api}/user/edit/name`, this.name.bind(this), true);
		this.add('patch', `${this.api}/user/edit/about`, this.about.bind(this), true);
		this.add('patch', `${this.api}/user/edit/country`, this.country.bind(this), true);
		this.add('patch', `${this.api}/user/edit/avatar`, this.avatar.bind(this), true);
		this.add('del', `${this.api}/user/edit/remove`, this.remove.bind(this), true);
	}
	
	// A service endpoint to update the email of a user
	email = async (req, res) => {
		const { user: { hex }} = req;
		// validate the data: email
		const { data, error } = await this.validate(req.body, user.email);
		if (error) return this.jsonResponse(res, 400, { error, success: false });
		
		try {
			const user = await User.findOne({ hex }).exec();
			if (!user) return this.jsonResponse(res, 404, {error: 'User not found', success: false});
			user.email = data.email;
			await user.save();
			this.jsonResponse(res, 200, {user, success: true});
		} catch (e) {
			console.error('Error updating user status:', e);
			return this.jsonResponse(res, 500, {error: 'Error updating user status', success: false});
		}
	}
	
	// A service endpoint to update the phone number
	phone = async (req, res) => {
		const { user: { hex }} = req;
		// validate the data: phone
		const { data, error } = await this.validate(req.body, user.phone);
		if (error) return this.jsonResponse(res, 400, { error, success: false });
		
		try {
			const user = await User.findOne({ hex }).exec();
			if (!user) return this.jsonResponse(res, 404, {error: 'User not found', success: false});
			user.phone = data.phone;
			await user.save();
			this.jsonResponse(res, 200, {user, success: true});
		} catch (e) {
			console.error('Error updating user status:', e);
			return this.jsonResponse(res, 500, {error: 'Error updating user status', success: false});
		}
	}
	
	// A service endpoint to update the password
	password = async (req, res) => {
		const { user: { hex }} = req;
		// validate the data: password
		const { data, error } = await this.validate(req.body, user.password);
		if (error) return this.jsonResponse(res, 400, { error, success: false });
		
		try {
			const user = await User.findOne({ hex }).exec();
			if (!user) return this.jsonResponse(res, 404, {error: 'User not found', success: false});
			user.password = data.password;
			await user.save();
			this.jsonResponse(res, 200, {user, success: true});
		} catch (e) {
			console.error('Error updating user status:', e);
			return this.jsonResponse(res, 500, {error: 'Error updating user status', success: false});
		}
	}
	
	// A service endpoint to update the name
	name = async (req, res) => {
		const { user: { hex }} = req;
		// validate the data: name
		const { data, error } = await this.validate(req.body, user.name);
		if (error) return this.jsonResponse(res, 400, { error, success: false });
		
		try {
			const user = await User.findOne({ hex }).exec();
			if (!user) return this.jsonResponse(res, 404, {error: 'User not found', success: false});
			user.name = data.name;
			await user.save();
			this.jsonResponse(res, 200, {user, success: true});
		} catch (e) {
			console.error('Error updating user status:', e);
			return this.jsonResponse(res, 500, {error: 'Error updating user status', success: false});
		}
	}
	
	//  A service endpoint to update about
	about = async (req, res) => {
		const { user: { hex }} = req;
		// validate the data: about
		const { data, error } = await this.validate(req.body, user.about);
		if (error) return this.jsonResponse(res, 400, { error, success: false });
		
		try {
			const user = await User.findOne({ hex }).exec();
			if (!user) return this.jsonResponse(res, 404, {error: 'User not found', success: false});
			user.about = data.about;
			await user.save();
			this.jsonResponse(res, 200, {user, success: true});
		} catch (e) {
			console.error('Error updating user status:', e);
			return this.jsonResponse(res, 500, {error: 'Error updating user status', success: false});
		}
	}
	
	// A service endpoint to update the country
	country = async (req, res) => {
		const { user: { hex }} = req;
		// validate the data: country
		const { data, error } = await this.validate(req.body, user.country);
		if (error) return this.jsonResponse(res, 400, { error, success: false });
		
		try {
			const user = await User.findOne({ hex }).exec();
			if (!user) return this.jsonResponse(res, 404, {error: 'User not found', success: false});
			user.country = data.country;
			await user.save();
			this.jsonResponse(res, 200, {user, success: true});
		} catch (e) {
			console.error('Error updating user status:', e);
			return this.jsonResponse(res, 500, {error: 'Error updating user status', success: false});
		}
	}
	
	// A service endpoint to update the avatar
	avatar = async (req, res) => {
		const { user: { hex }} = req;
		// validate the data: avatar
		const { data, error } = await this.validate(req.body, user.avatar);
		if (error) return this.jsonResponse(res, 400, { error, success: false });
		
		try {
			const user = await User.findOne({ hex }).exec();
			if (!user) return this.jsonResponse(res, 404, {error: 'User not found', success: false});
			user.avatar = data.avatar;
			await user.save();
			this.jsonResponse(res, 200, {user, success: true});
		} catch (e) {
			console.error('Error updating user status:', e);
			return this.jsonResponse(res, 500, {error: 'Error updating user status', success: false});
		}
	}
	
	remove = async (req, res) => {
		const {user: {hex}} = req;
		try {
			const user = await User.findOne({ hex }).exec();
			if (!user) return this.jsonResponse(res, 404, {error: 'User not found', success: false});
			
			await user.remove();
			this.jsonResponse(res, 200, {success: true});
		} catch (e) {
			console.error('Error removing user:', e);
			return this.jsonResponse(res, 500, {error: 'Error removing user', success: false});
		}
	}
}

module.exports = EditService;