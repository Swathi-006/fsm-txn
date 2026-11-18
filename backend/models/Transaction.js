const mongoose = require('mongoose');
const { STATES } = require('../fsm/transactionFSM');
module.exports = mongoose.model('Transaction', new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  paymentMethod: { type: String, required: true },
  description: { type: String, default: '' },
  currentState: { type: String, enum: STATES, default: 'Initiated' },
  finalStatus: { type: String, enum: ['Pending', 'Success', 'Failed', 'Rolled Back'], default: 'Pending' },
  scenario: { type: String, default: 'success' },
  failureService: { type: String, default: '' },
  failureReason: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdDate: { type: Date, default: Date.now },
}));
