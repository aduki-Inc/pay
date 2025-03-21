const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
module.exports = timestamp;