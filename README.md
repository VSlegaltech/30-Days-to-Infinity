# 30 Days to Infinity

Prototype website for the book platform.

## Confirmed Product Choices

- Chapters are public.
- Reader auth uses Supabase Auth with Google and Facebook OAuth.
- Supabase stores chapters, workbook responses, community questions, moderator answers, products, and orders.
- Community questions appear only after author approval.
- Checkout should default to USD payments.

## Local Prototype

Open `index.html` directly in a browser. The prototype stores data in `localStorage` so you can test editing chapters, saving workbook entries, approving questions, and adding products without a backend.

## Production Next Steps

1. Create a Supabase project and run `docs/supabase-schema.sql`.
2. Enable Google and Facebook providers in Supabase Auth.
3. Add one author/moderator profile in `profiles` with `role = 'author'`.
4. Replace localStorage reads/writes in `app.js` with Supabase queries.
5. Create a serverless checkout endpoint for USD payments. Never expose checkout secret keys in frontend code.
6. Verify payment webhooks on the server before marking orders as paid.
