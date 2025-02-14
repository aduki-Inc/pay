const ConversationService = require('./conversation');
const MessageService = require('./message');
const UserService = require('./user');

// export all services
module.exports = (app, api) => {
	// Conversation service
	new ConversationService(app, api);
	new MessageService(app, api);
	new UserService(app, api);
}