const mongoose = require('mongoose');
const connect = require('./connect');
const { mongo: { uri, options } } = require('../configs');
const { user, code } = require('./user');
const account = require('./account');
const transaction = require('./transaction');
const api = require('./api');

const User = mongoose.model('User', user);
const Code = mongoose.model('Code', code);
const Account = mongoose.model('Account', account);
const Transaction = mongoose.model('Transaction', transaction);
const Api = mongoose.model('Api', api);

connect(mongoose, uri, options).then(()=> console.log('mongo connect'))

/* Export all models */
module.exports = { User, Code, Account, Transaction, Api };