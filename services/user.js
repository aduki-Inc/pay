const BaseService = require('./base/protected');
const { User } = require('../models');

// service handles all user-related operations
class UserService extends BaseService {
	constructor(app, api) {
		super(app, api);
		this.registerRoutes();
	}
	
	/**
	 * @name registerRoutes
	 * @description Registers all routes for the service dynamically
	 * @type {method}
	 */
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
	
	/*
		@name create
		@description A service endpoint to create a new user
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<object>} The response object
	*/
	create = async ({ req, res }) => {
		const { user: { hex, avatar, verified, name, status } } = req;
		const { publicKey, encryptedPrivateKey, privateKeyNonce, passcodeSalt  } = req.body;
		
		if(!publicKey || !encryptedPrivateKey || !privateKeyNonce || !passcodeSalt) {
			return this.jsonResponse(res, 400, { error: 'Missing required fields', success: false });
		}
		
		// Validate the public key format
		if(!await sodium.validateKeyPair(publicKey)) {
			console.log('Invalid public key format');
			return this.jsonResponse(res, 400, { error: 'Invalid public key format', success: false });
		}
		
		try {
			// check if the user already exists using its
			const existingUser = await User.findOne({ hex }).exec();
			
			// if the user already exists, return a conflict error
			if(existingUser) {
				return this.jsonResponse(res, 409, { error: 'User already exists', success: false });
			}
			
			const user = new User({
				hex,
				avatar,
				verified,
				status,
				name,
				publicKey,
				encryptedPrivateKey,
				privateKeyNonce,
				passcodeSalt
			});
			
			// save the user
			await user.save();
			this.jsonResponse(res, 201, { user, success: true });
		} catch (error) {
			console.error('Error fetching messages:', error);
			this.jsonResponse(res, 500, { error: 'Internal Server Error', success: false });
		}
	}
	
	/*
		@name retrieve
		@description A service endpoint to retrieve a list private key
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<object>} The response object
	*/
	retrieve = async ({ req, res }) => {
		const {user: {hex}} = req;
		
		try {
			const user = await User.findOne({hex}).exec();
			
			if (!user) {
				return this.jsonResponse(res, 404, {error: 'User not found', success: false});
			}
			
			this.jsonResponse(res, 200, {
				retrieved: {
					publicKey: user.publicKey,
					encryptedPrivateKey: user.encryptedPrivateKey, privateKeyNonce: user.privateKeyNonce,
					passcodeSalt: user.passcodeSalt
				},
				success: true
			});
		} catch (e) {
			console.error('Error retrieving user info:', e);
			return this.jsonResponse(res, 500, {error: 'Error retrieving user information', success: false});
		}
	}
	
	/*
		@name updateKeys
		@description In case user forgot their passcode they can recreate a new keypair
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<object>} The uWebSockets.js response object
	*/
	updateKeys = async ({ req, res }) => {
		const { user: { hex } } = req;
		const { publicKey, encryptedPrivateKey, privateKeyNonce, passcodeSalt } = req.body;
		
		// Validate the public key format
		if (!await sodium.validateKeyPair(publicKey)) {
			console.log('Invalid public key format');
			return this.jsonResponse(res, 400, { error: 'Invalid public key format', success: false });
		}
		
		try {
			const user = await User.findOne({ hex }).exec();
			
			if (!user) {
				return this.jsonResponse(res, 404, { error: 'User not found', success: false });
			}
			
			user.publicKey = publicKey;
			user.encryptedPrivateKey = encryptedPrivateKey;
			user.privateKeyNonce = privateKeyNonce;
			user.passcodeSalt = passcodeSalt;
			
			await user.save();
			this.jsonResponse(res, 200, { user, success: true });
		} catch (error) {
			console.error('Error updating user keys:', error);
			this.jsonResponse(res, 500, { error: 'Internal Server Error', success: false });
		}
	}
	
