# Bulk Email Sender

A Next.js App Router app for uploading a spreadsheet, previewing recipient rows, and sending personalized emails through SMTP.

## Features

- Upload `.xlsx`, `.xls`, or `.csv` files.
- Detect and choose the recipient column.
- Preview the first rows before sending.
- Use template placeholders like `{{Name}}` in the subject and body.
- Send messages through a server-side `/api/send` route.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in your SMTP settings.
3. Start the app with `npm run dev`.
4. Upload a file, choose the email column, compose the message, and send.

## SMTP environment variables

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Gmail setup

If you want to use Gmail, set `SMTP_HOST` to `smtp.gmail.com`, `SMTP_PORT` to `465` or `587`, and `SMTP_SECURE` to `true` when using port `465`.

Use a Google App Password for `SMTP_PASS` instead of your normal account password.

Keep `SMTP_FROM` as the display name and Gmail address you want recipients to see.

## Build

```bash
npm run build
```

## Notes

- The first worksheet in the uploaded file is used.
- Real sending requires valid SMTP credentials.

## Deployment

Before deploying, make sure the hosting environment provides the SMTP variables from `.env.example` and that the mail provider allows server-side SMTP access.

After deployment, verify the app by opening the home page and using the built-in SMTP connection test before sending a campaign.