import { db } from "@/lib/db";
import { serviceOrders, users, freelancerServices } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }> | { orderId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const resolvedParams = await params;
  const { orderId } = resolvedParams;

  const [order] = await db
    .select({
      id: serviceOrders.id,
      referenceId: serviceOrders.referenceId,
      price: serviceOrders.price,
      status: serviceOrders.status,
      tier: serviceOrders.tier,
      createdAt: serviceOrders.createdAt,
      buyerName: users.name,
      buyerEmail: users.email,
      buyerImage: users.image,
      serviceTitle: freelancerServices.title,
    })
    .from(serviceOrders)
    .where(
      and(
        eq(serviceOrders.id, orderId),
        eq(serviceOrders.freelancerId, session.user.id)
      )
    )
    .leftJoin(users, eq(serviceOrders.buyerId, users.id))
    .leftJoin(freelancerServices, eq(serviceOrders.serviceId, freelancerServices.id));

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Order Not Found</h1>
        <p className="text-gray-500 mt-2">This order does not exist or you do not have permission to view it.</p>
        {/* FIXED: Return to the freelancer orders list */}
        <Link href="/freelancer/orders" className="text-blue-600 hover:underline mt-4 inline-block">Return to Orders</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 font-sans">
      
      <div className="mb-8">
        {/* FIXED: Return to the freelancer orders list */}
        <Link href="/freelancer/orders" className="text-sm text-gray-500 hover:text-gray-900 flex items-center mb-6 transition">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Orders
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order #{order.referenceId?.substring(0, 8).toUpperCase() || "PENDING"}</h1>
            <p className="text-gray-500 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-3">
             <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${
                order.status === "paid" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"
              }`}>
                {order.status.toUpperCase()}
              </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Service Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Service Purchased</p>
                <p className="font-medium text-gray-900 text-lg">{order.serviceTitle || "Custom Service"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Package Tier</p>
                  <p className="font-semibold text-gray-900 capitalize">{order.tier}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm text-blue-600 mb-1">Total Earnings</p>
                  <p className="font-bold text-blue-900 text-xl">${parseFloat(order.price).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Buyer Information</h2>
            
            <div className="flex items-center gap-4 mb-6">
              {order.buyerImage ? (
                <img src={order.buyerImage} alt="Buyer" className="w-12 h-12 rounded-full border border-gray-200" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                  {order.buyerName?.charAt(0) || "U"}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{order.buyerName || "Guest User"}</p>
                <p className="text-sm text-gray-500">Client</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Address</p>
                <a href={`mailto:${order.buyerEmail}`} className="text-sm text-blue-600 hover:underline break-all">
                  {order.buyerEmail || "Not provided"}
                </a>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone Number</p>
                <p className="text-sm text-gray-900">Contact via Email</p>
              </div>
            </div>
            
            <a 
              href={`mailto:${order.buyerEmail}`}
              className="mt-6 w-full flex justify-center items-center bg-gray-900 text-white font-semibold py-2.5 rounded-xl hover:bg-gray-800 transition"
            >
              Message Buyer
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}