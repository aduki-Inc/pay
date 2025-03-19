module.exports = (shortCode, passKey, timestamp) => {
	return Buffer.from(shortCode + passKey + timestamp).toString("base64");
};