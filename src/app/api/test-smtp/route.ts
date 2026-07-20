import { NextResponse } from "next/server";
import { verifyMailerConnection } from "@/lib/mailer";

export async function POST() {
  try {
    const result = await verifyMailerConnection();

    return NextResponse.json({
      ok: true,
      message: `SMTP connection verified for ${result.host}:${result.port}.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "SMTP verification failed.",
      },
      { status: 400 },
    );
  }
}