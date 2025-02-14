const queues = require('./queues');
const SocketWorker = require('./socket');
const MailWorker = require('./mail');

// Export all imports
module.exports = { queues, SocketWorker, MailWorker };