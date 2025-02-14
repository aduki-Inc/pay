const { Conversation} = require('../models');
const { sodium } = require('../encryption');
const { chat: { maxPins, perPage }} = require('../configs')
const BaseService = require('./base');

/*
	@name ConversationService
	@description This service handles all the operations related to conversations
	@type {class}
	@method {constructor} The class constructor
	@method {create} Creates a new conversation
*/
class ConversationService extends BaseService {
	constructor(app, api) {
		super(app, api);
		this.registerRoutes();
	}
	
	/*
		@name exists
		@description Checks if a conversation exists
		@type {method}
		@async
		@param { Array<String> } hexes of the participants: The participants in the conversation
		@returns {Promise<Boolean>} The conversation exists or not
	*/
	async exists(participants) {
		// where conversation contains both the hexes of the participants
		const conversation = await Conversation.findOne({
			'participants.hex': { $all: participants }
		}).exec();
		
		return !!conversation;
	}
	
	/**
	 * @name registerRoutes
	 * @description Registers all routes for the service dynamically
	 * @type {method}
	 */
	registerRoutes() {
		const routes = [
			{ method: 'put', url: `${this.api}/conversation/add`, handler: this.create.bind(this) },
			{ method: 'get', url: `${this.api}/conversations/all`, handler: this.all.bind(this) },
			{ method: 'get', url: `${this.api}/conversations/requested`, handler: this.requested.bind(this) },
			{ method: 'get', url: `${this.api}/conversations/trusted`, handler: this.trusted.bind(this) },
			{ method: 'get', url: `${this.api}/conversations/unread`, handler: this.unread.bind(this) },
			{ method: 'post', url: `${this.api}/conversation/one`, handler: this.chat.bind(this) },
			{ method: 'get', url: `${this.api}/conversations/pins`, handler: this.pins.bind(this) },
			{ method: 'patch', url: `${this.api}/conversation/:hex/pin`, handler: this.pin.bind(this) },
			{ method: 'patch', url: `${this.api}/conversation/:hex/unpin`, handler: this.unpin.bind(this) },
			{ method: 'get', url: `${this.api}/conversations/stats`, handler: this.stats.bind(this) },
			{ method: 'patch', url: `${this.api}/conversation/:hex/accept`, handler: this.accept.bind(this) }
		];
		
		routes.forEach((route) => {
			this.registerRoute(route.method, route.url, route.handler);
		});
	}
	
	/*
		@name post create
		@description Creates a new conversation
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@returns {Promise<Conversation>} The created chat/conversation
	*/
	async create({ res, body }) {
		const { participants, kind } = body;
		if (!participants || participants.length < 2) {
			return this.jsonResponse(res, 400, { error: 'Invalid participants', success: false });
		}
		
		try {
			// check if the conversation already exists
			const exists = await this.exists([participants[0].hex, participants[1].hex]);
			
			if (exists) {
				return this.jsonResponse(res, 400, {error: 'Conversation already exists', success: false});
			}
			
			// create a new conversation
			const conversation = new Conversation({
				participants,
				kind: kind || 'request',
				hex: await sodium.generateHex(20)
			});
			
			await conversation.save();
			
			return this.jsonResponse(res, 201, {conversation, success: true});
		} catch (e) {
			console.error('Error creating conversation:', e);
			return this.jsonResponse(res, 500, {error: 'Error creating conversation', success: false});
		}
	}
	
