# Groovy Holdings (Pvt) Ltd — Website

Full-stack website for T-shirt / cap printing, embroidery, mugs and merchandise.

| Part | Tech |
|------|------|
| `client/` | Next.js 14 (App Router), React 18, Tailwind CSS, Recharts, Socket.io client, next-themes (dark / light) |
| `server/` | Node.js, Express, MongoDB (Mongoose), JWT (httpOnly cookie), Socket.io, Nodemailer, Multer, Google APIs (Sign-in, Calendar, Meet) |

## Features

**Customers**
- Register with email + password (email verification by Nodemailer) or sign in with Google. WhatsApp number is required.
- Forgot / reset password by email. Profile page: details, address, photo (upload, Google photo, remove), change / set password.
- Browse the product showcase (past work) by category with prices, materials, custom details and a size chart.
- Place an order: sizes × colours × quantities, message, delivery details, **design file upload is required**.
  No design? The form sends them to WhatsApp (+94 77 766 0791) so the team can design it.
- Track orders (progress bar, history, final price, payments) and cancel while still pending.
- Real-time chat with the team: files, shared-files panel, typing indicator, seen ticks. Every message is emailed.
- Book a Google Meet meeting from open slots. A booked slot disappears for everyone instantly;
  the Meet link and Google Calendar invite go to the customer and all admins.

**Admins**
- Admin registration needs the admin code (`ADMIN_CODE`, default `GroovyAdmin123`). Google sign-in is customers only.
- Dashboard with daily / weekly / monthly / yearly charts: visitors, page views, devices, top pages, orders, revenue,
  order value, new customers, meetings, orders by status and category, conversion, recent activity. Updates live.
- Manage users (WhatsApp link, block, role, verify, delete, open chat), categories, products (up to 12 photos,
  size chart editor with presets, custom fields, featured / hidden), orders (status → customer email, price, payments,
  expected date, internal notes), chat inbox (online status) and meeting slots (bulk create).
- Settings: connect Google Calendar in one click.

## 1. Requirements

- Node.js **18.17+** (20 LTS recommended)
- MongoDB — local (Community Server) or a free MongoDB Atlas cluster
- A Gmail account (or any SMTP) for emails
- A Google Cloud project (for Google Sign-in and Calendar / Meet)

## 2. Install

```bash
cd server && npm install
cd ../client && npm install
```

## 3. Configure

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

### server/.env (important values)

| Key | What to put |
|-----|-------------|
| `MONGO_URI` | `mongodb://127.0.0.1:27017/groovy_holdings` or your Atlas connection string |
| `CLIENT_URL` | `http://localhost:3000` (your real domain in production) |
| `JWT_SECRET` | long random string: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_CODE` | secret code needed to create admin accounts |
| `SMTP_USER` / `SMTP_PASS` | Gmail address + **App password** (Google Account → Security → 2-Step Verification → App passwords) |
| `MAIL_FROM` | e.g. `"Groovy Holdings <you@gmail.com>"` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | from Google Cloud (below) |
| `GOOGLE_REDIRECT_URI` | `http://localhost:5000/api/google/calendar/callback` |

If SMTP is not set, the server still runs; emails are skipped and logged.

### client/.env.local

| Key | Value |
|-----|-------|
| `BACKEND_URL` | `http://localhost:5000` |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:5000` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | the same Google Client ID as the server |
| `NEXT_PUBLIC_WHATSAPP` | `94777660791` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |

### Google Cloud setup (Sign-in + Calendar / Meet)

1. <https://console.cloud.google.com> → create a project.
2. **APIs & Services → Library** → enable **Google Calendar API**.
3. **OAuth consent screen** → External → add app name, support email, and your Gmail as a test user.
4. **Credentials → Create credentials → OAuth client ID → Web application**
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:5000/api/google/calendar/callback`
5. Copy the Client ID / Secret into both env files.
6. Run the site, sign in as admin → **Admin → Settings → Connect Google Calendar** and choose the business Google account.
   From then on every booking creates a calendar event with a Meet link and invites the customer + admins.

## 4. Run (development)

Two terminals:

```bash
# Terminal 1
cd server
npm run dev          # API + Socket.io on http://localhost:5000

# Terminal 2
cd client
npm run dev          # Website on http://localhost:3000
```

Optional sample data (categories + products) and a ready admin:

```bash
cd server
SEED_ADMIN_EMAIL=admin@groovy.lk SEED_ADMIN_PASSWORD=Admin12345 SEED_ADMIN_NAME="Groovy Admin" npm run seed
```

(On Windows PowerShell set the variables with `$env:SEED_ADMIN_EMAIL="admin@groovy.lk"` etc., then `npm run seed`.)

Or create an admin from the website: **/admin/register** with the admin code.

## 5. Production

- Build the client: `cd client && npm run build && npm start` (port 3000). Run the server with `npm start` (use PM2).
- Put both behind Nginx with HTTPS. Set `NODE_ENV=production`, `COOKIE_SECURE=true`, a strong `JWT_SECRET`,
  real `CLIENT_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SOCKET_URL` and `BACKEND_URL`.
- Add the production domain to Google OAuth origins / redirect URIs.
- Uploaded files live in `server/uploads` — back this folder up (public images + private designs / chat files).

## 6. Changing the logo

Replace `client/public/logo.jpg` (keep the file name) — it is used in the navbar, admin, favicon and chat.

## Project structure

```
server/src
  app.js, index.js          Express app + HTTP / Socket.io bootstrap
  config/                   env + database
  models/                   User, Category, Product, Order, Conversation, Message, MeetingSlot, Visit, Setting, Counter
  controllers/              auth, profile, admin users, stats, categories, products, orders, chat, meetings, google, files, analytics
  routes/                   /api/* routers
  middleware/               auth (JWT), uploads (multer), rate limits, errors
  socket/                   real-time chat, typing, presence
  utils/                    email + templates, Google Calendar, JWT, helpers
client/src
  app/(site)/               public site, auth pages, account, chat, meetings, profile
  app/admin/(panel)/        admin dashboard, users, categories, products, orders, chat, meetings, settings
  components/               UI kit, layout, products, chat, orders, admin widgets
  context/                  Auth + Socket providers
```

## Security notes

- Passwords hashed with bcrypt; JWT in an httpOnly cookie; password change / block signs the user out everywhere.
- Rate limits on login, register and email endpoints; NoSQL-injection filter; Helmet headers.
- Design files and chat attachments are private: only the owner customer and admins can open them (`/api/files/...`).
