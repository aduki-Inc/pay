const mongoose = require('mongoose');
const { user, code } = require('./user');
const account = require('./account');
const transaction = require('./transaction');
const api = require('./api');

const User = mongoose.model('User', user);
const Code = mongoose.model('Code', code);
const Account = mongoose.model('Account', account);
const Transaction = mongoose.model('Transaction', transaction);
const Api = mongoose.model('Api', api);

/* Export all models */
module.exports = { User, Code, Account, Transaction, Api };