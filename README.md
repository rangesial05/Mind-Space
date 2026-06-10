# 🌿 MindSpace — Deployment Guide

A teen mental health companion app with 4 AI friends (Astha, Varun, Rahul, Soumi).

---

## 📁 Project Structure

```
mindspace/
├── pages/
│   ├── index.js          ← redirects root → /app.html
│   └── api/
│       └── chat.js       ← secure API proxy (hides your Anthropic key)
├── public/
│   └── app.html          ← the entire frontend
├── .env.example          ← copy this to .env.local
├── vercel.json           ← Vercel routing config
├── next.config.js
└── package.json
```

---

## 🚀 Deploy to Vercel (step by step)

### Step 1 — Get your Anthropic API key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / log in → click **API Keys** → **Create Key**
3. Copy the key (starts with `sk-ant-...`) — save it somewhere safe

---

### Step 2 — Set up Upstash Redis (free, for rate limiting)
1. Go to [upstash.com](https://upstash.com) → Sign up free
2. Click **Create Database** → choose a region close to India (e.g. `ap-south-1`)
3. Once created, go to the database → **REST API** tab
4. Copy:
   - `UPSTASH_REDIS_REST_URL`  (looks like `https://xxx.upstash.io`)
   - `UPSTASH_REDIS_REST_TOKEN` (long string)

> **Note:** If you skip Upstash, the app still works — rate limiting just won't be enforced. Add it before going public.

---

### Step 3 — Push to GitHub
```bash
# In the mindspace/ folder:
git init
git add .
git commit -m "initial commit"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/mindspace.git
git push -u origin main
```

---

### Step 4 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Click **Add New Project** → Import your `mindspace` repo
3. Framework Preset: **Next.js** (auto-detected)
4. Click **Environment Variables** and add these three:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-your-key-here` |
| `UPSTASH_REDIS_REST_URL` | `https://your-db.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | `your-token-here` |

5. Click **Deploy** — takes ~2 minutes
6. Your app is live at `https://mindspace-xxx.vercel.app` 🎉

---

### Step 5 — Custom domain (optional, ~₹900/year)
1. In Vercel dashboard → your project → **Settings → Domains**
2. Add your domain (e.g. `mindspace.in`)
3. Follow the DNS instructions — HTTPS is automatic

---

## 💸 Cost estimate

| Thing | Cost |
|-------|------|
| Vercel hosting | **Free** (Hobby plan) |
| Upstash Redis | **Free** (10k requests/day) |
| Custom domain | ~₹900/year (optional) |
| Anthropic API | ~$3 per million tokens |

**At 1,000 users/day, 5 messages each = ~5,000 messages/day**
Each message ≈ 800 tokens → ~4M tokens/day → ~$12/day at scale.

For early launch (under 100 users/day): well under $1/day.

---

## 🔒 Rate limiting details

- **100 messages per user per day**, tracked by IP address
- Resets every 24 hours (sliding window)
- Users see a live counter in the top bar
- At 10 messages remaining → warning toast
- At 0 → friendly message from the AI, send button disabled

---

## 🛠 Local development

```bash
cd mindspace
npm install

# Create your local env file
cp .env.example .env.local
# Fill in your keys in .env.local

npm run dev
# → Open http://localhost:3000
```

---

## 🔐 Security notes

- Your Anthropic API key **never touches the browser** — it lives only in Vercel env vars
- All AI requests go through `/api/chat` (server-side)
- Messages are sanitized and capped at 4000 chars each
- Conversation history is capped at 200 turns

---

## 📞 Crisis resources (India)
- **iCall:** 9152987821
- **Vandrevala Foundation:** 1860-2662-345 (24/7)
- **Crisis Text Line:** Text HELLO to 741741
