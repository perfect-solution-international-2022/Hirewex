import { db } from "@/lib/db";
import { freelancerServices, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck } from "lucide-react";
import Image from "next/image";

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

  // <-- FIXED: Await params so Next.js doesn't crash the variables
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
    .where(eq(freelancerServices.id, serviceId)); // <-- Using resolved param

  if (!serviceData) {
    redirect("/service"); 
  }

  const { service, freelancer } = serviceData;
  
  const packages = service.packages as any;
  const chosenPackage = packages[tier];
  
  const basePrice = Number(chosenPackage.price);
  const serviceFeeRate = 0.05; 
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

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <SiteHeader />
      
      <main className="container mx-auto flex-1 px-4 py-12 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">Confirm & Pay</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {thumbnail ? (
                    <div className="relative aspect-video w-full sm:w-48 shrink-0 overflow-hidden rounded-md border border-border">
                      <Image 
                        src={thumbnail} 
                        alt={service.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full sm:w-48 shrink-0 bg-muted rounded-md border border-border flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">No Image</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <h2 className="font-semibold text-lg leading-tight">{service.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      By <span className="font-medium text-foreground">{freelancer.displayName || freelancer.name}</span>
                    </p>
                    
                    <div className="pt-4 space-y-1">
                      <span className="inline-block bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider px-2 py-1 rounded">
                        {chosenPackage.name} Package
                      </span>
                      <p className="text-sm text-muted-foreground mt-2">
                        {chosenPackage.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-border/40 pt-6">
                  <h3 className="font-semibold mb-4">Included in this package:</h3>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {chosenPackage.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border/60 shadow-sm sticky top-24">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-xl">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Price</span>
                    <span className="font-medium">{formatCurrency(basePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Fee (5%)</span>
                    <span className="font-medium">{formatCurrency(serviceFee)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-border/40 pt-4">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-2xl">{formatCurrency(total)}</span>
                </div>

                <Button size="lg" className="w-full font-bold text-lg h-14">
                  Confirm & Pay
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span>Safe and secure encrypted payment</span>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}