	/*
		@name get all
		@description Fetches all conversations by user hex: in which a user is a participant in a paginated manner
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@returns {Promise<Array<Conversation>>} Paginated conversations by sorted by the last message
	*/
	async all({ res, req }) {
		const { user: { hex } } = req;
		const { page = 1 } = req.query;
		
		try {
			// Find all conversations where the user is a participant:
			// include the last message using the conversation.last which is a reference to the message doc
			const conversations = await Conversation.aggregate([
				{ $match: { 'participants.hex': { $in: [hex] } } },
				{ $sort: { updatedAt: -1 } },
				{ $skip: (page - 1) * perPage },
				{ $limit: perPage },
				{
					$lookup: {
						from: 'messages',
						localField: 'last',
						foreignField: '_id',
						as: 'last'
					}
				},
				{ $unwind: '$last' }
			]).exec();
			
			return this.jsonResponse(res, 200, { conversations, success: true });
		} catch (e) {
			console.error('Error retrieving all conversations:', e);
			return this.jsonResponse(res, 500, { error: 'Error retrieving conversations', success: false });
		}
	}
	
	/*
		@name get requested conversations
		@description Fetches all requested conversations by user hex: in which a user is a participant in a paginated manner
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@returns {Promise<Array<Conversation>>} Paginated requested conversations by sorted by the updatedAt
	*/
	async requested({ res, req }) {
		const { user: { hex } } = req;
		const { page = 1 } = req.query;
		
		try {
			// fetch all requested conversations where the user is a participant
			// include the last message using the conversation.last which is a reference to the message doc
			// const conversations = await Conversation.find({
			// 	'participants.hex': { $in: [hex] },
			// 	kind: 'request'
			// }).sort({ updatedAt: -1 }).skip((page - 1) * perPage).limit(perPage).exec();
			
			const conversations = await Conversation.aggregate([
				{ $match: { 'participants.hex': { $in: [hex] }, kind: 'request' } },
				{ $sort: { updatedAt: -1 } },
				{ $skip: (page - 1) * perPage },
				{ $limit: perPage },
				{
					$lookup: {
						from: 'messages',
						localField: 'last',
						foreignField: '_id',
						as: 'last'
					}
				},
				{ $unwind: '$last' }
			]).exec();
			
			return this.jsonResponse(res, 200, { conversations, success: true });
		} catch (e) {
			console.error('Error retrieving requested conversations:', e);
			return this.jsonResponse(res, 500, {error: 'Error retrieving requested conversations', success: false});
		}
	}
	
	/*
		@name trusted
		@description Fetches all trusted conversations by user hex: in which a user is a participant in a paginated manner
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<Array<Conversation>>} Paginated trusted conversations by sorted by the updatedAt
	*/
	async trusted({ res, req }) {
		const { user: { hex } } = req;
		const { page = 1 } = req.query;
		
		try {
			// fetch all trusted conversations where the user is a participant
			// include the last message using the conversation.last which is a reference to the message doc
			// const conversations = await Conversation.find({
			// 	'participants.hex': { $in: [hex] },
			// 	kind: 'trusted'
			// }).sort({ updatedAt: -1 }).skip((page - 1) * perPage).limit(perPage).exec();
			
			const conversations = await Conversation.aggregate([
				{ $match: { 'participants.hex': { $in: [hex] }, kind: 'trusted' } },
				{ $sort: { updatedAt: -1 } },
				{ $skip: (page - 1) * perPage },
				{ $limit: perPage },
				{
					$lookup: {
						from: 'messages',
						localField: 'last',
						foreignField: '_id',
						as: 'last'
					}
				},
				{ $unwind: '$last' }
			]).exec();
			
			return this.jsonResponse(res, 200, { conversations, success: true });
		} catch (e) {
			console.error('Error retrieving trusted conversations:', e);
			return this.jsonResponse(res, 500, {error: 'Error retrieving trusted conversations', success: false});
		}
	}
	
