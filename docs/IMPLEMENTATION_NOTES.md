# UtahQDRO Rebuild Implementation Notes

This app is a new Next.js/Vercel implementation for UtahQDRO.com.

## What is implemented

- Public pages: Home, About, Retirement Plans, FAQs, Contact, QDRO Request, Payment.
- Client request wizard with readiness checks, conditional fields, autosave, uploads, live client signature, review, and payment handoff.
- Client portal with request status, notes, files, payment state, and signature state.
- Admin portal with request list/search, status editing, field editing, notes placeholder, schema view, and template library view.
- Document engine with merge-field preview, RTF export, and DOCX export helper.
- Stripe checkout route and verified Stripe webhook route.
- DocuSign envelope and webhook integration placeholders.
- Firebase client/admin setup, Firestore prototype rules, Storage prototype rules, and environment template.

## Required production wiring

- Add Firebase project credentials and enable email/password auth.
- Set admin role custom claims for admin users.
- Create Firestore collections from the modeled data or seed from `lib/content.ts`.
- Add Stripe credentials: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- Complete DocuSign JWT token exchange and envelope template mapping only if later formal e-sign routing is still needed after the built-in client signature.
- Add Google Drive API upload/convert logic for Google Docs export.
- Replace demo/local data reads and writes with Firestore services.

## Security note

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for authenticated client-owned request access, admin-only template and audit management, and client-visible-only note separation. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.

## Stripe checkout

- Vercel team/project: `hunter-law/utahqdro`. The connected Stripe resource starts in a sandbox; claim it and activate Hunter Law's Stripe account before accepting live payments.
- Checkout uses embedded Stripe Checkout Sessions with server-defined $550 full and $275 half payments. The client must be signed in and own the saved request.
- Register `/api/webhooks/stripe` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `checkout.session.async_payment_failed`. Set that endpoint's signing secret as `STRIPE_WEBHOOK_SECRET` in the matching Vercel environment. Checkout stays unavailable until this secret is configured.
- Stripe webhook signatures are verified against the raw body. Payment records are deduplicated by Checkout Session in a Firestore transaction; two half payments total $550 before marking paid in full. Later workflow statuses are preserved.
- A successful browser redirect never marks a request paid. Database failures return an error so Stripe retries. Failed delayed payments are recorded in the payment ledger and audit log without increasing the paid balance.
- The payment form appears directly inside both request wizards after the request is saved. Card completion returns to the portal; payment methods requiring external authorization return through Stripe’s configured return URL. Only the webhook marks payments paid.
- Deploy this migration before testing the public webhook. Use test keys and a sandbox endpoint for testing; use separate live keys and a live endpoint secret when launching. A restricted API key with only the required Checkout permissions is preferred.
- The old Square webhook is removed; disable its endpoint in Square when deploying the migration. Existing recorded payment states are retained.
