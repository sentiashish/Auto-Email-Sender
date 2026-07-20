"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { parseWorkbook, previewTemplate, type EmailRecord } from "@/lib/excel";

type UploadStatus =
  | { type: "idle"; message: string }
  | { type: "loading"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type ConnectionStatus =
  | { type: "idle"; message: string }
  | { type: "checking"; message: string }
  | { type: "ready"; message: string }
  | { type: "error"; message: string };

type DeliveryReport = {
  email: string;
  status: "sent" | "failed";
  error?: string;
};

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
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [deliveryReport, setDeliveryReport] = useState<DeliveryReport[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    type: "idle",
    message: "SMTP connection not checked yet.",
  });
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

      const result = (await response.json()) as {
        error?: string;
        sent?: number;
        failed?: number;
        total?: number;
        results?: DeliveryReport[];
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Sending failed.");
      }

      setDeliveryReport(result.results ?? []);
      setStatus({
        type: "success",
        message: `Sent ${result.sent ?? 0} of ${result.total ?? records.length} emails.`,
      });
    } catch (error) {
      setDeliveryReport([]);
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to send emails.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleCheckConnection = async () => {
    setCheckingConnection(true);
    setConnectionStatus({ type: "checking", message: "Checking SMTP connection..." });

    try {
      const response = await fetch("/api/test-smtp", {
        method: "POST",
      });

      const result = (await response.json()) as { ok?: boolean; message?: string; error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "SMTP verification failed.");
      }

      setConnectionStatus({
        type: "ready",
        message: result.message ?? "SMTP connection verified.",
      });
    } catch (error) {
      setConnectionStatus({
        type: "error",
        message: error instanceof Error ? error.message : "SMTP verification failed.",
      });
    } finally {
      setCheckingConnection(false);
    }
  };

  return (
    <main className="app-shell min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="panel rounded-[1.25rem] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <span className="badge px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                Bulk email workspace
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Send personalized email without leaving the spreadsheet workflow.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Import rows, verify the destination column, review the preview, and send through SMTP with a
                  straightforward interface.
                </p>
              </div>
            </div>

            <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:grid-cols-3 lg:min-w-[28rem] lg:grid-cols-1">
              <div className="flex items-center justify-between gap-3">
                <span>Workbook</span>
                <span className="font-medium text-slate-900">{fileName}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Recipients</span>
                <span className="font-medium text-slate-900">{records.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Mail column</span>
                <span className="font-medium text-slate-900">{emailColumn || "Not selected"}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <p
              className={`rounded-2xl border px-4 py-3 text-sm ${
                status.type === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : status.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : status.type === "loading"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {status.message}
            </p>
            <p
              className={`rounded-2xl border px-4 py-3 text-sm ${
                connectionStatus.type === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : connectionStatus.type === "ready"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : connectionStatus.type === "checking"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {connectionStatus.message}
            </p>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.16fr_0.92fr]">
          <div className="panel rounded-[1.25rem] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Source</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Upload a sheet and choose the column that contains email addresses.
                </p>
              </div>
              <label className="cursor-pointer rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95">
                Choose file
                <input className="hidden" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Detected columns</p>
              <p className="mt-2 leading-6">
                The app looks for <span className="font-semibold">email</span>, <span className="font-semibold">e-mail</span>,
                or <span className="font-semibold">mail</span> first.
              </p>

              <label className="mt-4 block text-sm font-medium text-slate-700">
                Recipient column
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
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

              <div className="mt-4 flex flex-wrap gap-2">
                {headers.length > 0 ? (
                  headers.map((header) => (
                    <span key={header} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                      {header}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
                    No file loaded yet
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="panel rounded-[1.25rem] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Compose</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Use <span className="font-semibold">{"{{Name}}"}</span> style placeholders for personalization.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                Draft mode
              </span>
            </div>

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
                  className="mt-2 min-h-56 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--primary)]"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Write your message"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  className="inline-flex items-center justify-center rounded-full bg-[var(--secondary)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={handleSend}
                  disabled={sending || records.length === 0}
                >
                  {sending ? "Sending..." : "Send all emails"}
                </button>

                <button
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={handleCheckConnection}
                  disabled={checkingConnection}
                >
                  {checkingConnection ? "Checking..." : "Test SMTP connection"}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="panel rounded-[1.25rem] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Preview</h2>
                  <p className="mt-1 text-sm text-slate-500">What the first row will look like.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {records.length === 0 ? 0 : 1} sample
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Subject</p>
                <p className="mt-2 font-semibold text-slate-950">{samplePreview.subject}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Message</p>
                <p className="mt-2 whitespace-pre-line leading-6 text-slate-600">{samplePreview.body}</p>
              </div>
            </div>

            <div className="panel rounded-[1.25rem] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Recipient preview</h2>
                  <p className="mt-1 text-sm text-slate-500">First rows from the uploaded workbook.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
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
            </div>

            <div className="panel rounded-[1.25rem] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Delivery report</h2>
                  <p className="mt-1 text-sm text-slate-500">Latest send results for each recipient.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {deliveryReport.length} rows
                </span>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Recipient</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {deliveryReport.length > 0 ? (
                      deliveryReport.map((item) => (
                        <tr key={item.email}>
                          <td className="px-4 py-3 font-medium text-slate-900">{item.email}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                item.status === "sent"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{item.error ?? "Delivered successfully"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-6 text-slate-500" colSpan={3}>
                          Run a send to see the per-recipient result report here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
