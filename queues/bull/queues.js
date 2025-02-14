const { redis } = require('../../configs');
const { Queue } = require('bullmq');

// Initialize queues
module.exports = {
	socket: new Queue('socketQueue', { connection: redis }),
	mail: new Queue('mailQueue', { connection: redis }),
};