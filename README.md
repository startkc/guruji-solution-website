# Guruji Solution website starter

This is a beginner-friendly, mobile-responsive static website starter for an education consultancy.

## Included
- Responsive home page
- Services and broad career pathways
- Course/institution verification checklist
- Sample notices (replace before launch)
- Searchable sample resource dashboard
- Contact form that prepares a WhatsApp message
- A clearly marked future login section

## Important limitations
This is a **static prototype**, not a complete student-management application.
- The login feature is not implemented. Do not collect passwords or private student data in this version.
- The dashboard uses sample content stored in `index.html`; it does not have a database or staff editing interface.
- The contact form opens WhatsApp; it does not send or store the form on a server.
- Before launch, replace the placeholder WhatsApp number in `script.js`, review contact details and replace sample notices with verified content.
- Do not publish private records, passwords, API keys or student personal information in this public repository.

## Edit the WhatsApp number
Open `script.js` and replace:
`const WHATSAPP_NUMBER = "91XXXXXXXXXX";`
with your business number using country code and digits only, e.g. `919876543210`.

## Publish using GitHub Pages
1. Sign in at https://github.com/.
2. Create a new repository named `guruji-solution-website` (Public is the simplest option for GitHub Pages).
3. Upload `index.html`, `style.css`, `script.js`, and this `README.md` to the repository's top level.
4. Open repository **Settings → Pages**.
5. Under build/deployment, select **Deploy from a branch**; choose branch `main` and folder `/(root)`, then Save.
6. Wait for the published URL shown in Settings → Pages.
7. Test the site on a phone and desktop.

## Connect your existing domain
1. In **Settings → Pages → Custom domain**, enter your domain (for example `example.com`) and Save.
2. At your domain registrar's DNS page, follow the current GitHub Pages custom-domain instructions:
   - For an apex/root domain (`example.com`), configure the A/AAAA records GitHub currently documents.
   - For `www.example.com`, configure a CNAME to your GitHub Pages hostname.
3. Avoid deleting existing email-related MX/TXT records.
4. Wait for DNS propagation. Then enable **Enforce HTTPS** when GitHub offers it.
5. Follow GitHub's current documentation: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

## Recommended next stage: secure login and editable notices
For secure authentication, staff-managed notices and a database, use a backend such as Supabase or a full-stack host. Do not put service-role keys or admin credentials in front-end JavaScript. Set database access policies before entering real user data. We should add this only after the public site is reviewed and the business requirements are clear.
