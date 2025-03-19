module.exports = async (mongoose, uri, options) => {
	try {
		await mongoose.connect(uri, options);
		console.log('Connected to MongoDB');
	} catch (e) {
		console.error('Failed to connect to MongoDB:', e);
	}

	mongoose.connection.on('connected', () => console.log('Mongoose connected to MongoDB'));
	mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err));
	mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected from MongoDB'));
	mongoose.connection.on('reconnected', () => console.log('Mongoose reconnected to MongoDB'));
}