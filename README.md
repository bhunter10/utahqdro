# UtahQDRO.com

New Next.js/Vercel rebuild for UtahQDRO.com.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Main routes

- `/` public homepage
- `/qdro-request` client QDRO intake flow
- `/portal` client portal demo
- `/admin` admin workspace demo

## Deployment

The app is intended to deploy on Vercel. Copy `.env.example` into Vercel
environment variables before enabling live Firebase, Stripe, DocuSign, or Google
Docs integrations.
