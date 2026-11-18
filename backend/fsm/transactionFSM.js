// Finite State Machine definition: M = (Q, Σ, δ, q0, F)
const STATES = ['Initiated', 'Validating', 'Processing', 'Completed', 'Failed', 'Rolled Back'];
const INITIAL_STATE = 'Initiated';
const FINAL_STATES = ['Completed', 'Rolled Back'];
const TRANSITIONS = {
  Initiated: ['Validating'],
  Validating: ['Processing', 'Failed'],
  Processing: ['Completed', 'Failed'],
  Completed: [],
  Failed: ['Rolled Back'],
  'Rolled Back': [],
};

class InvalidTransitionError extends Error {
  constructor(message, from, to) { super(message); this.name = 'InvalidTransitionError'; this.from = from; this.to = to; }
}

const isValidState = (s) => STATES.includes(s);
const allowedFrom = (s) => TRANSITIONS[s] || [];

function validateTransition(from, to) {
  if (!isValidState(from) || !isValidState(to)) return { valid: false, error: `Unknown state in transition "${from}" → "${to}".` };
  if (!allowedFrom(from).includes(to)) {
    const next = allowedFrom(from);
    return { valid: false, error: `Invalid transition: ${from} → ${to}. ${next.length ? `Allowed from ${from}: ${next.join(', ')}.` : `${from} is a terminal state.`}` };
  }
  return { valid: true };
}

const finalStatusFor = (state) => ({ Completed: 'Success', Failed: 'Failed', 'Rolled Back': 'Rolled Back' }[state] || 'Pending');

module.exports = { STATES, INITIAL_STATE, FINAL_STATES, TRANSITIONS, InvalidTransitionError, isValidState, allowedFrom, validateTransition, finalStatusFor };
