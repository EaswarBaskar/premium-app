# Invite7

## Local setup

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor.
3. Copy `.env.example` to `.env.local` and set `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the server-only `SUPABASE_SECRET_KEY`.
4. In Supabase Authentication, enable Email provider. Hosts use `/login`; unauthenticated visitors are redirected there before `/dashboard` loads.
5. Start the app:

```bash
npm install
npm run dev
```

The secret key is used only by Next.js route handlers. Never expose it as a `NEXT_PUBLIC_` variable or commit `.env.local`. Run the updated schema again if the existing `invitations` table does not yet have its `owner_id` column.
