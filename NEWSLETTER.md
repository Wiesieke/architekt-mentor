# ArchitectMentor newsletter setup

The site uses MailerLite's own embedded forms, confirmation and unsubscribe workflow. It never stores subscriber emails in LH.pl MySQL.

1. In MailerLite create two groups: `ArchitectMentor Weekly EN` and `Tydzień z ArchitectMentor PL`.
2. Under **Forms → Embedded forms**, create one form for each language and select its corresponding group. Keep **double opt-in** enabled on each form. Add a link to the matching data notice and use appropriate language in the form and success text.
3. In each form's **Overview**, copy the two JavaScript snippets. The universal snippet contains a numeric account ID; the short snippet contains a form ID such as `<div class="ml-embedded" data-form="..."></div>`. These are public identifiers, not API keys.
4. Configure and verify the sending domain in MailerLite using the DNS records it shows. The existing website remains on Vercel. Use `architektura@sensinte.com` as sender initially after domain authentication.
5. Set the following **Vercel Production and Preview** environment variables, then redeploy:
   - `PUBLIC_MAILERLITE_ACCOUNT_ID` — numeric account ID from the universal snippet
   - `PUBLIC_MAILERLITE_PL_FORM_ID` — Polish form ID
   - `PUBLIC_MAILERLITE_EN_FORM_ID` — English form ID
6. Test each form on the Vercel preview with different email addresses. Confirm that the confirmation email arrives, a confirmed subscriber joins only the matching group, no unconfirmed person receives a campaign, and unsubscribe works. Check the forms on mobile.

No MailerLite API key is needed for this integration. Keep both forms and the site CTA unpublished until the groups, sender domain and verification flow are tested. The site displays no home-page CTA without valid IDs.
