"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { parseWorkbook, previewTemplate, type EmailRecord } from "@/lib/excel";

type UploadStatus =
  | { type: "idle"; message: string }
  | { type: "loading"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

const detectEmailColumn = (headers: string[]) => {
  const directMatch = headers.find((header) => /email|e-mail|mail/i.test(header));
  return directMatch ?? headers[0] ?? "email";
};

export default function Home() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [records, setRecords] = useState<EmailRecord[]>([]);
  const [fileName, setFileName] = useState("No file selected yet");
  const [emailColumn, setEmailColumn] = useState("email");
  const [subject, setSubject] = useState("Application follow-up for {{Name}}");
  const [body, setBody] = useState(
    "Hi {{Name}},\n\nI am following up on the role we discussed. Please let me know if you need any additional information.\n\nBest regards,\nYour Name",
  );
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<UploadStatus>({
    type: "idle",
    message: "Upload an Excel file with one recipient per row.",
  });

  const samplePreview = useMemo(() => {
    const firstRecord = records[0];

    if (!firstRecord) {
      return { subject, body };
    }

    return {
      subject: previewTemplate(subject, firstRecord.data),
      body: previewTemplate(body, firstRecord.data),
    };
  }, [body, records, subject]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setStatus({ type: "loading", message: "Reading workbook..." });

    try {
      const parsed = await parseWorkbook(file);
      const detectedColumn = detectEmailColumn(parsed.headers);

      setHeaders(parsed.headers);
      setRecords(parsed.records);
      setEmailColumn(detectedColumn);
      setFileName(file.name);
      setStatus({
        type: "success",
        message: `Loaded ${parsed.records.length} recipients from ${file.name}.`,
      });
    } catch (error) {
      setHeaders([]);
      setRecords([]);
      setFileName(file.name);
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Could not read the file.",
      });
    }
  };

  const handleSend = async () => {
    if (records.length === 0) {
      setStatus({ type: "error", message: "Upload a sheet before sending emails." });
      return;
    }

    setSending(true);
    setStatus({ type: "loading", message: "Sending emails..." });

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          records: records.map((record) => ({
            email: record.data[emailColumn] ?? record.email,
            data: record.data,
          })),
        }),
      });

      const result = (await response.json()) as { error?: string; sent?: number; failed?: number; total?: number };

      if (!response.ok) {
        throw new Error(result.error ?? "Sending failed.");
      }

      setStatus({
        type: "success",
        message: `Sent ${result.sent ?? 0} of ${result.total ?? records.length} emails.`,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to send emails.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="glass-panel overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-6">
              <div className="chip px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em]">
                Bulk email from Excel
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Upload one spreadsheet and send personalized emails to every row.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                  Drop in a worksheet, choose the recipient column, write one template, and send the same campaign
                  to all contacts without typing each address by hand.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="rounded-full bg-white/80 px-4 py-2 shadow-sm ring-1 ring-slate-200">
                  Excel import
                </span>
                <span className="rounded-full bg-white/80 px-4 py-2 shadow-sm ring-1 ring-slate-200">
                  Template variables
                </span>
                <span className="rounded-full bg-white/80 px-4 py-2 shadow-sm ring-1 ring-slate-200">
                  SMTP send
                </span>
              </div>
            </div>

            <div className="section-card rounded-[1.75rem] p-5 sm:p-6">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Status</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-slate-950 px-4 py-4 text-sm text-white">
                  <div className="flex items-center justify-between gap-3">
                    <span>Workbook</span>
                    <span className="text-emerald-300">{fileName}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-slate-300">
                    <span>Recipients</span>
                    <span>{records.length}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-slate-300">
                    <span>Mail column</span>
                    <span>{emailColumn || "Not selected"}</span>
                  </div>
                </div>
                <p
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    status.type === "error"
                      ? "bg-rose-50 text-rose-700"
                      : status.type === "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : status.type === "loading"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-50 text-slate-600"
                  }`}
                >
                  {status.message}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="section-card rounded-[1.75rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">1. Upload recipients</h2>
                <p className="mt-1 text-sm text-slate-500">Use the first sheet of your Excel file.</p>
              </div>
              <label className="cursor-pointer rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:opacity-95">
                Choose file
                <input className="hidden" type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-sm text-slate-600">
              <p className="font-medium text-slate-800">Expected columns</p>
              <p className="mt-2 leading-6">
                The app automatically looks for <span className="font-semibold">email</span>,{" "}
                <span className="font-semibold">e-mail</span>, <span className="font-semibold">mail</span>, or a
                similar column.
              </p>

              <label className="mt-5 block text-sm font-medium text-slate-700">
                Recipient column
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-[var(--primary)]"
                  value={emailColumn}
                  onChange={(event) => setEmailColumn(event.target.value)}
                >
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {headers.length > 0 ? (
                  headers.map((header) => (
                    <span key={header} className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                      {header}
                    </span>
                  ))
                ) : (
                  <span className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                    No file loaded yet
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="section-card rounded-[1.75rem] p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-slate-950">2. Compose and preview</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use double braces like <span className="font-semibold">{"{{Name}}"}</span> to personalize each
              email.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Subject
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Subject"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Message
                <textarea
                  className="mt-2 min-h-44 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--primary)]"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Write your message"
                />
              </label>

              <div className="rounded-2xl bg-slate-950 px-5 py-4 text-sm text-slate-100">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Preview</p>
                <p className="mt-3 font-semibold text-white">{samplePreview.subject}</p>
                <p className="mt-3 whitespace-pre-line leading-6 text-slate-200">{samplePreview.body}</p>
              </div>

              <button
                className="inline-flex items-center justify-center rounded-full bg-[var(--secondary)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-200 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleSend}
                disabled={sending || records.length === 0}
              >
                {sending ? "Sending..." : "Send all emails"}
              </button>
            </div>
          </div>
        </section>

        <section className="section-card rounded-[1.75rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Recipient preview</h2>
              <p className="mt-1 text-sm text-slate-500">First rows from the uploaded workbook.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
              {Math.min(records.length, 5)} shown
            </span>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Sample fields</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {records.slice(0, 5).map((record) => (
                  <tr key={`${record.email}-${Object.keys(record.data).length}`}>
                    <td className="px-4 py-3 font-medium text-slate-900">{record.email}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {Object.entries(record.data)
                        .slice(0, 4)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" • ")}
                    </td>
                  </tr>
                ))}
                {records.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={2}>
                      Upload a workbook to preview the recipient list.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
