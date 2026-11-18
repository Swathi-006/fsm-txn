# Multi-Service Transaction State Verification System

MERN app that simulates a four-service transaction (Authentication → Payment → Order → Confirmation) and verifies every state change with a finite state machine implemented in the backend.

## Structure
- `backend/fsm/transactionFSM.js` – states, transition map, `validateTransition`, `InvalidTransitionError`
- `backend/services/transactionEngine.js` – `executeTransaction`, `applyTransition` (every change is FSM-checked and logged), `handleFailure` (failure + rollback)
- `backend/{controllers,routes,models,middleware,config}` – Express REST API with Mongoose
- `frontend/src/{pages,components,services,styles,assets}` – React (Vite) UI

## Requirements
Node 18+ and MongoDB running locally (or an Atlas URI).

## Run
```bash
cd backend && cp .env.example .env && npm install && npm run seed && npm run dev
cd frontend && npm install && npm run dev      # http://localhost:5173
```
Seed login: `demo@example.com` / `Demo@1234`. The Vite dev server proxies `/api` to port 5000. For deployment set `VITE_API_URL` to your API URL at build time and `CLIENT_URL` on the backend.

## FSM rules
Initiated→Validating, Validating→Processing, Processing→Completed, Validating→Failed, Processing→Failed, Failed→Rolled Back. Everything else is rejected with HTTP 400 and recorded as `INVALID_TRANSITION` in `TransactionLogs`.

## Test scenarios (New transaction page)
Success · Authentication failure · Payment failure · Order failure (rolls back) · Invalid transition (FSM rejects an illegal jump; transaction stays Initiated). You can also attempt arbitrary transitions on the State machine page.

## API
`POST /api/auth/register|login` · `GET|POST /api/transactions` · `GET /api/transactions/:id` · `POST /api/transactions/:id/execute` (`{scenario}`) · `POST /api/transactions/:id/transition` (`{to}`) · `GET /api/transactions/:id/logs` · `GET /api/services/status` · `GET /api/dashboard/stats` · `GET /api/dashboard/errors`. All except auth need `Authorization: Bearer <token>`.

All services are simulated; nothing connects to real payment systems.
