const fs = require('fs').promises;

// Read a file from the file system
const read = async path => {
	try {
		return await fs.readFile(path, 'utf8');
	}
	catch (err) {
		console.error(err);
		return null;
	}
}

module.exports = read;