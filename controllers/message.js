const { Message } = require('../models');
const { MessageValidators: {
	validateMessage, validateContent, validateReply
} } = require('../validators');
const { bull: { socketQueue } } = require('../queues');

class MessageController {
	constructor(app, ws, data, isBinary) {
		this.app = app;
		this.ws = ws;
		this.conversation = ws.conversation.hex;
		// get participants
		this.participants = ws.conversation.participants;
		this.users = this.participants.map(participant => participant.user);
		this.isBinary = isBinary;
		this.process(data);
	}
	
	/*
		@name process
		@description Processes an incoming message based on message kind: ['new',
		'update', 'reaction', 'status', 'remove', 'update', 'reply', 'forward']
		@type {method}
		@param {object} data The data object
	*/
	process = data => {
		const { kind, message } = data;
		const actions = {
			new: this.save,
			update: this.edit,
			reaction: this.react,
			status: this.delivered,
			remove: this.delete,
			reply: this.reply,
			forward: () => console.error('Forward feature not implemented')
		};
		
		const action = actions[kind];
		if (action) {
			action.call(this, message).then(() => console.log('Action executed'));
		} else {
			console.error('Invalid message kind:', kind);
		}
	}
	
	/*
		@name worker
		@description Add a message to socketQueue
		@type {method}
		@param {String} user hex: The user hex to send the message to
		@param {object} message The message object
		@returns {Promise<void>} The promise object
	*/
	worker = async (conversation, message) => {
		// contract data:
		const data = {
			to: this.users,
			kind: 'worker',
			conversation,
			data: message
		}
		// Send the message to the desired user
		await socketQueue.add('socketQueue', data , { attempts: 3, backoff: 1000, removeOnComplete: true });
	}
	
	/*
		@name validate
		@description Validates a message
		@type {method}
		@param {object} message The message object
		@returns {boolean} The validation result
	*/
	validate(kind, message) {
		try {
			let validatedMessage;
			if (kind === 'new') {
				validatedMessage = validateMessage(message, this.conversation);
			} else {
				validatedMessage = validateReply(message, this.conversation);
			}
			
			// if validatedMessage return false
			if (!validatedMessage) {
				return {
					validated: false,
					message: 'Invalid message format'
				}
			}
			
			return {
				validated: true,
				message: validatedMessage
			}
		} catch (error) {
			console.error('Error validating message:', error);
			return {
				validated: false,
				message: error.message
			}
		}
	}
	
	/*
		@name save message
		@description Saves a message to the database
		@type {method}
		@async
		@param {object} message The message object
		@returns {uWebSockets.js.Response} The publishes message
	*/
	save = async message => {
		// Validate the message
		if (!this.validate(message)) {
			throw new Error('Invalid message format');
		}
		
		// validate the message
		const {validated, message: validatedMessage} = this.validate('new', message);
		
		// if error terminate
		if (!validated) {
			console.error('Error validating message:', validatedMessage);
			// send an error message
			this.send({ kind: 'error', message: { error: validatedMessage } });
			return;
		}
		
		try {
			// Save the message
			const savedMessage = new Message({
				...validatedMessage,
				createdAt: new Date()
			});
			
			await savedMessage.save();

			const data = {
				message: savedMessage.toObject(),
				kind: 'new'
			};
			
			// publish the message
			this.publish(data);
			
			// send the message to the desired user
			await this.worker(savedMessage["conversation"], data);
		} catch (e) {
			console.error('Error saving message:', e);
			
			//	send an error message
			this.send({ kind: 'error', message: { kind: 'new', error: 'Error saving message' } });
		}
	}
	
