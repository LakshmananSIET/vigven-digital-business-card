# VIGVEN Digital Business Card

GitHub Pages + Google Apps Script + Google Sheets implementation for the VIGVEN employee digital business card system.

The public employee card uses hash routing (`#/card/<id>`) so QR codes remain compatible with GitHub Pages project sites.

## Backend setup
1. Open the Google Sheet bound to Apps Script.
2. Extensions → Apps Script.
3. Paste `apps-script/Code.gs` into Code.gs.
4. Add Script Property `ADMIN_PASSWORD`.
5. Deploy as Web App: Execute as **Me**, access **Anyone**.
6. Copy the `/exec` URL.
7. In this GitHub repository, add repository variable `VITE_APPS_SCRIPT_URL` with that URL.

## GitHub Pages
The workflow in `.github/workflows/deploy.yml` builds the React/Vite site and deploys it to GitHub Pages.

Public card format:
`https://<owner>.github.io/vigven-digital-business-card/#/card/<employee-id>`

Do not commit passwords, Google credentials, or other secrets.
