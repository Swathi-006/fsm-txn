const jwt = require('jsonwebtoken');
const User = require('../models/User');
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const protect = wrap(async (req, res, next) => {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return res.status(401).json({ message: 'Authentication required' });
  try {
    const { id } = jwt.verify(h.slice(7), process.env.JWT_SECRET || 'dev_secret');
    req.user = await User.findById(id);
    if (!req.user) return res.status(401).json({ message: 'User no longer exists' });
    next();
  } catch { res.status(401).json({ message: 'Invalid or expired token' }); }
});
module.exports = { wrap, protect };
