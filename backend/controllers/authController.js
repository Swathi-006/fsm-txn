const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
const emailOk = (e) => /^\S+@\S+\.\S+$/.test(e || '');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
  if (!emailOk(email)) return res.status(400).json({ message: 'A valid email is required' });
  if (!password || password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email is already registered' });
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(user), user: { id: user._id, name: user.name, email: user.email } });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!emailOk(email) || !password) return res.status(400).json({ message: 'Email and password are required' });
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Incorrect email or password' });
  res.json({ token: sign(user), user: { id: user._id, name: user.name, email: user.email } });
};
