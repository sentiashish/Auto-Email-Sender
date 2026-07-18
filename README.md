# Bulk Email Sender

A Next.js app for uploading an Excel sheet, previewing recipient rows, and sending personalized emails in batches.

## Features

- Upload `.xlsx` or `.xls` files.
- Detect and choose the recipient column.
- Use template placeholders like `{{Name}}` in the subject and body.
- Send all emails through a server-side SMTP route.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in your SMTP settings.
3. Run the app with:

```bash
npm run dev
```

## SMTP environment variables

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Build

```bash
npm run build
```

## Notes

- The first worksheet in the uploaded file is used.
- The app previews the first few recipient rows before sending.
- Real sending requires valid SMTP credentials.


/////////////

The base app is scaffolded successfully. I’m reading the generated surface now so I can replace it with the bulk-email workflow in the smallest possible slice, then I’ll validate it with a build.

I’ve identified the current app shell and a small correction in the memory lookup: the preferences note is only three lines long. Next I’m checking the existing page, layout, and package so I can replace the starter content with the email importer cleanly.

The starter app is plain boilerplate, so I’m checking the repo instructions before I edit anything. That lets me keep the implementation aligned with the workspace rules and avoid undoing setup conventions later.

The repo has one important note: this scaffolded Next.js version expects us to check the installed docs before editing. I’m locating the relevant App Router guidance now, then I’ll make the first implementation pass.

I’ve confirmed the local Next docs are present, but the folder layout is slightly different from the old docs path. I’m narrowing to the App Router API references I need for the page and route handler, then I’ll switch to editing.

I have enough local evidence to proceed: this should be a client-facing page with a route handler for the send action, plus a small file parsing utility. I’m editing the page, API route, styles, and package dependencies in one pass now so the first validation can be a focused build.

Searched VS Code API for "Next.js App Router route handlers, file conventions for app/api route.ts, reading form data and returning JSON, and client components with use client for upload forms. Need examples relevant to implementing a POST endpoint for bulk email sending and a page with file input in Next.js 16 App Router."

I’ve got the implementation shape: a single upload/compose page, a /api/send endpoint, and a small helper for reading Excel rows into emails. I’m patching that now, then I’ll install the needed mail/excel packages and run a build right after.

Generating patch (572 lines) in package.json, layout.tsx, globals.css, page.tsx, excel.ts, mailer.ts, route.ts

The first patch attempt failed on tool formatting, not on the code itself. I’m retrying in smaller, clean chunks so I can get the scaffold replaced without wasting time.

Apply Patch

I hit a patch-structure issue while adding the new page file, so I’m splitting the work into two patches. First I’m landing the shared helpers, API route, styles, and dependencies; then I’ll replace the page cleanly.

The shared pieces are in place. I’m replacing the starter home page now with the upload, column selector, template composer, preview, and send button so the app has an end-to-end flow.

Edited
page.tsx+324-60
The code slice is in place. I’m installing the new mail and Excel packages now so the first build check can actually exercise the updated app instead of failing on missing modules.

Dependencies are installed. I’m running the project build next to catch any TypeScript or App Router issues in the exact slice I changed.

npm run build
The first build found two local defects, both in the slice I changed: one CSS brace mismatch and one JSX text escape around the placeholder example. I’m fixing those directly and then rerunning the build immediately.

The defects were exactly where the build pointed. I’ve corrected them and I’m rerunning the build now to verify the app is clean end to end.

npm run build
The code now compiles, and TypeScript has narrowed the remaining problem to missing Nodemailer types. I’m adding that type package and rebuilding so the validation covers the exact mail path too.

The missing types are installed. I’m running the build one more time to confirm the app is fully validated after the mail helper change.

The build is green, so the core app is done. I’m finishing the project hygiene pass now by updating the README and adding workspace instructions, then I’ll mark the task complete.

The README patch missed because the scaffolded file content didn’t match the replacement context exactly. I’m switching to a full-file replacement for the README and adding the instruction file separately.

The README replacement needs a clean reset rather than a line diff, so I’m deleting the generated file and recreating it with the project-specific content.

Deleted README.md

The documentation pass is done. I’m marking the remaining setup item complete now that the README and workspace instructions are in place.

Completed: Create project instructions (3/4)

I’ve finished the code and docs. I’m saving one short repo note with the app’s build and workflow details so future edits don’t have to rediscover them.

Created memory file email_auto.md

Built the project into a Next.js bulk email sender. You can upload an Excel file, choose the email column, preview recipient rows, write one template with placeholders like {{Name}}, and send the campaign through an SMTP-backed API. The main pieces are in src/app/page.tsx, src/app/api/send/route.ts, src/lib/excel.ts, and src/lib/mailer.ts.

I also updated the docs in README.md, added workspace instructions in .github/copilot-instructions.md, and verified the app with npm run build.

To actually send email, fill in .env.local from .env.example with your SMTP details. If you want, I can next add one of these:

Gmail-specific setup
CSV export/import support
Email sending progress and failure report