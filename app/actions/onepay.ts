"use server";

import { db } from "@/lib/db";
import { serviceOrders, bids, jobs, notifications } from "@/drizzle/schema";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import crypto from "crypto";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// ── Existing: service checkout ─────────────────────────────────────
export async function createOnePayCheckout(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const serviceId   = formData.get("serviceId") as string;
  const freelancerId = formData.get("freelancerId") as string;
  const tier        = formData.get("tier") as string;
  const rawAmount   = parseFloat(formData.get("total") as string);
  const currency    = "USD";

  const appId     = process.env.ONEPAY_APP_ID?.trim();
  const hashSalt  = process.env.ONEPAY_HASH_SALT?.trim();
  const appToken  = process.env.ONEPAY_APP_TOKEN?.trim();

  if (!appId || !hashSalt || !appToken) {
    throw new Error("CRITICAL: OnePay API keys missing from .env");
  }

  const referenceId      = crypto.randomUUID().replace(/-/g, "").substring(0, 20);
  const amountHashString = rawAmount.toFixed(2);
  const hash = crypto.createHash("sha256")
    .update(`${appId}${currency}${amountHashString}${hashSalt}`)
    .digest("hex");

  await db.insert(serviceOrders).values({
    buyerId:     session.user.id,
    freelancerId,
    serviceId,
    tier,
    price:       amountHashString,
    status:      "pending",
    referenceId,
  });

  let baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hirewex.vercel.app";
  if (baseUrl.includes("localhost")) baseUrl = "https://hirewex.vercel.app";

  const response = await fetch("https://api.onepay.lk/v3/checkout/link/", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Accept":        "application/json",
      "Authorization": appToken,
    },
    body: JSON.stringify({
      app_id:                    appId,
      reference:                 referenceId,
      currency,
      amount:                    rawAmount,
      customer_first_name:       session.user.name?.split(" ")[0] || "Buyer",
      customer_last_name:        session.user.name?.split(" ")[1] || "Name",
      customer_phone_number:     "+94771234567",
      customer_email:            session.user.email || "buyer@hirewex.com",
      transaction_redirect_url:  `${baseUrl}/checkout/success?reference=${referenceId}`,
      hash,
    }),
  });

  const data = await response.json();

  if (data?.data?.gateway?.redirect_url) redirect(data.data.gateway.redirect_url);
  else if (data?.data?.redirect_url)      redirect(data.data.redirect_url);
  else {
    const errorDetails = data?.errors
      ? JSON.stringify(data.errors)
      : (data?.message || JSON.stringify(data));
    throw new Error(`OnePay Validation Failed: ${errorDetails}`);
  }
}

// ── New: bid/hire checkout ─────────────────────────────────────────
export async function createBidPaymentCheckout(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const bidId       = formData.get("bidId") as string;
  const jobId       = formData.get("jobId") as string;
  const freelancerId = formData.get("freelancerId") as string;
  const rawAmount   = parseFloat(formData.get("total") as string);
  const currency    = "USD";

  const appId    = process.env.ONEPAY_APP_ID?.trim();
  const hashSalt = process.env.ONEPAY_HASH_SALT?.trim();
  const appToken = process.env.ONEPAY_APP_TOKEN?.trim();

  if (!appId || !hashSalt || !appToken) {
    throw new Error("CRITICAL: OnePay API keys missing from .env");
  }

  // referenceId encodes bidId so the success page knows which bid to accept
  // Format: "BID-{bidId truncated}" — 20 chars max
  const shortBidId  = bidId.replace(/-/g, "").substring(0, 14);
  const referenceId = `BID${shortBidId}`.substring(0, 20);

  const amountHashString = rawAmount.toFixed(2);
  const hash = crypto.createHash("sha256")
    .update(`${appId}${currency}${amountHashString}${hashSalt}`)
    .digest("hex");

  let baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hirewex.vercel.app";
  if (baseUrl.includes("localhost")) baseUrl = "https://hirewex.vercel.app";

  const response = await fetch("https://api.onepay.lk/v3/checkout/link/", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Accept":        "application/json",
      "Authorization": appToken,
    },
    body: JSON.stringify({
      app_id:                    appId,
      reference:                 referenceId,
      currency,
      amount:                    rawAmount,
      customer_first_name:       session.user.name?.split(" ")[0] || "Buyer",
      customer_last_name:        session.user.name?.split(" ")[1] || "Name",
      customer_phone_number:     "+94771234567",
      customer_email:            session.user.email || "buyer@hirewex.com",
      transaction_redirect_url:  `${baseUrl}/my-bids/success?reference=${referenceId}&bidId=${bidId}&jobId=${jobId}&freelancerId=${freelancerId}`,
      hash,
    }),
  });

  const data = await response.json();

  if (data?.data?.gateway?.redirect_url) redirect(data.data.gateway.redirect_url);
  else if (data?.data?.redirect_url)      redirect(data.data.redirect_url);
  else {
    const errorDetails = data?.errors
      ? JSON.stringify(data.errors)
      : (data?.message || JSON.stringify(data));
    throw new Error(`OnePay Validation Failed: ${errorDetails}`);
  }
}
