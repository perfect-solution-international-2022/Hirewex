import { db } from "@/lib/db";
import { serviceOrders, freelancerServices } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { notifications } from "@/drizzle/schema";
import Pusher from "pusher";
import Link from "next/link";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }> | { [key: string]: string | undefined };
}) {
  const params = await searchParams;
  const referenceId = params.reference;

  if (!referenceId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="p-8 bg-white rounded-2xl shadow-xl max-w-lg w-full border border-red-100">
          <h1 className="text-xl font-bold text-red-600 mb-2 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Debug Mode: Reference Missing
          </h1>
          <p className="text-gray-600 mb-4 text-sm">We didn't receive the "reference" parameter. Here is what OnePay actually sent back:</p>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs overflow-auto text-left shadow-inner">
            {JSON.stringify(params, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  const [order] = await db
    .select()
    .from(serviceOrders)
    .where(eq(serviceOrders.referenceId, referenceId));

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900">Order Not Found</h1>
        <p className="text-gray-500 mt-2">We could not locate this transaction in our database.</p>
      </div>
    );
  }

  // Only fire the notification the FIRST time this order transitions to paid
  if (order.status === "pending") {
    await db
      .update(serviceOrders)
      .set({ status: "paid" })
      .where(eq(serviceOrders.referenceId, referenceId));

    // Fetch service title for a friendlier notification message
    let serviceTitle = "your service";
    try {
      const [service] = await db
        .select({ title: freelancerServices.title })
        .from(freelancerServices)
        .where(eq(freelancerServices.id, order.serviceId));
      if (service?.title) serviceTitle = service.title;
    } catch (err) {
      console.warn("Could not fetch service title for notification:", err);
    }

    // Notify the freelancer of the new paid order
    if (order.freelancerId) {
      const notificationId = crypto.randomUUID();
      try {
        await db.insert(notifications).values({
          id: notificationId,
          userId: order.freelancerId,
          title: "New order received! 🎉",
          body: `You received a new order for "${serviceTitle}" — $${parseFloat(order.price).toFixed(2)}.`,
          link: `/freelancer/orders/${order.id}`,
          read: 0,
        });

        await pusher.trigger(`user-${order.freelancerId}`, "notification", {
          id: notificationId,
          title: "New order received! 🎉",
          body: `You received a new order for "${serviceTitle}" — $${parseFloat(order.price).toFixed(2)}.`,
          link: `/freelancer/orders/${order.id}`,
        });
      } catch (err) {
        console.warn("Failed to notify freelancer of new order (non-fatal):", err);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden text-center border border-gray-100">
        
        {/* Top Celebration Banner */}
        <div className="bg-green-500 pt-10 pb-12 relative flex justify-center">
          <div className="absolute inset-0 bg-green-600 opacity-20 pattern-diagonal-lines"></div>
          <div className="bg-white rounded-full p-4 shadow-lg transform translate-y-8 relative z-10">
            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-8 pt-12 pb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Payment Successful!</h1>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            Your transaction has been securely processed. The freelancer has been notified to begin working on your project.
          </p>

          {/* Receipt Details Box */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left border border-gray-100 shadow-inner">
             <div className="flex justify-between items-center mb-3">
               <span className="text-gray-500 text-sm font-medium">Amount Paid</span>
               <span className="text-gray-900 text-lg font-bold">${parseFloat(order.price).toFixed(2)}</span>
             </div>
             <div className="border-t border-gray-200 my-3"></div>
             <div className="flex justify-between items-center mb-3">
               <span className="text-gray-500 text-sm font-medium">Reference ID</span>
               <span className="text-gray-700 text-sm font-mono bg-gray-200 px-2 py-1 rounded-md">
                 {referenceId.substring(0, 8).toUpperCase()}...
               </span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-gray-500 text-sm font-medium">Status</span>
               <span className="inline-flex items-center text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                 <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1.5"></span>
                 Paid
               </span>
             </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
             <a 
               href="/dashboard" 
               className="w-full flex justify-center items-center bg-gray-900 text-white font-semibold py-3.5 rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
             >
               Go to Dashboard
               <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
               </svg>
             </a>
             {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
             <a 
               href="/" 
               className="w-full flex justify-center items-center bg-white text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-50 border border-gray-200 transition-all duration-200 active:scale-[0.98]"
             >
               Return Home
             </a>
          </div>
        </div>
      </div>
    </div>
  );
}