	/*
		@name reply
		@description Replies to a message
		@type {method}
		@async
		@param {object} message The message object
		@returns {uWebSockets.js.Response} The publishes reply message
	*/
	reply = async message => {
		// Validate the message
		if (!this.validate(message)) {
			throw new Error('Invalid message format');
		}
		
		// validate the message
		const { validated, message: validatedMessage} =	this.validate('reply', message);
		
		// if error terminate
		if (!validated) {
			console.error('Error validating message:', validatedMessage);
			// send an error message
			this.send({ kind: 'error', message: { kind: 'reply', error: validatedMessage } });
			return;
		}
		
		try {
			// try to get the parent message
			const parentMessage = await Message.findOne({_id: validatedMessage.parent}).exec();
			
			// if a message not found terminate
			if (!parentMessage) {
				console.error('Parent message not found');
				// send an error message
				this.send({ kind: 'error', message: { kind: 'reply', error: 'Parent message not found' } });
				return;
			}
			
			// Save the message
			const savedMessage = new Message({
				...validatedMessage,
				reply: {
					recipientContent: parentMessage.senderContent,
					senderContent: parentMessage.recipientContent,
				},
				createdAt: new Date()
			});
			
			// Save the message
			await savedMessage.save();
			
			const data = {
				message: savedMessage.toObject(),
				kind: 'reply'
			};
			
			// publish the message
			this.publish(data);
			
			// send the message to the desired user
			await this.worker(savedMessage["conversation"], data);
		} catch (e) {
			console.error('Error replying to message:', e);
			
			//	send an error message
			this.send({ kind: 'error', message: { kind: 'reply', error: 'Error replying to message' } });
		}
	}
	
	/*
		@name publish message
		@description Broadcasts a message to all participants in a conversation
		@type {method}
		@param {object} message The message object
	*/
	publish = message => {
		// Save the message
		if (!message) {
			return;
		}
		
		// Publish the message to the `conversation:hex` channel
		this.ws.publish(`/chat/${this.conversation}`, JSON.stringify(message), this.isBinary);
	}
	
	/*
		@name send
		@description Sends a message send to only one user in the conversation
		@type {method}
		@async
		@param {string} recipient The recipient of the message
		@param {object} message The message object
	 */
	send = message => {
		try {
			// ws.send the message to the recipient
			this.ws.send(JSON.stringify(message), this.isBinary);
		} catch (e) {
			console.error('Error sending message:', e);
		}
	}
	
	/*
		@name delivered
		@description Marks a message as delivered
		@type {method}
		@async
		@param {id} message The message ID
		@returns {uWebSockets.js.Response} The publishes delivered status
	*/
	delivered = async id => {
		try {
			// get a message by id
			const message = await Message.findOne({_id: id}).exec();
			
			// if a message not found terminate
			if (!message) {
				console.error('Message not found');
				// send an error message
				this.send({ kind: 'error', message: { id: id, error: 'Message not found' } });
				return;
			}
			
			// update the message
			message.status = 'delivered';
			
			// save the message
			await message.save();
			
			// construct data
			const data = {
				kind: 'status',
				message: {
					_id: id,
					conversation: message.conversation,
					status: 'delivered'
				}
			}
			
			// publish the message
			this.publish(data);
			
			// send the message to the desired user
			await this.worker(message.conversation, data);
		} catch (e) {
			console.error('Error delivering message:', e);
			
			// send an error message
			this.send({ kind: 'error', message: { id: id, error: 'Error delivering message' } });
		}
	}
	
	/*
		@name read
		@description Marks a message as read
		@type {method}
		@async
		@param {id} message The message ID
		@returns {uWebSockets.js.Response} The publishes read status
	*/
	read = async id => {
		try {
			// get a message by id
			const message = await Message.findOne({_id: id}).exec();
			
			// if a message not found terminate
			if (!message) {
				console.error('Message not found');
				// send an error message
				this.send({ kind: 'error', message: { id: id, error: 'Message not found' } });
				return;
			}
			
			// update the message
			message.status = 'read';
			
			// save the message
			await message.save();
			
			const data = {
				kind: 'status',
				message: {
					_id: id,
					conversation: message.conversation,
					status: 'read'
				}
			}
			
			// publish the message
			this.publish(data);
			
			// send the message to the desired user
			await this.worker(message.conversation, data);
		} catch (e) {
			console.error('Error reading message:', e);
			// send an error message
			this.send({ kind: 'error', message: { id: id, error: 'Error reading message' } });
		}
	}
	
