# EventSphere

Full-stack event management app — React + Node/Express + PostgreSQL.

## Setup

### 1. Database
```
psql -U postgres -c "CREATE DATABASE eventsphere;"
cd server
cp .env.example .env
```
Edit `server/.env` — set `DATABASE_URL` and `JWT_SECRET`.

```
npm install
npm run db:init
npm run db:seed
```

### 2. Backend
```
cd server
npm run dev
```
Runs on http://localhost:5000

### 3. Frontend (new terminal)
```
cd client
cp .env.example .env
npm install
npm run dev
```
Runs on http://localhost:5173

### 4. Open the app
http://localhost:5173

## Seeded accounts (password: `password123`)
- admin@eventsphere.io (admin)
- sara@eventsphere.io (organizer)
- ali@eventsphere.io (attendee)

## Notes
- Payments are mocked (no real Stripe/JazzCash/EasyPaisa keys needed) — see `PAYMENT_SUCCESS_RATE` in `server/.env`.
- Live chat uses Socket.IO; admin QR check-in accepts the raw `qr_hash` value shown under each ticket's QR code.
