import "server-only";
import { Resend } from "resend";
import { formatPaise } from "./utils";

/**
 * Emails are plain HTML rather than React Email components — mail clients
 * strip most CSS anyway, and the brand here is flat blocks and 1px borders,
 * which table-based HTML renders more reliably than a component tree.
 *
 * Without RESEND_API_KEY, sends are logged and skipped so local flows still
 * complete end to end.
 */

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.EMAIL_FROM ?? "FreshPools <hello@freshpools.in>";
const NOTIFY = process.env.NOTIFY_EMAIL ?? "hello@freshpools.in";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://freshpools.in";

type SendArgs = { to: string | string[]; subject: string; html: string };

async function send({ to, subject, html }: SendArgs): Promise<boolean> {
  if (!resend) {
    console.info(`[email] RESEND_API_KEY unset — skipped "${subject}" to ${to}`);
    return false;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("[email] send failed", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] send threw", error);
    return false;
  }
}

/* ── Shared shell: paper background, ink borders, zero radius ───────────── */

function shell(body: string, preheader = ""): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>FreshPools</title></head>
<body style="margin:0;padding:0;background:#F2F0EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111111;">
<span style="display:none;font-size:1px;color:#F2F0EB;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F0EB;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #111111;">
<tr><td style="padding:20px 28px;border-bottom:1px solid #111111;">
<span style="font-size:18px;font-weight:700;letter-spacing:-0.03em;">Fresh<span style="font-weight:400;font-style:italic;">Pools</span></span>
</td></tr>
<tr><td style="padding:28px;">${body}</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #111111;background:#F2F0EB;">
<p style="margin:0;font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#5C5A55;">
FreshPools never charges students for placement
</p>
</td></tr>
</table>
</td></tr></table></body></html>`;
}

const h1 = (text: string) =>
  `<h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;letter-spacing:-0.02em;">${text}</h1>`;
const p = (text: string) =>
  `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#5C5A55;">${text}</p>`;
const mono = (text: string) =>
  `<p style="margin:0 0 8px;font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#111111;">${text}</p>`;
const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#111111;color:#FFFFFF;padding:14px 24px;font-size:15px;font-weight:500;text-decoration:none;border-radius:0;">${label} →</a>`;
const block = (bg: string, inner: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #111111;background:${bg};margin:0 0 20px;"><tr><td style="padding:18px 20px;">${inner}</td></tr></table>`;
const row = (label: string, value: string) =>
  `<tr><td style="padding:9px 0;border-bottom:1px solid #111111;font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#5C5A55;">${label}</td><td style="padding:9px 0;border-bottom:1px solid #111111;text-align:right;font-size:14px;font-weight:500;">${value}</td></tr>`;

/* ── Transactional templates ─────────────────────────────────────────────── */

export function sendOtpEmail(to: string, code: string, ttlMinutes: number) {
  return send({
    to,
    subject: `${code} is your FreshPools sign-in code`,
    html: shell(
      `${h1("Your sign-in code")}
       ${p(`Enter this code to finish signing in. It expires in ${ttlMinutes} minutes.`)}
       ${block(
         "#FAE243",
         `<p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:34px;letter-spacing:0.3em;font-weight:700;text-align:center;">${code}</p>`,
       )}
       ${p("If you did not request this, you can ignore this email — nothing happens without the code.")}`,
      `Your FreshPools code is ${code}`,
    ),
  });
}

export function sendRegistrationReceipt(args: {
  to: string;
  name: string;
  eventTitle: string;
  eventSlug: string;
  amountPaid: number;
  depositAmount: number;
  waived: boolean;
  sponsorName?: string | null;
}) {
  const feeRows = args.waived
    ? row("Entry", `Free${args.sponsorName ? ` · sponsored by ${args.sponsorName}` : ""}`)
    : `${row("Paid", formatPaise(args.amountPaid))}${row("Refundable on check-in", formatPaise(args.depositAmount))}`;

  return send({
    to: args.to,
    subject: `You're registered — ${args.eventTitle}`,
    html: shell(
      `${h1("You're in.")}
       ${p(`${args.name}, your place at <strong style="color:#111111;">${args.eventTitle}</strong> is confirmed.`)}
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;border-top:1px solid #111111;">
         ${row("Event", args.eventTitle)}
         ${feeRows}
       </table>
       ${
         args.waived
           ? ""
           : block(
               "#BDD7F5",
               `${mono("Refund policy")}<p style="margin:0;font-size:14px;line-height:1.6;">${formatPaise(args.depositAmount)} of your entry fee comes back to you once an organiser verifies your check-in at the event. Refunds land in 5–7 working days on the original payment method.</p>`,
             )
       }
       ${p("Next step: form your team, or share your join code with the people you want on it.")}
       ${button(`${APP_URL}/me/hackathons`, "Open my dashboard")}
       <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#5C5A55;">FreshPools never charges students for placement or shortlisting. Your entry fee covers event logistics only — companies pay us when they hire.</p>`,
      `Your place at ${args.eventTitle} is confirmed`,
    ),
  });
}

