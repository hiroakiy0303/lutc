# Implementation Notes

## Current implementation

The current website is a standalone static HTML page:

- Source: `site/src/index.html`
- About detail page: `site/src/about.html`
- Shared styling: `site/src/styles.css`
- Hero assets: `site/src/assets/hero/`
- Styling: shared external CSS
- Interaction: embedded JavaScript for mobile navigation and contact-form submission
- Form: posts to a Google Apps Script web app (see "Contact form backend" below); `mailto:info@lutc.jp` remains as a no-JS fallback

## Firebase Hosting

- Firebase project ID: `lutc-com`
- Firebase Hosting site: `lutc-com`
- Public root: `site/src`
- Live URL: `https://lutc-com.web.app`
- Config: `firebase.json`

Deploy from the repository root:

```powershell
firebase deploy --only hosting --project lutc-com
```

## Contact form backend

The contact form posts submissions to a **Google Apps Script (GAS) web app**, which appends
them to the Google Sheet **「LUTC お問い合わせ管理」** and sends an auto-reply to the submitter
plus an internal notification to `info@lutc.jp`. Replies are sent from a custom menu inside the
sheet. See [`apps-script/README.md`](../../apps-script/README.md) for full setup; decision record:
`context/decisions/0002-contact-form-backend.md`.

- Source of truth for the GAS code: `apps-script/` (`Code.gs` / `Notify.gs` / `Reply.gs` /
  `ReplyDialog.html` / `appsscript.json`).
- Management spreadsheet: **LUTCお問合せフォーム** `https://docs.google.com/spreadsheets/d/1jQdgbkyB_pOqDN8W1Wt4qG6HZHuI9tP12qh3riYN2KA/edit`
- The GAS web app is deployed (**access: Anyone**) and its `/exec` URL is set on the form's
  `data-endpoint` in `site/src/index.html`. Re-deploying as a new version keeps the same URL.
- Transport is `application/x-www-form-urlencoded` (no CORS preflight); on failure the form shows a
  `mailto:` fallback message.
- To send mail as `info@lutc.jp`, add it as a "send mail as" alias on the script owner's Gmail and
  set `CONFIG.USE_FROM_ALIAS = true` in `apps-script/Code.gs`.

## Custom domain DNS

Firebase Hosting custom domain setup for `lutc.jp` is pending DNS verification.
Add these records in MuuMuu DNS:

| Type | Host | Value |
| --- | --- | --- |
| A | `lutc.jp` | `199.36.158.100` |
| TXT | `lutc.jp` | `hosting-site=lutc-com` |

After DNS propagation, return to Firebase Console Hosting and click confirm for `lutc.jp`.

## Known placeholders

- Contact email: `info@lutc.jp`
- Formal legal entity type is not yet confirmed.
- Formal address display for ARUYO ODAWARA is not yet confirmed.
- Production privacy policy text is not yet finalized.

## Logo

The header and footer use the adopted formal wordmark expression:

- Red background
- White `LUTC`
- Rectangular Swiss-style lockup

The reusable SVG asset is stored at:

`brand/assets/logos/lutc-wordmark-red.svg`

## Next implementation candidates

- Add favicon and OGP image under `site/public`
- Add structured metadata and JSON-LD when legal information is finalized
- (Done) Replaced `mailto:` with a GAS + Spreadsheet form backend — see "Contact form backend"
