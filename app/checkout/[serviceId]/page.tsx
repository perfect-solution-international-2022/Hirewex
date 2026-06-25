import { db } from "@/lib/db";
import { freelancerServices, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, ShieldCheck, Clock, RefreshCw, ImageIcon } from "lucide-react";
import { createOnePayCheckout } from "@/app/actions/onepay";
import { getServiceFeePercent } from "@/app/actions/platform-settings";
import { PayButton } from "./PayButton";

export const metadata = {
  title: "Checkout — Hirewex",
};

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { serviceId: string };
  searchParams: { tier?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const serviceId = resolvedParams.serviceId;

  const tier = resolvedSearchParams.tier === "basic" || resolvedSearchParams.tier === "premium"
    ? resolvedSearchParams.tier
    : "standard";

  const [serviceData] = await db
    .select({
      service: freelancerServices,
      freelancer: users,
    })
    .from(freelancerServices)
    .innerJoin(users, eq(freelancerServices.freelancerId, users.id))
    .where(eq(freelancerServices.id, serviceId));

  if (!serviceData) {
    redirect("/service");
  }

  const { service, freelancer } = serviceData;

  const packages = service.packages as any;
  const chosenPackage = packages[tier];

  const basePrice = Number(chosenPackage.price);
  const serviceFeeRate = (await getServiceFeePercent()) / 100;
  const serviceFee = basePrice * serviceFeeRate;
  const total = basePrice + serviceFee;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const images = service.images as string[] | null;
  const thumbnail = images && images.length > 0 ? images[0] : null;
  const freelancerName = freelancer.displayName || freelancer.name || "Freelancer";
  const freelancerAvatar = freelancer.avatarUrl || freelancer.image || "";

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <SiteHeader />

      <main className="container mx-auto flex-1 px-4 py-10 max-w-5xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-1">Step 2 of 2</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Confirm & Pay</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* LEFT — order details */}
          <div className="lg:col-span-3 space-y-6">

            {/* Service card */}
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
                <h2 className="text-sm font-bold text-foreground">Order Summary</h2>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="relative aspect-video w-full sm:w-44 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
                    {thumbnail ? (
                      <img src={thumbnail} alt={service.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-3 min-w-0">
                    <h3 className="font-bold text-lg leading-tight text-foreground">{service.title}</h3>

                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={freelancerAvatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {freelancerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        By <span className="font-medium text-foreground">{freelancerName}</span>
                      </span>
                    </div>

                    <Badge variant="secondary" className="capitalize text-xs px-2.5 py-1">
                      {chosenPackage.name} Package
                    </Badge>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {chosenPackage.description}
                    </p>
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground bg-muted/50 px-2.5 py-1.5 rounded-md">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" /> 3-day delivery
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground bg-muted/50 px-2.5 py-1.5 rounded-md">
                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" /> Unlimited revisions
                  </div>
                </div>

                {/* Features */}
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                    What's included
                  </p>
                  <ul className="grid sm:grid-cols-2 gap-2.5">
                    {chosenPackage.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Check className="h-2.5 w-2.5 text-primary" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Trust strip */}
            <div className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/20 p-4">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Buyer protection included</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your payment is held securely and only released to the freelancer once you're satisfied with the delivery.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — payment summary */}
          <div className="lg:col-span-2 lg:sticky lg:top-24">
            <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
                <h2 className="text-sm font-bold text-foreground">Payment Details</h2>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Price</span>
                    <span className="font-medium text-foreground">{formatCurrency(basePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Fee ({(serviceFeeRate * 100).toFixed(serviceFeeRate * 100 % 1 === 0 ? 0 : 1)}%)</span>
                    <span className="font-medium text-foreground">{formatCurrency(serviceFee)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-border/50 pt-4">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-bold text-2xl text-foreground">{formatCurrency(total)}</span>
                </div>

                <form action={createOnePayCheckout}>
                  <input type="hidden" name="serviceId" value={service.id} />
                  <input type="hidden" name="freelancerId" value={freelancer.id} />
                  <input type="hidden" name="tier" value={tier} />
                  <input type="hidden" name="total" value={total.toString()} />

                  <PayButton />
                </form>

                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Safe and secure encrypted payment
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
