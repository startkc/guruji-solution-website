# Deploy the shared-PIN API

This function keeps the shared PIN and Supabase service-role key on the server. Never put either value in the website JavaScript or GitHub.

## Required before deploy
The table SQL currently declares `created_by uuid not null references auth.users(id)`. For PIN-only access (no Supabase Auth), edit the table to remove that constraint:
```sql
alter table public.kala_registrations alter column created_by drop not null;
alter table public.kala_registrations drop constraint if exists kala_registrations_created_by_fkey;
```
Also keep RLS enabled. The Edge Function uses the service-role key server-side and is the only intended data gateway. Do not grant anon table access.

## Create the function
Supabase Dashboard → Edge Functions → Deploy a new function → Via Editor.
Function name: `kala-api`.
Paste the source from `index.ts` in this folder.

## Set function secrets
In Edge Functions → Secrets, set:
- `KALA_PIN` = the shared six-digit PIN chosen by the administrator.
- `KALA_SESSION_SECRET` = a newly generated long random secret (at least 32 random characters; do not reuse the PIN).
- `SUPABASE_URL` = `https://zgduzappxqgxbjdzcqzd.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = the project's service_role/secret key. Add it only in Supabase Secrets; never send it in chat or commit it to GitHub.

Deploy the function. For the initial PIN-only API, turn off JWT verification for this function in its function settings because it performs its own signed-session validation after the PIN exchange. Do not expose the service-role key.

## Important status
This function source is a deployment scaffold. After deployment, test login, list, create and delete with test records before connecting the live app. Offline queue/background sync and edit support are not yet implemented. Keep the event app out of production use until end-to-end tests pass.
