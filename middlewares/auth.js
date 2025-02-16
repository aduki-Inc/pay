// encryption: validate and return decoded token details
const { token: { verify } } = require('../utils');
const { User, Conversation } = require('../models');

// Validate and return decoded token details
const authorize = async cookies => {
	// console.log('Cookies', cookies)
	const token = cookies
		?.split('; ')
		?.find(cookie => cookie.startsWith('x-access-token='))
		?.split('=')[1];
	
	if (!token) {
		return null;
	}
	
	const {
		user,
		error
	} = await verify(token);
	
	// console.log('User', user)
	
	if (error) {
		console.error('JWT verification failed:', error);
		return null;
	}
	
	return user;
}

checkConversation = async ({hex, user}) => {
	// console.log('Hex', hex, 'User', user)
	if (!hex) {
		console.error('Conversation hex missing');
		return null;
	}
	
	try {
		// console.log('Before Fetched data')
		// Use await here directly with exec()
		const conversation = await Conversation.findOne({ hex }).exec();
		// console.log('Fetched data', conversation)
		
		if (!conversation) {
			console.log('Conversation not found for hex:', hex);
			return null;
		}
		
		// Check if the user is a participant in the conversation
		const member = conversation.participants.find(participant =>
			participant.user.toString() === user
		);
		
		if (!member) {
			console.log(`User ${user} is not a participant in conversation with hex: ${hex}`);
			return null;
		}
		
		return conversation;
	} catch (err) {
		console.log('Error fetching conversation:', err);
		return null;
	}
}

// export the middleware
module.exports = {
	authorize, checkConversation
}