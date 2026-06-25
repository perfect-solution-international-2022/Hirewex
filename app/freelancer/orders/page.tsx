import { db } from "@/lib/db";
import { serviceOrders, users, freelancerServices, projectSubmissions } from "@/drizzle/schema";
import { eq, desc, and, sum, isNotNull } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { OrdersClient } from "./OrdersClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Orders — Hirewex",
};

export default async function FreelancerOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const [orders, [released]] = await Promise.all([
    db
      .select({
        id: serviceOrders.id,
        referenceId: serviceOrders.referenceId,
        price: serviceOrders.price,
        status: serviceOrders.status,
        tier: serviceOrders.tier,
        createdAt: serviceOrders.createdAt,
        buyerName: users.name,
        buyerDisplayName: users.displayName,
        buyerImage: users.image,
        buyerAvatarUrl: users.avatarUrl,
        serviceTitle: freelancerServices.title,
        serviceImages: freelancerServices.images,
      })
      .from(serviceOrders)
      .where(and(
        eq(serviceOrders.freelancerId, session.user.id),
        eq(serviceOrders.status, "paid")
      ))
      .leftJoin(users, eq(serviceOrders.buyerId, users.id))
      .leftJoin(freelancerServices, eq(serviceOrders.serviceId, freelancerServices.id))
      .orderBy(desc(serviceOrders.createdAt)),

    // Total actually paid out by admin for this freelancer's orders
    db
      .select({ total: sum(projectSubmissions.releasedAmount) })
      .from(projectSubmissions)
      .where(and(
        eq(projectSubmissions.freelancerId, session.user.id),
        eq(projectSubmissions.type, "order"),
        isNotNull(projectSubmissions.paymentReleasedAt),
      )),
  ]);

  // Money held = sum of all active order prices (buyer paid, admin hasn't released)
  const heldAmount = orders.reduce((s, o) => s + Number(o.price), 0);
  const earnedAmount = Number(released?.total ?? 0);

  return (
    <DashboardShell title="My Orders" role="freelancer">
      <div className="mx-auto w-full max-w-6xl">
        <OrdersClient initialOrders={orders} heldAmount={heldAmount} earnedAmount={earnedAmount} />
      </div>
    </DashboardShell>
  );
}
