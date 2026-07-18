import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

type MailTransportConfig = {
  host?: string;
  port?: string;
  secure?: string;
  user?: string;
  pass?: string;
  from?: string;
};

const getMailConfig = (): MailTransportConfig => ({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM,
});

export function getMailerStatus() {
  const config = getMailConfig();

  return {
    ready:
      Boolean(config.host) &&
      Boolean(config.port) &&
      Boolean(config.user) &&
      Boolean(config.pass) &&
      Boolean(config.from),
    from: config.from ?? "",
  };
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const config = getMailConfig();

  if (!config.host || !config.port || !config.user || !config.pass || !config.from) {
    throw new Error(
      "SMTP configuration is incomplete. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.",
    );
  }

  const transport = nodemailer.createTransport({
    host: config.host,
    port: Number(config.port),
    secure: config.secure === "true" || Number(config.port) === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transport.sendMail({
    from: config.from,
    to,
    subject,
    html,
  });
}