	/*
		@name unread
		@description Fetches all unread conversations by user hex:
		in which a user is a participant in a paginated manner, that are trusted
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<Array<Conversation>>} Paginated unread conversations by sorted by the updatedAt
	*/
	async unread({ res, req }) {
		const { user: { hex } } = req;
		const { page = 1 } = req.query;
		
		try {
			// fetch all unread conversations where the user is a participant
			// include the last message using the conversation.last which is a reference to the message doc
			// const conversations = await Conversation.find({
			// 	'participants.hex': { $in: [hex] },
			// 	kind: 'trusted',
			// 	unread: { $gt: 0 }
			// }).sort({ updatedAt: -1 }).skip((page - 1) * perPage).limit(perPage).exec();
			
			const conversations = await Conversation.aggregate([
				{ $match: { 'participants.hex': { $in: [hex] }, kind: 'trusted', unread: { $gt: 0 } } },
				{ $sort: { updatedAt: -1 } },
				{ $skip: (page - 1) * perPage },
				{ $limit: perPage },
				{
					$lookup: {
						from: 'messages',
						localField: 'last',
						foreignField: '_id',
						as: 'last'
					}
				},
				{ $unwind: '$last' }
			]).exec();
			
			return this.jsonResponse(res, 200, { conversations, success: true });
		} catch (e) {
			console.error('Error retrieving unread conversations:', e);
			return this.jsonResponse(res, 500, {error: 'Error retrieving unread conversations', success: false});
		}
	}
	
	/*
		@name get chat
		@description Fetches a single conversation where both hex and user are participants
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@returns {Promise<Conversation>} The conversation
	*/
	async chat({ req, res, body }) {
		const { user: { hex } } = req;
		const { other } = body;
		
		if(!other || typeof other !== 'string') {
			return this.jsonResponse(res, 400, { error: 'Invalid user', success: false });
		}
		
		try {
			// fetch conversation where both current and other are both participants (both hexes are in the participant array)
			// include the last message using the conversation.last which is a reference to the message doc
			// const conversation = await Conversation.findOne({
			// 	'participants.hex': { $all: [hex, other] }
			// }).exec();
			const [conversation] = await Conversation.aggregate([
				{ $match: { 'participants.hex': { $all: [hex, other] } } },
				{ $limit: 1 },
				{
					$lookup: {
						from: 'messages',
						localField: 'last',
						foreignField: '_id',
						as: 'last'
					}
				},
				{ $unwind: '$last' }
			]).exec();
			
			// if no such conversation exists
			if (!conversation) {
				return this.jsonResponse(res, 404, { error: 'Conversation not found', success: false });
			}
			
			return this.jsonResponse(res, 200, { conversation, success: true });
		} catch (e) {
			console.error('Error retrieving the conversation:', e);
			return this.jsonResponse(res, 500, {error: 'Error retrieving the conversation', success: false});
		}
	}
	
	/*
		@name pins
		@description Fetches all pinned conversations for a given user
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<Array<Conversation>>} The pinned conversations: paginated
	*/
	async pins({ req, res }) {
		const { user: { hex } } = req;
		
		try {
			//	find all conversations where the user has pinned the conversation,
			// include the last message using the conversation.last which is a reference to the message doc
			// const conversations = await Conversation.find({
			// 	'pins.user': { $in: [hex] }
			// }).sort({ updatedAt: -1 }).exec();
			
			const conversations = await Conversation.aggregate([
				{ $match: { 'pins.user': { $in: [hex] } } },
				{ $sort: { updatedAt: -1 } },
				{
					$lookup: {
						from: 'messages',
						localField: 'last',
						foreignField: '_id',
						as: 'last'
					}
				},
				{ $unwind: '$last' }
			]).exec();
			
			return this.jsonResponse(res, 200, { conversations, success: true });
		} catch (e) {
			console.error('Error retrieving pinned conversations:', e);
			return this.jsonResponse(res, 500, {error: 'Error retrieving pinned conversations', success: false});
		}
	}
	
