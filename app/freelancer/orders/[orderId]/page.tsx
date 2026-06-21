import { db } from "@/lib/db";
import { serviceOrders, users, freelancerServices } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft, Package, Tag, DollarSign, Calendar,
  Mail, MessageCircle, Hash, ImageIcon
} from "lucide-react";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  paid: {
    label: "Paid",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
};

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

export default async function FreelancerOrderDetailsPage({
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
      buyerId: serviceOrders.buyerId,
      buyerName: users.name,
      buyerDisplayName: users.displayName,
      buyerEmail: users.email,
      buyerImage: users.image,
      buyerAvatarUrl: users.avatarUrl,
      serviceTitle: freelancerServices.title,
      serviceCategory: freelancerServices.category,
      serviceImages: freelancerServices.images,
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

  if (!order) notFound();

  const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.pending;
  const buyerName = order.buyerDisplayName || order.buyerName || "Guest User";
  const buyerAvatar = order.buyerAvatarUrl || order.buyerImage || "";

  let coverImage = "";
  try {
    const imgs = typeof order.serviceImages === "string" ? JSON.parse(order.serviceImages) : order.serviceImages;
    if (Array.isArray(imgs) && imgs.length > 0) coverImage = imgs[0];
  } catch {}

  return (
    <DashboardShell title="Order Details" role="freelancer">
      <div className="mx-auto w-full max-w-4xl space-y-8 pb-16">

        {/* Back + status */}
        <div className="flex items-center justify-between">
          <Link
            href="/freelancer/orders"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </Link>
          <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full border ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        {/* Title */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Hash className="h-3.5 w-3.5" />
            <span className="font-mono">{order.referenceId?.substring(0, 8).toUpperCase() || "PENDING"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Order Details
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Placed on {formatDate(order.createdAt)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: service details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" /> Service Details
                </h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex gap-4">
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    {coverImage ? (
                      <img src={coverImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted/50">
                        <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Service Purchased</p>
                    <p className="font-bold text-foreground text-lg leading-tight">
                      {order.serviceTitle || "Custom Service"}
                    </p>
                    {order.serviceCategory && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {order.serviceCategory}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" /> Package Tier
                    </p>
                    <p className="font-bold text-foreground capitalize text-lg">{order.tier}</p>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-xs text-primary mb-1 flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" /> Your Earnings
                    </p>
                    <p className="font-bold text-foreground text-xl">
                      ${parseFloat(order.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: buyer info */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm sticky top-24">
              <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
                <h2 className="text-sm font-bold text-foreground">Buyer Information</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={buyerAvatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {buyerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{buyerName}</p>
                    <p className="text-xs text-muted-foreground">Client</p>
                  </div>
                </div>

                {order.buyerEmail && (
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                      <Mail className="h-3 w-3" /> Email Address
                    </p>
                    <a href={`mailto:${order.buyerEmail}`} className="text-sm text-primary hover:underline break-all">
                      {order.buyerEmail}
                    </a>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  {order.buyerId && (
                    <Button asChild className="w-full gap-2">
                      <Link href="/chat">
                        <MessageCircle className="h-4 w-4" /> Message Buyer
                      </Link>
                    </Button>
                  )}
                  {order.buyerEmail && (
                    <Button variant="outline" asChild className="w-full gap-2">
                      <a href={`mailto:${order.buyerEmail}`}>
                        <Mail className="h-4 w-4" /> Email
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
