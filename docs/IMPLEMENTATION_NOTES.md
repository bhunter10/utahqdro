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
- Add Stripe keys and `STRIPE_QDRO_PRICE_ID`.
- Complete DocuSign JWT token exchange and envelope template mapping only if later formal e-sign routing is still needed after the built-in client signature.
- Add Google Drive API upload/convert logic for Google Docs export.
- Replace demo/local data reads and writes with Firestore services.

## Security note

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for authenticated client-owned request access, admin-only template and audit management, and client-visible-only note separation. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.
