import { db } from "@/lib/db";
import { serviceOrders } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";

// Next.js passes URL parameters into the page component via searchParams
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { reference?: string };
}) {
  const referenceId = searchParams.reference;

  // 1. If there is no reference in the URL, send them away
  if (!referenceId) {
    redirect("/"); 
  }

  // 2. Look up the order in your database using ONLY the secure reference ID
  // This bypasses the need for the browser's session cookie right at this moment
  const [order] = await db
    .select()
    .from(serviceOrders)
    .where(eq(serviceOrders.referenceId, referenceId));

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-red-600">Order Not Found</h1>
        <p>We could not locate this transaction.</p>
      </div>
    );
  }

  // 3. (Optional but recommended) Update the order status to "paid" here 
  // NOTE: In a production app, a backend Webhook from OnePay should handle this,
  // but doing it here is fine for testing!
  if (order.status === "pending") {
    await db
      .update(serviceOrders)
      .set({ status: "paid" })
      .where(eq(serviceOrders.referenceId, referenceId));
  }

  // 4. Render the Success UI!
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
          Your order has been processed. The freelancer will begin working on your project shortly.
        </p>
        <Link 
          href="/dashboard" 
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}