	/*
		@name pin
		@description Pins a conversation for a given user: check existence and pin: if pins by user are less than 5
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<object>} The pinned conversation
	*/
	async pin({ req, res }) {
		const { user: { hex } } = req;
		const { hex: conversationHex } = req.getParameter(0);
		
		try {
			// check if the conversation exists
			const conversation = await Conversation.findOne({ hex: conversationHex, participants: { $in: [hex] } }).exec();
			
			if (!conversation) {
				return this.jsonResponse(res, 404, { error: 'Conversation not found', success: false });
			}
			
			// check if the user has already pinned the conversation
			const pinned = conversation.pins.find(pin => pin.user === hex);
			
			if (pinned) {
				return this.jsonResponse(res, 400, { error: 'Conversation already pinned', success: false });
			}
			
			// check if the user has pinned less than 8 conversations
			if (conversation.pins.length >= maxPins) {
				return this.jsonResponse(res, 400, { error: 'Cannot pin more than 5 conversations', success: false });
			}
			
			// pin the conversation
			conversation.pins.push({ user: hex });
			await conversation.save();
			
			return this.jsonResponse(res, 200, { conversation, success: true });
		} catch (e) {
			console.error('Error pinning conversation:', e);
			return this.jsonResponse(res, 500, {error: 'Error pinning conversation', success: false});
		}
	}
	
	
	/*
		@name unpin
		@description Unpins a conversation for a given user: check existence and unpin
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<object>} The unpinned conversation
	*/
	async unpin({ req, res }) {
		const { user: { hex } } = req;
		const { hex: conversationHex } = req.getParameter(0);
		
		try {
			// check if the conversation exists
			const conversation = await Conversation.findOne({ hex: conversationHex, participants: { $in: [hex] } }).exec();
			
			if (!conversation) {
				return this.jsonResponse(res, 404, { error: 'Conversation not found', success: false });
			}
			
			// check if the user has already pinned the conversation
			const pinned = conversation.pins.find(pin => pin.user === hex);
			
			if (!pinned) {
				return this.jsonResponse(res, 400, { error: 'Conversation not pinned', success: false });
			}
			
			// unpin the conversation
			conversation.pins = conversation.pins.filter(pin => pin.user !== hex);
			await conversation.save();
			
			return this.jsonResponse(res, 200, { conversation, success: true });
		} catch (e) {
			console.error('Error unpinning conversation:', e);
			return this.jsonResponse(res, 500, {error: 'Error unpinning conversation', success: false});
		}
	}
	
	/*
		@name stats
		@description Get all statistics for all conversations for a given user
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<object>} The conversation statistics
	*/
	stats = async ({ req, res }) => {
		const { user: { hex } } = req;
		
		try {
			const total = await Conversation.countDocuments({ 'participants.hex': { $in: [hex] } }).exec();
			const unread = await Conversation.countDocuments({ 'participants.hex': { $in: [hex] }, unread: { $gt: 0 } }).exec();
			const requested = await Conversation.countDocuments({ 'participants.hex': { $in: [hex] }, kind: 'request', from: { $ne: hex } }).exec();
			
			return this.jsonResponse(res, 200, { total, unread, requested, success: true });
		} catch (e) {
			console.error('Error retrieving conversation statistics:', e);
			return this.jsonResponse(res, 500, {error: 'Error retrieving conversation statistics', success: false});
		}
	}
	
	/*
		@name accept
		@description Accepts a conversation request
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<object>} The accepted conversation
	*/
	accept = async ({ req, res }) => {
		const { user: { hex } } = req;
		const { hex: conversationHex } = req.getParameter(0);
		
		try {
			// check if the conversation exists
			const conversation = await Conversation.findOne({ hex: conversationHex, participants: { $in: [hex] }, kind: 'request' }).exec();
			
			if (!conversation) {
				return this.jsonResponse(res, 404, { error: 'Conversation not found', success: false });
			}
			
			// update the conversation to trusted
			conversation.kind = 'trusted';
			await conversation.save();
			
			return this.jsonResponse(res, 200, { conversation, success: true });
		} catch (e) {
			console.error('Error accepting conversation:', e);
			return this.jsonResponse(res, 500, {error: 'Error accepting conversation', success: false});
		}
	}
}


// export the service
module.exports = ConversationService;