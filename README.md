# UtahQDRO.com

New Next.js/Vercel rebuild for UtahQDRO.com.

## Local development

Use Node.js 24. PDF attachments use the bundled Chromium browser in Linux
deployments. For local development, install Chrome or set
`PUPPETEER_EXECUTABLE_PATH` to a compatible browser executable.

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

## Generated document attachments

In a request modal, open **Preview documents**, select QDRO, Appearance,
Withdrawal, or an available Addendum, then click
**Attach Word document (.docx) to client**. Generation uses
the current preview values, including unsaved edits; it does not save those edits.
The generated file is saved in Firebase Storage and added to the request's
Firestore attachment list. Existing attachments remain available until removed.
**Generate Google Doc** continues to use the existing Google export flow.

DOCX attachments use the same simple, styled templates as the Google Docs export,
with editable text and tables. Pagination can vary between word processors.

Run `npm run test:documents` for document-generation regression checks.
