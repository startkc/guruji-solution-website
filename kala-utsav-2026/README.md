# Kala Utsav 2026 Registration App

## Included
- Installable offline-first PWA.
- 12 art forms and event dates based on the supplied district schedule.
- Individual and group/team registration.
- Local IndexedDB storage and offline app-shell caching.
- Three registration profiles: श्रीमती जया, श्रीमती मांडवी कुमारी, श्री शिवम कुमार.
- Search, category/block summaries, JSON backup/import and CSV export.

## Important limitation before live event use
This deployed version is a functional **single-device offline prototype**. Selecting an official is a local profile selector, NOT secure password authentication. Records are stored only in the current browser/device. It does not yet synchronize across three phones. Do not rely on it as a secure multi-device production system until cloud authentication and database policies are configured.

## Enable secure individual logins and shared sync
1. Create a Supabase project.
2. Create three Supabase Auth users for the registration officials.
3. Create a database table for registrations, including an owner/user ID, entry ID, category, date, type, participant names, block, school, U-DISE, remarks, official and timestamps.
4. Enable Row Level Security. Restrict access to the three approved accounts. Add policies for authorized read/write and avoid public anonymous access.
5. Add Supabase project URL and public anon key to the frontend. Never put a service-role key in browser code.
6. Implement offline mutation queue, synchronization, conflict handling and duplicate checks. Test with three phones and airplane mode before live use.

## Publish
Files are in /kala-utsav-2026/ in the existing repository startkc/guruji-solution-website. If GitHub Pages is enabled, the likely URL is:
https://startkc.github.io/guruji-solution-website/kala-utsav-2026/
Check repository Settings > Pages for the confirmed published address.

## Schedule
- Dance categories: 05.11.2026
- Visual arts categories: 05 and 06.11.2026
- Music, theatre and traditional storytelling: 06.11.2026
- Venue: G.A. Inter School, Hajipur
- Reporting time: 09:00 AM
