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
  const totalAmount = parseFloat(formData.get("total") as string).toFixed(2); // Must be 2 decimals
  const currency = "USD"; // You requested USD

  // 1. Generate a unique reference ID for this order
  const referenceId = crypto.randomUUID();

  const appId = process.env.ONEPAY_APP_ID as string;
  const hashSalt = process.env.ONEPAY_HASH_SALT as string;

  // 2. Generate the OnePay SHA-256 Security Hash
  const hashString = `${appId}${currency}${totalAmount}${hashSalt}`;
  const hash = crypto.createHash('sha256').update(hashString).digest('hex');

  // 3. Save pending order to Database FIRST
  await db.insert(serviceOrders).values({
    buyerId: session.user.id,
    freelancerId: freelancerId,
    serviceId: serviceId,
    tier: tier,
    price: totalAmount,
    status: "pending",
    referenceId: referenceId,
  });

  // 4. Request Payment Link from OnePay API
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  const response = await fetch("https://api.onepay.lk/v3/checkout/link/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: appId,
      amount: parseFloat(totalAmount),
      currency: currency,
      hash: hash,
      reference: referenceId,
      customer_first_name: session.user.name?.split(" ")[0] || "Buyer",
      customer_last_name: session.user.name?.split(" ")[1] || "Name",
      customer_phone_number: "+94770000000", // Fallback if user phone is null
      customer_email: session.user.email,
      transaction_redirect_url: `${baseUrl}/checkout/success?reference=${referenceId}`,
    }),
  });

  const data = await response.json();

  if (data?.data?.redirect_url) {
    // 5. Send user to OnePay's hosted payment page
    redirect(data.data.redirect_url);
  } else {
    console.error("OnePay Error:", data);
    throw new Error("Failed to create OnePay session");
  }
}