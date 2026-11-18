require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User'); const Transaction = require('./models/Transaction'); const Log = require('./models/TransactionLog');
const engine = require('./services/transactionEngine');

const names = ['Aarav Mehta', 'Priya Nair', 'Rohan Das', 'Sneha Iyer', 'Karthik R', 'Divya S', 'Arjun K', 'Meera P', 'Vikram T', 'Ananya B', 'Rahul G', 'Lakshmi V'];
const methods = ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet'];
const scenarios = ['success', 'success', 'success', 'payment_fail', 'success', 'order_fail', 'success', 'auth_fail', 'success', 'order_fail', 'invalid_transition', 'success'];

(async () => {
  await connectDB();
  await Promise.all([User.deleteMany({}), Transaction.deleteMany({}), Log.deleteMany({})]);
  const user = await User.create({ name: 'Demo User', email: 'demo@example.com', password: await bcrypt.hash('Demo@1234', 10) });
  for (let i = 0; i < names.length; i++) {
    const created = new Date(Date.now() - Math.floor(i / 2) * 86400000 - i * 3600000);
    const tx = await Transaction.create({ transactionId: `TXN-DEMO${String(i + 1).padStart(3, '0')}`, customerName: names[i], amount: 250 + i * 375, paymentMethod: methods[i % 5], description: `Sample order #${1000 + i}`, createdBy: user._id, createdDate: created });
    await engine.executeTransaction(tx, scenarios[i], { delay: 0 });
  }
  console.log('Seeded. Login: demo@example.com / Demo@1234');
  await mongoose.disconnect();
})();
