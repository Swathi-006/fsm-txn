const Transaction = require('../models/Transaction');
const Log = require('../models/TransactionLog');
const fsm = require('../fsm/transactionFSM');
const engine = require('../services/transactionEngine');

const METHODS = ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet'];
const newId = () => `TXN-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
const find = async (req, res) => {
  const tx = await Transaction.findOne({ transactionId: req.params.id });
  if (!tx) res.status(404).json({ message: `Transaction ${req.params.id} not found` });
  return tx;
};

exports.list = async (req, res) => {
  const { search, status, limit = 200 } = req.query;
  const q = {};
  if (status) q.finalStatus = status;
  if (search) { const r = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); q.$or = [{ transactionId: r }, { customerName: r }]; }
  res.json(await Transaction.find(q).sort('-createdDate').limit(Math.min(+limit || 200, 500)));
};

exports.create = async (req, res) => {
  const { customerName, amount, paymentMethod, description, transactionId } = req.body;
  if (!customerName?.trim()) return res.status(400).json({ message: 'Customer name is required' });
  if (!(Number(amount) > 0)) return res.status(400).json({ message: 'Amount must be greater than 0' });
  if (!METHODS.includes(paymentMethod)) return res.status(400).json({ message: `Payment method must be one of: ${METHODS.join(', ')}` });
  let id = /^TXN-[A-Z0-9]{6,14}$/.test(transactionId || '') ? transactionId : newId();
  if (await Transaction.exists({ transactionId: id })) id = newId();
  const tx = await Transaction.create({ transactionId: id, customerName, amount: Number(amount), paymentMethod, description, createdBy: req.user._id });
  await Log.create({ transactionId: id, serviceName: 'FSM Engine', previousState: 'Initiated', currentState: 'Initiated', event: 'TRANSACTION_CREATED' });
  res.status(201).json(tx);
};

exports.get = async (req, res) => { const tx = await find(req, res); if (tx) res.json(tx); };

exports.execute = async (req, res) => {
  const tx = await find(req, res); if (!tx) return;
  const scenario = req.body.scenario || 'success';
  if (!engine.SCENARIOS.includes(scenario)) return res.status(400).json({ message: `Scenario must be one of: ${engine.SCENARIOS.join(', ')}` });
  if (tx.currentState !== fsm.INITIAL_STATE) return res.status(409).json({ message: `Cannot execute: transaction is already ${tx.currentState}` });
  res.status(202).json(tx); // runs in background; clients poll for live state
  engine.executeTransaction(tx, scenario).catch((e) => console.error('Execution error:', e.message));
};

exports.transition = async (req, res) => {
  const tx = await find(req, res); if (!tx) return;
  try {
    await engine.applyTransition(tx, req.body.to, engine.SERVICES.FSM, 'MANUAL_TRANSITION');
    res.json({ message: `Transition accepted: now ${tx.currentState}`, transaction: tx });
  } catch (e) {
    if (e instanceof fsm.InvalidTransitionError) return res.status(400).json({ message: e.message, from: e.from, to: e.to, allowed: fsm.allowedFrom(e.from) });
    throw e;
  }
};

exports.logs = async (req, res) => {
  if (!(await Transaction.exists({ transactionId: req.params.id }))) return res.status(404).json({ message: 'Transaction not found' });
  res.json(await Log.find({ transactionId: req.params.id }).sort('timestamp _id'));
};
