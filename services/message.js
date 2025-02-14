const { chat: { messagesLimit }} = require('../configs')
const BaseService = require('./base');
const { Message } = require('../models');

/*
	@name messageService
	@description This service handles all message-related operations
	@method constructor Initializes the message service
*/
class MessageService extends BaseService {
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
			{ method: 'get', url: `${this.api}/conversation/:hex/messages`, handler: this.messages.bind(this) },
		];
		
		routes.forEach((route) => {
			this.registerRoute(route.method, route.url, route.handler);
		});
	}
	
	/*
		@name messages
		@description Fetches all messages in a conversation: hex:
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<Array<Conversation>>} Paginated unread messages by sorted by the updatedAt
	*/
	async messages({ req, res }) {
		const { hex } = req.params;
		const { page = 1 } = req.body;
		
		try {
			const messages = await Message.find({ conversation: hex }).
				sort({ createdAt: -1 }).
				limit(messagesLimit).
				skip((page - 1) * messagesLimit).
				exec();
			
			this.jsonResponse(res, 200, { messages, success: true });
		} catch (error) {
			console.error('Error fetching messages:', error);
			this.jsonResponse(res, 500, { error: 'Internal Server Error', success: false });
		}
	}
}

module.exports = MessageService;