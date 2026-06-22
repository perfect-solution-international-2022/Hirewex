"use server";

import { Resend } from "resend";

// Initialize Resend with your environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSupportEmail(formData: FormData) {
  // Extract the data from the form
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const orderId = formData.get("orderId") as string;
  const message = formData.get("message") as string;

  try {
    // 1. We changed this line to capture the 'data' and 'error' that Resend sends back
    const { data, error } = await resend.emails.send({
      from: "Support Form <onboarding@resend.dev>", 
      to: ["psint97@gmail.com"], 
      subject: `Hirewex - New Support Request from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Order ID: ${orderId || "None provided"}
        
        Message:
        ${message}
      `,
    });

    // 2. If Resend blocked the email, log the exact reason to the terminal
    if (error) {
      console.error("Resend API rejected the email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Server crashed while sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}