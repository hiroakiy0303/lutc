# Implementation Notes

## Current implementation

The current website is a standalone static HTML page:

- Source: `site/src/index.html`
- About detail page: `site/src/about.html`
- Shared styling: `site/src/styles.css`
- Hero assets: `site/src/assets/hero/`
- Styling: shared external CSS
- Interaction: embedded JavaScript for mobile navigation
- Form: static `mailto:` action placeholder

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
- Replace `mailto:` with a production form backend
- Add structured metadata and JSON-LD when legal information is finalized
