# ResumeAI — Tailored Resumes in Seconds

AI-powered resume tailoring engine. Paste your master resume + any job description → get a perfectly tailored, ATS-optimized 1-page resume instantly.

## Features

- **Smart Matching Engine** — Extracts JD keywords, scores every bullet for relevance
- **AI Bullet Rewriting** — Rewrites with action verbs and quantified impact (Anthropic Claude)
- **ATS Score Analyzer** — Detailed breakdown of keyword matches and missing skills
- **Cover Letter Generator** — 3 tone options (Professional, Conversational, Bold)
- **4 Resume Templates** — Classic, Modern, Minimal, Executive
- **Paywall** — 1 free generation, then ₹99/week via Razorpay
- **Google OAuth** — One-click login

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL (Supabase) |
| AI | Anthropic Claude API |
| Payments | Razorpay Subscriptions |
| Auth | Google OAuth 2.0 + JWT |
| Deploy | Vercel (frontend) + Render/Railway (backend) |

## Quick Start (Local Development)

### 1. Clone and install

```bash
git clone <your-repo-url> resumeai
cd resumeai
npm run install:all
```

### 2. Get your credentials

You need 4 things:

**a) Google OAuth Client ID**
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized JavaScript origins: `http://localhost:5173`
4. Add authorized redirect URIs: `http://localhost:5173`
5. Copy the Client ID

**b) Razorpay Keys**
1. Sign up at https://razorpay.com
2. Go to Settings → API Keys → Generate Test Key
3. Create a subscription plan:
   - Dashboard → Subscriptions → Plans → Create Plan
   - Name: "ResumeAI Weekly", Period: Weekly, Amount: 9900 (paise = ₹99)
   - Copy the Plan ID (starts with `plan_`)
4. Set up webhook:
   - Settings → Webhooks → Add New
   - URL: `https://YOUR_BACKEND_URL/api/payment/webhook`
   - Events: payment.captured, subscription.activated, subscription.cancelled
   - Copy the webhook secret

**c) Supabase Database**
1. Create a project at https://supabase.com
2. Go to Settings → Database → Connection string → URI
3. Replace `[YOUR-PASSWORD]` with your DB password

**d) Anthropic API Key**
1. Go to https://console.anthropic.com
2. Create an API key

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

Also create `client/.env`:
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_RAZORPAY_KEY_ID=rzp_test_your_key
```

### 4. Initialize database

```bash
cd server && node config/initDb.js
```

### 5. Run

```bash
# From root directory
npm run dev
```

Frontend runs on port 5173, backend on port 3001.

## Deployment

### Frontend → Vercel

1. Push code to GitHub
2. Import in Vercel, set root directory to `client`
3. Add env vars: `VITE_GOOGLE_CLIENT_ID`, `VITE_RAZORPAY_KEY_ID`
4. Edit `client/vercel.json` — replace `YOUR_RENDER_URL` with your backend URL
5. Deploy

### Backend → Render

1. Create Web Service on Render
2. Root directory: `server`
3. Build: `npm install` / Start: `node index.js`
4. Add ALL env vars from `.env`
5. Set `CLIENT_URL` to your Vercel URL

### Post-deploy checklist

- [ ] Update Google OAuth origins/redirects with production URLs
- [ ] Update Razorpay webhook URL
- [ ] Run `node config/initDb.js` with production DATABASE_URL
- [ ] Test full flow: login → generate → paywall → subscribe → generate again

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/google | No | Google OAuth login |
| GET | /api/auth/me | Yes | Get current user |
| POST | /api/generate | Yes+Paywall | Generate tailored resume |
| GET | /api/generate/history | Yes | Generation history |
| POST | /api/cover-letter | Yes+Paywall | Generate cover letter |
| POST | /api/ats/analyze | Yes | ATS score analysis |
| GET | /api/templates | No | List templates |
| POST | /api/templates/render | No | Render with template |
| POST | /api/payment/create-subscription | Yes | Create subscription |
| GET | /api/payment/status | Yes | Check subscription |
| POST | /api/payment/cancel | Yes | Cancel subscription |
| POST | /api/payment/webhook | No | Razorpay webhook |

## License

MIT
