# TravelMate — Admin Panel (self-contained)

A standalone admin panel for the TravelMate ride-sharing app. **It does not touch the main TravelMate project** — it has its own backend (`backend/`) that connects to the *same* MongoDB database and reads/manages the same data.

Features:

1. **Income** — overall revenue, monthly revenue, revenue by plan, and a full payment history (from `subscriptions`).
2. **Coupons** — times used, unique people who used each one, plus add / delete / enable / disable.
3. **Rides & Bookings** — every ride posted, who posted it, who booked, and who rode.
4. **Reports** — user-to-user reports; read the reason and block the offender permanently.
5. **Users** — list everyone, block / unblock.

```
travel-admin/
├─ backend/          ← standalone admin API (Express + MongoDB), port 5001
│  ├─ server.js
│  ├─ config/db.js
│  ├─ models/        (User, Ride, Coupon, Subscription, Report, Booking)
│  ├─ routes/        (adminRoutes, reportRoutes, bookingRoutes)
│  └─ .env           ← set MONGO_URI + credentials here
└─ src/              ← admin frontend (React + Vite), port 5174
```

---

## Setup — run two things

### 1. Admin backend (Terminal 1)

```bash
cd travel-admin/backend
npm install
```

Open `backend/.env` and set:

```
PORT=5001
MONGO_URI=<paste the SAME MONGO_URI from the main project's server/.env>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=travelmate@admin
JWT_SECRET=<any long random string>
```

> The `MONGO_URI` **must** be the same one the main app uses — that's how the admin panel sees the real users, rides, coupons and payments.

Then start it:

```bash
npm run dev      # or: npm start
```

You should see `🚀 Admin backend running on http://localhost:5001` and `✅ Admin backend connected to MongoDB`.

### 2. Admin frontend (Terminal 2)

```bash
cd travel-admin
npm install
npm run dev      # opens http://localhost:5174
```

`travel-admin/.env` already points to the backend:

```
VITE_API_URL=http://localhost:5001
```

### 3. Log in

| Username | Password |
|----------|----------------------|
| `admin`  | `travelmate@admin`   |

(Change these in `backend/.env`.)

---

## API (served by `travel-admin/backend`, port 5001)

Admin routes need `Authorization: Bearer <token>` from login.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/admin/login` | Get admin token |
| GET  | `/api/admin/stats` | Dashboard totals (incl. income) |
| GET  | `/api/admin/income` | Income summary + payment list |
| GET/POST/PATCH/DELETE | `/api/admin/coupons` | Coupon management |
| GET  | `/api/admin/rides` | Rides + who booked / rode |
| GET  | `/api/admin/reports` | Reports |
| POST | `/api/admin/reports/:id/block` | Block reported user |
| POST | `/api/admin/reports/:id/resolve` | Dismiss report |
| GET  | `/api/admin/users` | Users |
| POST | `/api/admin/users/block` · `/unblock` | Block / unblock |

Public (so the **main app** can feed data into the admin panel):

| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/api/reports` | `{ reporterPhone, reportedPhone, reason, description?, rideId? }` |
| POST | `/api/bookings` | `{ rideId, riderPhone, status? }` |

---

## How data is populated

- **Income & coupons** work immediately — they read existing `subscriptions` and `coupons`.
- **Reports** appear when the main app calls `POST http://localhost:5001/api/reports` from a "Report user" button.
- **Bookings** ("who booked / rode") appear when the main app calls `POST http://localhost:5001/api/bookings` (and `PATCH /api/bookings/:id { status:"completed" }` when a ride is finished).

Both backends share one database, so anything the admin backend writes (e.g. blocking a user) is visible to the main app too.

Built with React 18 + Vite 5 (frontend) and Express + Mongoose (backend). Plain CSS, brand-matched to TravelMate.