	/*
		@name updateStatus
		@description A service endpoint to update the status of a user
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<object>} The response object
	*/
	updateStatus = async ({ req, res }) => {
		const {user: {hex}} = req;
		const {status} = req.body;
		
		if(!status || typeof status !== 'string') {
			return this.jsonResponse(res, 400, {error: 'Missing or invalid status', success: false});
		}
		
		try {
			const user = await User.findOne({hex}).exec();
			
			if (!user) {
				return this.jsonResponse(res, 404, {error: 'User not found', success: false});
			}
			
			user.status = status;
			
			await user.save();
			
			this.jsonResponse(res, 200, {user, success: true});
		} catch (e) {
			console.error('Error updating user status:', e);
			return this.jsonResponse(res, 500, {error: 'Error updating user status', success: false});
		}
	}
	
	/*
		@name updateAvatar
		@description A service endpoint to update the avatar of a user
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<object>} The response object
	*/
	updateAvatar = async ({ req, res }) => {
		const {user: {hex}} = req;
		const {avatar} = req.body;
		
		if(!avatar || typeof avatar !== 'string') {
			return this.jsonResponse(res, 400, {error: 'Missing or invalid avatar', success: false});
		}
		
		try {
			const user = await User.findOne({hex}).exec();
			
			if (!user) {
				return this.jsonResponse(res, 404, {error: 'User not found', success: false});
			}
			
			user.avatar = avatar;
			
			await user.save();
			
			this.jsonResponse(res, 200, {user, success: true});
		} catch (e) {
			console.error('Error updating user avatar:', e);
			return this.jsonResponse(res, 500, {error: 'Error updating user avatar', success: false});
		}
	}
	
	/*
		@name updateVerification
		@description A service endpoint to update the verification status of a user
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<object>} The response object
	*/
	updateVerification = async ({ req, res }) => {
		const {user: {hex}} = req;
		const {verified} = req.body;
		
		if(verified === undefined) {
			return this.jsonResponse(res, 400, {error: 'Missing or invalid verified status', success: false});
		}
		
		try {
			const user = await User.findOne({hex}).exec();
			
			if (!user) {
				return this.jsonResponse(res, 404, {error: 'User not found', success: false});
			}
			
			user.verified = verified;
			
			await user.save();
			
			this.jsonResponse(res, 200, {user, success: true});
		} catch (e) {
			console.error('Error updating user verification:', e);
			return this.jsonResponse(res, 500, {error: 'Error updating user verification', success: false});
		}
	}
	
	/*
		@name updateName
		@description A service endpoint to update the name of a user
		@type {method}
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<object>} The response object
	*/
	updateName = async ({ req, res }) => {
		const {user: {hex}} = req;
		const {name} = req.body;
		
		if(!name || typeof name !== 'string') {
			return this.jsonResponse(res, 400, {error: 'Missing or invalid name', success: false});
		}
		
		try {
			const user = await User.findOne({hex}).exec();
			
			if (!user) {
				return this.jsonResponse(res, 404, {error: 'User not found', success: false});
			}
			
			user.name = name;
			
			await user.save();
			
			this.jsonResponse(res, 200, {user, success: true});
		} catch (e) {
			console.error('Error updating user name:', e);
			return this.jsonResponse(res, 500, {error: 'Error updating user name', success: false});
		}
	}
	
	/*
		@name delete
		@description A service endpoint to delete a user
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<object>} The response object
	*/
	delete = async ({ req, res }) => {
		const {user: {hex}} = req;
		
		try {
			const user = await User.findOne({hex}).exec();
			
			if (!user) {
				return this.jsonResponse(res, 404, {error: 'User not found', success: false});
			}
			
			await user.remove();
			
			return this.jsonResponse(res, 200, {success: true});
		} catch (e) {
			console.error('Error deleting user:', e);
			return this.jsonResponse(res, 500, {error: 'Error deleting user', success: false});
		}
	}
}

module.exports = UserService;