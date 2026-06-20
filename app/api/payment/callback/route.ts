import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. Get the data sent by the payment gateway
    const body = await request.json();

    // 2. Security Check: Verify the token
    // The payment gateway will usually send your secret token in the headers or the body.
    // Adjust this depending on how your specific gateway sends it!
    const incomingToken = body.token || request.headers.get("x-callback-token");
    
    if (incomingToken !== process.env.PAYMENT_CALLBACK_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Process the payment update
    // e.g., Update your Aiven database to mark the order as "PAID"
    console.log("Payment successful for order:", body.orderId);

    // 4. Tell the payment gateway you received the message successfully
    return NextResponse.json({ success: true, message: "Callback received" }, { status: 200 });

  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}