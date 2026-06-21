import { db } from "@/lib/db";
import { serviceOrders, users, freelancerServices } from "@/drizzle/schema"; 
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function FreelancerOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const orders = await db
    .select({
      id: serviceOrders.id,
      referenceId: serviceOrders.referenceId,
      price: serviceOrders.price,
      status: serviceOrders.status,
      tier: serviceOrders.tier,
      createdAt: serviceOrders.createdAt,
      buyerName: users.name,
      serviceTitle: freelancerServices.title,
    })
    .from(serviceOrders)
    .where(eq(serviceOrders.freelancerId, session.user.id))
    .leftJoin(users, eq(serviceOrders.buyerId, users.id))
    .leftJoin(freelancerServices, eq(serviceOrders.serviceId, freelancerServices.id))
    .orderBy(desc(serviceOrders.createdAt));

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 font-sans">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Orders</h1>
          <p className="text-gray-500 mt-2">Manage your incoming freelance projects.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500">You don't have any orders yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                  <th className="p-4 font-medium">Order ID</th>
                  <th className="p-4 font-medium">Service</th>
                  <th className="p-4 font-medium">Buyer</th>
                  <th className="p-4 font-medium">Price</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-gray-500">
                      #{order.referenceId?.substring(0, 8).toUpperCase() || "PENDING"}
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                      {order.serviceTitle || "Custom Service"}
                      <span className="block text-xs text-gray-400 capitalize mt-0.5">{order.tier} Tier</span>
                    </td>
                    <td className="p-4 text-gray-600">{order.buyerName || "Guest User"}</td>
                    <td className="p-4 font-semibold text-gray-900">${parseFloat(order.price).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {/* FIXED: Now routes correctly to the freelancer folder */}
                      <Link 
                        href={`/freelancer/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm transition"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}