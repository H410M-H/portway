import { Resend } from 'resend';

// Use a singleton for the Resend client
const globalForResend = globalThis as unknown as {
  resend: Resend | undefined;
};

export const resend =
  globalForResend.resend ??
  new Resend(process.env.RESEND_API_KEY || 're_dummy');

if (process.env.NODE_ENV !== 'production') globalForResend.resend = resend;

export const EMAIL_FROM = process.env.EMAIL_FROM || 'Syncbay <no-reply@syncbay.app>';