	/*
		@name react
		@description Reacts to a message
		@type {method}
		@async
		@param {id} message The message ID
		@param {string} reaction The reaction string: ['like', 'love', 'laugh', 'wow', 'sad', 'angry']
		@returns {uWebSockets.js.Response} The publishes reaction status
	*/
	react = async (id, reaction, user) => {
		try {
			// get a message by id
			const message = await Message.findOne({_id: id}).exec();
			
			// if a message not found terminate
			if (!message) {
				console.error('Message not found');
				// send an error message
				this.send({ kind: 'error', message: { id: id, error: 'Message not found' } });
				return;
			}
			
			// to add reaction, if the user === message.user add reaction to from else to
			if (user === message.user) {
				// if the reaction is null, remove the reaction
				if (!reaction) {
					message.reactions.from = null;
				} else {
					message.reactions.from = reaction;
				}
			} else {
				// if the reaction is null, remove the reaction
				if (!reaction) {
					message.reactions.to = null;
				} else {
					message.reactions.to = reaction;
				}
			}
			
			// save the message
			await message.save();
			
			const data = {
				kind: 'reaction',
				message: {
					_id: id,
					conversation: message.conversation,
					reactions: message.reactions
				}
			}
			
			// publish the message
			this.publish(data);
			
			// send the message to the desired user
			await this.worker(message.conversation, data);
		} catch (e) {
			console.error('Error reacting to message:', e);
			// send an error message
			this.send({ kind: 'error', message: { id: id, error: 'Error reacting to message' } });
		}
	}
	
	/*
		@name edit
		@description Edits a message
		@type {method}
		@async
		@param {id} message The message ID
		@param {string} senderContent The new content for the sender
		@param {string} recipientContent The new content for the recipient
	*/
	edit = async (id, senderContent, recipientContent) => {
		try {
			// validate the sender content and recipient content
			const validatedContent = validateContent({senderContent, recipientContent});
			// get a message by id
			const message = await Message.findOne({_id: id}).exec();
			
			// if a message not found terminate
			if (!message) {
				console.error('Message not found');
				// send an error message
				this.send({ kind: 'error', message: { id: id, error: 'Message not found' } });
				return;
			}
			
			// update the message
			message.senderContent = validatedContent.senderContent;
			message.recipientContent = validatedContent.recipientContent;
			
			// save the message
			await message.save();
			
			// construct data
			const data = {
				kind: 'update',
				message: {
					_id: id,
					conversation: message.conversation,
					senderContent: message.senderContent,
					recipientContent: message.recipientContent
				}
			}
			
			// publish the message
			this.publish(data);
			
			// send the message to the desired user
			await this.worker(message.conversation, data);
		} catch (e) {
			console.error('Error editing message:', e);
			// send an error message
			this.send({ kind: 'error', message: { id: id, error: 'Error editing message' } });
		}
	}
	
	/*
		@name delete
		@description Deletes a message
		@type {method}
		@async
		@param {id} message The message ID
	*/
	delete = async (id, user) => {
		try {
			// get a message by id
			const message = await Message.findOne({_id: id}).exec();
			
			// if a message not found terminate
			if (!message) {
				console.error('Message not found');
				// send an error message
				this.send({ kind: 'error', message: { id: id, error: 'Message not found' } });
				return;
			}
			
			// delete the message: only if the sender is the author of that message
			if (message.user === user) {
				const data = {
					kind: 'remove',
					message: {
						_id: id,
						conversation: message.conversation
					}
				}
				
				// delete the message
				await message.remove();
				
				// publish the message
				this.publish(data);
				
				// Send the message to the desired user
				await this.worker(message.conversation, data);
			} else {
				// send an error message
				this.send({ kind: 'error', message: { id: id, error: 'Unauthorized to delete message' } });
				console.error('Unauthorized to delete message');
			}
		} catch (e) {
			console.error('Error deleting message:', e);
			// send an error message
			this.send({ kind: 'error', message: { id: id, error: 'Error deleting message' } });
		}
	}
}

// export the class
module.exports = MessageController;