const { redis } = require('../../configs');
const { Worker: Socket } = require('bullmq');
const { send } = require('../../mail');

class MailWorker {
	constructor() {
		this.worker = new Socket(
			'mailQueue',
			async (job) => {
				try {
					const data = job.data;
					// send the message to the desired user
					await send (data);
				} catch (error) {
					console.error(`Failed to process job ${job.id}:`, error);
					throw error; // Ensure failure is tracked
				}
			},
			{ connection: redis }
		);
		
		// Set up event listeners
		this.worker.on('completed', (job) => {
			console.log(`Mail job ${job.id} completed`);
		});
		
		this.worker.on('failed', (job, err) => {
			console.error(`Mail job ${job.id} failed with error:`, err);
		});
		
		console.log('Mail worker process initialized');
	}
}

module.exports = MailWorker;
