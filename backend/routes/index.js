const router = require('express').Router();
const { wrap, protect } = require('../middleware/common');
const auth = require('../controllers/authController');
const tx = require('../controllers/transactionController');
const dash = require('../controllers/dashboardController');

router.post('/auth/register', wrap(auth.register));
router.post('/auth/login', wrap(auth.login));

router.use(protect);
router.get('/transactions', wrap(tx.list));
router.post('/transactions', wrap(tx.create));
router.get('/transactions/:id', wrap(tx.get));
router.post('/transactions/:id/execute', wrap(tx.execute));
router.post('/transactions/:id/transition', wrap(tx.transition));
router.get('/transactions/:id/logs', wrap(tx.logs));
router.get('/services/status', wrap(dash.services));
router.get('/dashboard/stats', wrap(dash.stats));
router.get('/dashboard/errors', wrap(dash.errors));
module.exports = router;
