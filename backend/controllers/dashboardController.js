const Transaction = require('../models/Transaction');
const Log = require('../models/TransactionLog');
const engine = require('../services/transactionEngine');

exports.stats = async (req, res) => {
  const [total, success, failed, rolledBack, processing] = await Promise.all([
    Transaction.countDocuments(), Transaction.countDocuments({ finalStatus: 'Success' }),
    Transaction.countDocuments({ finalStatus: 'Failed' }), Transaction.countDocuments({ finalStatus: 'Rolled Back' }),
    Transaction.countDocuments({ currentState: { $in: ['Validating', 'Processing'] } }),
  ]);
  const since = new Date(); since.setHours(0, 0, 0, 0); since.setDate(since.getDate() - 6);
  const recentTx = await Transaction.find({ createdDate: { $gte: since } }).select('createdDate finalStatus');
  const day = (d) => new Date(d).toDateString();
  const byDay = [...Array(7)].map((_, i) => {
    const d = new Date(since); d.setDate(d.getDate() + i);
    const rows = recentTx.filter((t) => day(t.createdDate) === day(d));
    const n = (s) => rows.filter((r) => r.finalStatus === s).length;
    return { date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), success: n('Success'), failed: n('Failed'), rolledBack: n('Rolled Back') };
  });
  const finished = success + failed + rolledBack;
  res.json({ total, success, failed, rolledBack, processing, successRate: finished ? +((success / finished) * 100).toFixed(1) : 0, byDay, recent: await Transaction.find().sort('-createdDate').limit(6) });
};

exports.errors = async (req, res) => res.json(await Transaction.find({ failureService: { $ne: '' } }).sort('-createdDate').limit(50));

exports.services = async (req, res) => {
  const fails = await Log.aggregate([{ $match: { event: 'SERVICE_FAILED' } }, { $group: { _id: '$serviceName', failures: { $sum: 1 } } }]);
  const map = Object.fromEntries(fails.map((f) => [f._id, f.failures]));
  res.json(engine.getServiceStatus().map((s) => ({ ...s, totalFailures: map[s.name] || 0 })));
};
