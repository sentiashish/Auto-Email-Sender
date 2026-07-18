import { NextResponse } from "next/server";
import { previewTemplate } from "@/lib/excel";
import { getMailerStatus, sendEmail } from "@/lib/mailer";

type BulkSendBody = {
  subject?: string;
  body?: string;
  records?: Array<{ email: string; data: Record<string, string> }>;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as BulkSendBody;
  const subject = payload.subject?.trim();
  const body = payload.body?.trim();
  const records = payload.records ?? [];

  if (!subject || !body) {
    return NextResponse.json({ error: "Subject and body are required." }, { status: 400 });
  }

  if (records.length === 0) {
    return NextResponse.json({ error: "Upload a sheet with at least one recipient." }, { status: 400 });
  }

  const mailerStatus = getMailerStatus();

  if (!mailerStatus.ready) {
    return NextResponse.json(
      {
        error: "SMTP is not configured yet. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.",
      },
      { status: 400 },
    );
  }

  const results = await Promise.allSettled(
    records.map(async (record) => {
      const html = previewTemplate(body, record.data).replace(/\n/g, "<br />");
      await sendEmail({
        to: record.email,
        subject: previewTemplate(subject, record.data),
        html,
      });

      return record.email;
    }),
  );

  const sent = results.filter((result) => result.status === "fulfilled").length;
  const failed = results.filter((result) => result.status === "rejected").length;

  return NextResponse.json({
    ok: failed === 0,
    sent,
    failed,
    total: records.length,
  });
}