const mongoose = require('mongoose');
module.exports = mongoose.model('TransactionLog', new mongoose.Schema({
  transactionId: { type: String, required: true, index: true },
  serviceName: { type: String, required: true },
  previousState: { type: String, required: true },
  currentState: { type: String, required: true },
  event: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  errorMessage: { type: String, default: '' },
}));
