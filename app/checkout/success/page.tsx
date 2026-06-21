import { db } from "@/lib/db";
import { serviceOrders } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  // Support for both Next.js 14 and Next.js 15 Promises
  searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined };
}) {
  // 1. Wait for the params to resolve (Fixes the Next.js 15 bug)
  const params = await searchParams;
  const referenceId = params.reference;

  // 2. Instead of redirecting to the homepage, let's catch the missing ID and print the data!
  if (!referenceId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md max-w-lg w-full">
          <h1 className="text-xl font-bold text-red-600 mb-2">Debug Mode: Reference Missing</h1>
          <p className="text-gray-700 mb-4">We didn't receive the "reference" parameter. Here is what OnePay actually sent back in the URL:</p>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto text-left">
            {JSON.stringify(params, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  // 3. Normal Database Lookup
  const [order] = await db
    .select()
    .from(serviceOrders)
    .where(eq(serviceOrders.referenceId, referenceId));

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-red-600">Order Not Found</h1>
        <p>We could not locate this transaction in our database.</p>
      </div>
    );
  }

  // 4. Mark as Paid!
  if (order.status === "pending") {
    await db
      .update(serviceOrders)
      .set({ status: "paid" })
      .where(eq(serviceOrders.referenceId, referenceId));
  }

  // 5. Success Screen
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your order has been processed successfully.
        </p>
        {/* Using standard <a> tag to force a full page reload and restore cookies */}
        <a 
          href="/dashboard" 
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition inline-block"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}