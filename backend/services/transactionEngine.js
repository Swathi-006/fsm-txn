// Runs the simulated multi-service workflow. Every state change goes through applyTransition(),
// which asks the FSM to validate it first and logs the result.
const Log = require('../models/TransactionLog');
const fsm = require('../fsm/transactionFSM');

const S = { AUTH: 'Authentication Service', PAY: 'Payment Validation Service', ORDER: 'Order Processing Service', CONFIRM: 'Confirmation Service', FSM: 'FSM Engine' };
const SERVICE_NAMES = [S.AUTH, S.PAY, S.ORDER, S.CONFIRM];
const SCENARIOS = ['success', 'auth_fail', 'payment_fail', 'order_fail', 'invalid_transition'];

const serviceState = {};
const setService = (name, status, message) => { serviceState[name] = { name, status, message, updatedAt: new Date() }; };
SERVICE_NAMES.forEach((n) => setService(n, 'Active', 'Idle and healthy'));
const getServiceStatus = () => SERVICE_NAMES.map((n) => serviceState[n]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const logEvent = (tx, service, event, error = '', prev = tx.currentState, cur = tx.currentState) =>
  Log.create({ transactionId: tx.transactionId, serviceName: service, previousState: prev, currentState: cur, event, errorMessage: error });

async function applyTransition(tx, to, service, event, error = '') {
  const from = tx.currentState;
  const check = fsm.validateTransition(from, to);
  if (!check.valid) {
    await logEvent(tx, service, 'INVALID_TRANSITION', check.error, from, from);
    throw new fsm.InvalidTransitionError(check.error, from, to);
  }
  tx.currentState = to;
  tx.finalStatus = fsm.finalStatusFor(to);
  await tx.save();
  await logEvent(tx, service, event, error, from, to);
  return tx;
}

async function handleFailure(tx, service, reason, rollback, wait) {
  setService(service, 'Failed', reason);
  tx.failureService = service; tx.failureReason = reason;
  await applyTransition(tx, 'Failed', service, 'SERVICE_FAILED', reason);
  if (rollback) {
    await wait();
    await applyTransition(tx, 'Rolled Back', S.ORDER, 'ROLLBACK_COMPLETED', 'Compensation: inventory reservation released and payment hold voided');
    setService(S.ORDER, 'Failed', `${reason} (rolled back)`);
  }
}

async function executeTransaction(tx, scenario = 'success', { delay = 800 } = {}) {
  const wait = () => sleep(delay);
  if (tx.currentState !== fsm.INITIAL_STATE) throw new Error(`Transaction already in state ${tx.currentState}`);
  tx.scenario = scenario;

  if (scenario === 'invalid_transition') {
    await wait();
    try { await applyTransition(tx, 'Completed', S.FSM, 'UNAUTHORIZED_JUMP'); } catch (e) { if (!(e instanceof fsm.InvalidTransitionError)) throw e; }
    return tx; // FSM rejected the jump; transaction remains Initiated
  }

  setService(S.AUTH, 'Processing', 'Verifying user');
  await applyTransition(tx, 'Validating', S.AUTH, 'AUTH_STARTED');
  await wait();
  if (scenario === 'auth_fail') return handleFailure(tx, S.AUTH, 'Authentication rejected: user identity could not be verified', false, wait);
  setService(S.AUTH, 'Active', 'User verified');
  await logEvent(tx, S.AUTH, 'AUTH_SUCCESS');

  setService(S.PAY, 'Processing', 'Validating payment');
  await wait();
  if (scenario === 'payment_fail') return handleFailure(tx, S.PAY, 'Payment declined: insufficient funds (simulated)', false, wait);
  setService(S.PAY, 'Active', 'Payment validated');
  await applyTransition(tx, 'Processing', S.PAY, 'PAYMENT_VALIDATED');

  setService(S.ORDER, 'Processing', 'Processing order');
  await wait();
  if (scenario === 'order_fail') return handleFailure(tx, S.ORDER, 'Order processing failed: item out of stock (simulated)', true, wait);
  setService(S.ORDER, 'Active', 'Order processed');
  await logEvent(tx, S.ORDER, 'ORDER_PROCESSED');

  setService(S.CONFIRM, 'Processing', 'Confirming transaction');
  await wait();
  await applyTransition(tx, 'Completed', S.CONFIRM, 'TRANSACTION_CONFIRMED');
  setService(S.CONFIRM, 'Active', 'Transaction confirmed');
  return tx;
}

module.exports = { SERVICES: S, SCENARIOS, applyTransition, executeTransaction, handleFailure, getServiceStatus };
