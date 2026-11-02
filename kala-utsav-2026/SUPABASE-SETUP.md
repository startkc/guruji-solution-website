# Supabase setup — KALA UTSAV 2026

Project URL: https://zgduzappxqgxbjdzcqzd.supabase.co

## 1. Create the shared registrations table
Open Supabase Dashboard → SQL Editor → New query. Paste the contents of `supabase-setup.sql` and click Run.

## 2. Create the three Auth users
Supabase Auth uses email/password internally. The application can present a username-only login and map each username to a non-deliverable internal address:
- jaya@kala-utsav.invalid
- mandavi@kala-utsav.invalid
- shivam@kala-utsav.invalid

In Authentication → Users → Add user, create each user with the corresponding internal address and the initial password agreed with the administrator; mark email confirmed if the dashboard offers that option. Disable public sign-ups in Authentication → Settings. Do not use real staff email addresses unless the officials want email-based recovery.

IMPORTANT: Supabase dashboard UI may reject reserved .invalid addresses. If so, stop and use a real controlled domain/subdomain for synthetic login aliases (e.g. auth.yourdomain.com), or use a trusted server-side username mapping. Do not invent real mailboxes.

## 3. Client configuration
The frontend uses only the Project URL and publishable key. Never put the service_role/secret key in browser code.

## Security
The SQL enables RLS and requires authentication for all operations. Since this is a three-user event app, keep public sign-ups disabled and create only the three approved users. Review policies before collecting real participant data.

## Offline
This SQL enables shared online storage only. Offline-first write queue and background sync still need application implementation and testing across devices. Do not assume offline records sync automatically until that is completed.