export function sendRefundProcessed(args: {
  to: string;
  name: string;
  eventTitle: string;
  amount: number;
}) {
  return send({
    to: args.to,
    subject: `Deposit refunded — ${args.eventTitle}`,
    html: shell(
      `${h1("Your deposit is on its way back.")}
       ${p(`${args.name}, we verified your check-in at <strong style="color:#111111;">${args.eventTitle}</strong> and have refunded your deposit.`)}
       ${block(
         "#FAE243",
         `${mono("Refunded")}<p style="margin:0;font-size:28px;font-weight:700;">${formatPaise(args.amount)}</p>`,
       )}
       ${p("It goes back to the method you paid with, usually within 5–7 working days.")}`,
      `${formatPaise(args.amount)} refunded`,
    ),
  });
}

export function sendRequirementReceived(args: {
  to: string;
  contactName: string;
  companyName: string;
  role: string;
}) {
  return send({
    to: args.to,
    subject: "We've got your requirement — FreshPools",
    html: shell(
      `${h1("Requirement received.")}
       ${p(`${args.contactName}, thanks for the brief for <strong style="color:#111111;">${args.role}</strong> at ${args.companyName}.`)}
       ${block(
         "#BDD7F5",
         `${mono("What happens next")}<p style="margin:0;font-size:14px;line-height:1.6;">We'll send you matched profiles within 7 days. Each one comes with a demo video, a public repository, and our written code-review note.</p>`,
       )}
       ${p("You pay nothing until a hire clears 90 days with you.")}`,
      "We'll send matched profiles within 7 days",
    ),
  });
}

/** Internal alert so a new lead is never sitting unseen in a table. */
export function sendInternalLead(subject: string, lines: [string, string][]) {
  const body = lines.map(([label, value]) => row(label, value)).join("");
  return send({
    to: NOTIFY,
    subject,
    html: shell(
      `${h1(subject)}
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #111111;">${body}</table>`,
    ),
  });
}

export function sendIntroNotice(args: {
  to: string;
  candidateName: string;
  companyName: string;
  role: string;
}) {
  return send({
    to: args.to,
    subject: `A company wants to talk to you — ${args.companyName}`,
    html: shell(
      `${h1("You've been introduced.")}
       ${p(`${args.candidateName}, we introduced your verified profile to <strong style="color:#111111;">${args.companyName}</strong> for a ${args.role} role.`)}
       ${p("They saw your demo video, your repository and our review note. They did not see your contact details — we pass those on only when you say yes.")}
       ${button(`${APP_URL}/me/opportunities`, "Review this introduction")}`,
      `${args.companyName} wants to talk to you`,
    ),
  });
}

export const emailConfigured = Boolean(apiKey);
