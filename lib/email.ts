import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hirewex.vercel.app";

export async function getUserEmail(userId: string): Promise<{ email: string; name: string } | null> {
  try {
    const [user] = await db
      .select({ email: users.email, name: users.name })
      .from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return null;
    return { email: user.email, name: user.name || "there" };
  } catch { return null; }
}

async function send(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: `"Hirewex" <${process.env.GMAIL_USER}>`,
      to, subject, html,
    });
  } catch (err) {
    console.warn(`[email] failed "${subject}" → ${to}:`, err);
  }
}

// ─── Template helpers ──────────────────────────────────────────────────────────

function tpl(title: string, body: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;"><tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
<tr><td style="background:#000;padding:22px 32px;"><span style="color:#22c55e;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Hirewex</span></td></tr>
<tr><td style="padding:36px 32px;">
<h1 style="margin:0 0 16px;font-size:21px;font-weight:700;color:#111827;">${title}</h1>
${body}
</td></tr>
<tr><td style="padding:18px 32px;border-top:1px solid #f3f4f6;">
<p style="margin:0;font-size:12px;color:#d1d5db;">© ${new Date().getFullYear()} Hirewex &middot; Automated — please do not reply.</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function rows(...pairs: [string, string][]): string {
  const cells = pairs.map(([label, val]) =>
    `<tr><td style="padding:7px 0;border-bottom:1px solid #f3f4f6;">
      <span style="color:#9ca3af;font-size:12px;">${label}</span><br>
      <strong style="color:#111827;font-size:15px;">${val}</strong>
    </td></tr>`
  ).join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:14px 18px;margin:18px 0;">${cells}</table>`;
}

function alert(text: string, color: "amber" | "red" | "green") {
  const map = {
    amber: ["#fef3c7", "#fde68a", "#92400e", "#a16207"],
    red:   ["#fee2e2", "#fecaca", "#991b1b", "#b91c1c"],
    green: ["#f0fdf4", "#bbf7d0", "#166534", "#15803d"],
  };
  const [bg, border, title, body] = map[color];
  return `<div style="background:${bg};border:1px solid ${border};border-radius:12px;padding:14px 18px;margin:18px 0;">${text.split("\n").map((line, i) => i === 0
    ? `<p style="margin:0;font-weight:600;color:${title};font-size:14px;">${line}</p>`
    : `<p style="margin:5px 0 0;font-size:13px;color:${body};">${line}</p>`).join("")}</div>`;
}

function cta(label: string, path: string) {
  return `<a href="${APP_URL}${path}" style="display:inline-block;margin-top:20px;background:#111827;color:#fff;padding:11px 22px;border-radius:9px;text-decoration:none;font-weight:600;font-size:14px;">${label} →</a>`;
}

function para(text: string) {
  return `<p style="color:#6b7280;line-height:1.65;margin:0 0 8px;font-size:14px;">${text}</p>`;
}

// ── Verification PIN ───────────────────────────────────────────────────────────

export async function sendVerificationPin(to: string, name: string, pin: string) {
  await send(to, `${pin} is your Hirewex verification code`, tpl(
    "Verify your email",
    `${para(`Hi ${name}, enter the code below to confirm your email and activate your account.`)}
    <div style="background:#f3f4f6;border-radius:12px;padding:32px;text-align:center;margin:20px 0;">
      <span style="font-size:52px;font-weight:800;letter-spacing:14px;color:#111827;font-variant-numeric:tabular-nums;">${pin}</span>
      <p style="margin:14px 0 0;font-size:13px;color:#9ca3af;">Expires in <strong>15 minutes</strong></p>
    </div>
    <p style="margin:0;font-size:13px;color:#9ca3af;">If you didn't create a Hirewex account, ignore this email.</p>`
  ));
}

// ── Freelancer ─────────────────────────────────────────────────────────────────

export async function emailFreelancerBidAccepted(
  to: string, name: string, jobTitle: string, amount: string, deliveryDays: number
) {
  await send(to, `You got hired for "${jobTitle}"!`, tpl(
    "You got hired! 🎉",
    `${para(`Hi ${name}, your bid on <strong style="color:#111">"${jobTitle}"</strong> was accepted and payment is now held in escrow.`)}
    ${rows(["Amount (in escrow)", `$${amount}`], ["Delivery deadline", `${deliveryDays} day${deliveryDays !== 1 ? "s" : ""}`])}
    ${para("Log in and start working — your client is waiting.")}
    ${cta("View Project", "/freelancer/hired")}`
  ));
}

export async function emailFreelancerNewOrder(
  to: string, name: string, serviceTitle: string, price: string, tier: string
) {
  await send(to, `New order: "${serviceTitle}"`, tpl(
    "New order received!",
    `${para(`Hi ${name}, someone just purchased your service <strong style="color:#111">"${serviceTitle}"</strong>.`)}
    ${rows(["Service", serviceTitle], ["Tier", tier.charAt(0).toUpperCase() + tier.slice(1)], ["Amount", `$${parseFloat(price).toFixed(2)}`])}
    ${para("Head to your orders to see the details and get started.")}
    ${cta("View Orders", "/freelancer/orders")}`
  ));
}

export async function emailFreelancerPaymentReleased(
  to: string, name: string, contextTitle: string, netAmount: number
) {
  await send(to, `Payment released: $${netAmount.toFixed(2)} for "${contextTitle}"`, tpl(
    "Payment released! 💰",
    `${para(`Hi ${name}, your payment for <strong style="color:#111">"${contextTitle}"</strong> has been released to your wallet.`)}
    ${rows(["Amount added to balance", `$${netAmount.toFixed(2)}`])}
    ${cta("View Transactions", "/freelancer/transactions")}`
  ));
}

export async function emailFreelancerSubmissionRejected(
  to: string, name: string, contextTitle: string, buyerNote?: string | null
) {
  await send(to, `Work rejected: "${contextTitle}"`, tpl(
    "Submission rejected",
    `${para(`Hi ${name}, the buyer rejected your submission for <strong style="color:#111">"${contextTitle}"</strong>. A refund request has been raised for admin review.`)}
    ${buyerNote ? alert(`Buyer's reason:\n${buyerNote}`, "amber") : ""}
    ${para("Admin will review and make a final decision. You will be notified by email.")}
    ${cta("View Project", "/freelancer/hired")}`
  ));
}

export async function emailFreelancerRefundApproved(
  to: string, name: string, contextTitle: string, refundAmount: string, adminNote?: string | null
) {
  await send(to, `Refund approved for "${contextTitle}"`, tpl(
    "Refund approved",
    `${para(`Hi ${name}, admin approved a refund of <strong style="color:#111">$${Number(refundAmount).toFixed(2)}</strong> to the buyer for <strong style="color:#111">"${contextTitle}"</strong>.`)}
    ${adminNote ? alert(`Admin note:\n${adminNote}`, "amber") : ""}
    ${para("Please ensure timely delivery on future orders to avoid disputes.")}`
  ));
}

export async function emailFreelancerRefundRejected(
  to: string, name: string, contextTitle: string, adminNote: string
) {
  await send(to, `Refund request rejected for "${contextTitle}"`, tpl(
    "Refund request rejected",
    `${para(`Hi ${name}, admin reviewed and rejected the refund request for <strong style="color:#111">"${contextTitle}"</strong>. Payment will be released to you.`)}
    ${alert(`Admin note:\n${adminNote}`, "green")}
    ${cta("View Project", "/freelancer/hired")}`
  ));
}

export async function emailFreelancerDeadlineWarning(
  to: string, name: string, contextTitle: string, daysLeft: number, link: string
) {
  await send(to, `Deadline in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}: "${contextTitle}"`, tpl(
    `Deadline approaching ⏰`,
    `${para(`Hi ${name}, your delivery deadline for <strong style="color:#111">"${contextTitle}"</strong> is approaching.`)}
    ${alert(`⏰ ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left to submit your work\nIf you fail to deliver before the grace period ends, a refund will be automatically flagged for admin review.`, "amber")}
    ${cta("Submit Work Now", link)}`
  ));
}

// ── Buyer ──────────────────────────────────────────────────────────────────────

export async function emailBuyerNewBid(
  to: string, name: string, jobTitle: string, freelancerName: string, amount: string, deliveryDays: number
) {
  await send(to, `New proposal on "${jobTitle}"`, tpl(
    "You have a new proposal",
    `${para(`Hi ${name}, <strong style="color:#111">${freelancerName}</strong> submitted a proposal on your job <strong style="color:#111">"${jobTitle}"</strong>.`)}
    ${rows(["Freelancer", freelancerName], ["Bid amount", `$${amount}`], ["Delivery", `${deliveryDays} day${deliveryDays !== 1 ? "s" : ""}`])}
    ${cta("Review Proposals", "/my-bids")}`
  ));
}

export async function emailBuyerWorkSubmitted(
  to: string, name: string, contextTitle: string, freelancerName: string
) {
  await send(to, `Work submitted: "${contextTitle}"`, tpl(
    "Work is ready for review",
    `${para(`Hi ${name}, <strong style="color:#111">${freelancerName}</strong> submitted their work for <strong style="color:#111">"${contextTitle}"</strong>.`)}
    ${alert(`You have 3 days to approve, reject, or request revisions.\nIf you don't respond, the work will be automatically approved and payment released to the freelancer.`, "green")}
    ${cta("Review Submission", "/submitted-work")}`
  ));
}

export async function emailBuyerApprovalWindowClosing(
  to: string, name: string, contextTitle: string
) {
  await send(to, `Action needed: "${contextTitle}" auto-approves in 24 hours`, tpl(
    "Review window closing soon ⚠️",
    `${para(`Hi ${name}, you have less than 24 hours to review the submission for <strong style="color:#111">"${contextTitle}"</strong>.`)}
    ${alert(`⏰ Auto-approval in less than 24 hours\nIf you don't approve, reject, or request a revision, the submission will be automatically approved and payment released.`, "amber")}
    ${cta("Review Now", "/submitted-work")}`
  ));
}

export async function emailBuyerRefundApproved(
  to: string, name: string, contextTitle: string, refundAmount: string, feeAmount: string
) {
  await send(to, `Refund approved for "${contextTitle}"`, tpl(
    "Your refund has been approved ✅",
    `${para(`Hi ${name}, admin approved your refund for <strong style="color:#111">"${contextTitle}"</strong>.`)}
    ${rows(["Refund amount", `$${Number(refundAmount).toFixed(2)}`], ["Service fee (non-refundable)", `$${Number(feeAmount).toFixed(2)}`])}
    ${para("You will receive the refund via your original payment method.")}`
  ));
}

export async function emailBuyerRefundRejected(
  to: string, name: string, contextTitle: string, adminNote: string
) {
  await send(to, `Refund rejected for "${contextTitle}"`, tpl(
    "Refund request rejected",
    `${para(`Hi ${name}, admin reviewed and rejected your refund request for <strong style="color:#111">"${contextTitle}"</strong>.`)}
    ${alert(`Admin note:\n${adminNote}`, "red")}
    ${para("If you have concerns, please contact our support team.")}`
  ));
}

// ── Admin ──────────────────────────────────────────────────────────────────────

export async function emailAdminNewRefundRequest(opts: {
  type: "late_delivery" | "buyer_rejection";
  contextTitle: string;
  buyerName: string;
  freelancerName: string;
  refundAmount: string;
  reason: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;
  const typeLabel = opts.type === "late_delivery" ? "Late Delivery" : "Buyer Rejection";
  await send(adminEmail, `[Action needed] Refund request: ${typeLabel} — "${opts.contextTitle}"`, tpl(
    `New refund request — ${typeLabel}`,
    `${para("A new refund request requires your review.")}
    ${rows(["Type", typeLabel], ["Project / Order", opts.contextTitle], ["Buyer", opts.buyerName], ["Freelancer", opts.freelancerName], ["Refund amount", `$${Number(opts.refundAmount).toFixed(2)}`])}
    ${alert(`Reason:\n${opts.reason}`, "amber")}
    ${cta("Review in Admin", "/admin/refunds")}`
  ));
}

export async function emailAdminAutoApproved(opts: {
  contextTitle: string;
  freelancerName: string;
  amount: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;
  await send(adminEmail, `[Auto-approved] "${opts.contextTitle}" — release payment`, tpl(
    "Submission auto-approved",
    `${para("A submission was automatically approved because the buyer did not respond within 3 days.")}
    ${rows(["Project / Order", opts.contextTitle], ["Freelancer", opts.freelancerName], ["Amount to release", `$${Number(opts.amount).toFixed(2)}`])}
    ${para("Please release the payment to the freelancer.")}
    ${cta("Admin Payments", "/admin/payments")}`
  ));
}

export async function emailAdminLateDelivery(opts: {
  contextTitle: string;
  freelancerName: string;
  buyerName: string;
  refundAmount: string;
  deliveryDays: number;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;
  await send(adminEmail, `[Action needed] Late delivery flagged — "${opts.contextTitle}"`, tpl(
    "Late delivery flagged",
    `${para("A project or order was flagged for refund due to late delivery.")}
    ${rows(["Project / Order", opts.contextTitle], ["Freelancer", opts.freelancerName], ["Buyer", opts.buyerName], ["Agreed delivery", `${opts.deliveryDays} days`], ["Refund amount", `$${Number(opts.refundAmount).toFixed(2)}`])}
    ${cta("Review in Admin", "/admin/refunds")}`
  ));
}
