"use server";

import { db } from "@/lib/db";
import { serviceOrders } from "@/drizzle/schema";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import crypto from "crypto";

export async function createOnePayCheckout(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const serviceId = formData.get("serviceId") as string;
  const freelancerId = formData.get("freelancerId") as string;
  const tier = formData.get("tier") as string;
  
  const rawAmount = parseFloat(formData.get("total") as string);
  const currency = "USD"; 

  const appId = process.env.ONEPAY_APP_ID?.trim();
  const hashSalt = process.env.ONEPAY_HASH_SALT?.trim();
  
  // 1. Pull the new API Sandbox URL from your .env
  const onepayApiBaseUrl = process.env.ONEPAY_API_URL?.trim() || "https://api.onepay.lk";

  if (!appId || !hashSalt) {
    throw new Error("CRITICAL: OnePay APP_ID or HASH_SALT missing from .env");
  }

  const referenceId = crypto.randomUUID().replace(/-/g, "");

  // 2. Hash amount strictly formatted to 2 decimal places ("15.00")
  const amountHashString = rawAmount.toFixed(2); 

  const hashString = `${appId}${currency}${amountHashString}${hashSalt}`;
  const hash = crypto.createHash('sha256').update(hashString).digest('hex');

  await db.insert(serviceOrders).values({
    buyerId: session.user.id,
    freelancerId: freelancerId,
    serviceId: serviceId,
    tier: tier,
    price: amountHashString,
    status: "pending",
    referenceId: referenceId,
  });

  let baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hirewex.vercel.app";
  if (baseUrl.includes("localhost")) {
    baseUrl = "https://hirewex.vercel.app"; 
  }

  // 3. Fire the request to https://api-sandbox.onepay.lk
  const response = await fetch(`${onepayApiBaseUrl}/v3/checkout/link/`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      app_id: appId,
      reference: referenceId,
      currency: currency,
      amount: rawAmount, // JSON payload uses the raw float (15)
      customer_first_name: session.user.name?.split(" ")[0] || "Buyer",
      customer_last_name: session.user.name?.split(" ")[1] || "Name",
      customer_phone_number: "+94771234567",
      customer_email: session.user.email || "buyer@hirewex.com",
      transaction_redirect_url: `${baseUrl}/checkout/success?reference=${referenceId}`,
      hash: hash
    }),
  });

  const data = await response.json();

  if (data?.data?.redirect_url) {
    redirect(data.data.redirect_url);
  } else {
    console.error(`OnePay API (${onepayApiBaseUrl}) Rejected the Request:`, data);
    const errorDetails = data?.errors 
      ? JSON.stringify(data.errors) 
      : (data?.message || JSON.stringify(data));
      
    throw new Error(`OnePay Validation Failed: ${errorDetails}`);
  }
}