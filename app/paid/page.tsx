import { db } from "@/lib/db";
import { serviceOrders, freelancerServices } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PaidServicesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  // Fetch only paid orders for this buyer, joining with service details
  const myOrders = await db
    .select({
      order: serviceOrders,
      service: freelancerServices,
    })
    .from(serviceOrders)
    .innerJoin(freelancerServices, eq(serviceOrders.serviceId, freelancerServices.id))
    .where(and(
      eq(serviceOrders.buyerId, session.user.id),
      eq(serviceOrders.status, "paid")
    ))
    .orderBy(desc(serviceOrders.createdAt));

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <SiteHeader />
      <main className="container mx-auto flex-1 px-4 py-12 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">Purchased Services</h1>

        {myOrders.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-background rounded-lg border">
            You haven't purchased any services yet.
          </div>
        ) : (
          <div className="space-y-4">
            {myOrders.map(({ order, service }) => (
              <Card key={order.id} className="border-border">
                <CardContent className="p-6 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground mb-2">Order ID: {order.id}</div>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <div className="flex gap-2 text-sm text-muted-foreground mt-2">
                      <Badge variant="secondary" className="capitalize">{order.tier} Tier</Badge>
                      <span>•</span>
                      <span>Purchased: {new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-xl">${order.price}</div>
                    <Badge className="mt-2 bg-green-500 hover:bg-green-600">Paid</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}