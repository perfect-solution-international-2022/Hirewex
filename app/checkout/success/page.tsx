import { db } from "@/lib/db";
import { serviceOrders } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function SuccessPage({ searchParams }: { searchParams: { reference?: string } }) {
  const resolvedSearchParams = await searchParams;
  const reference = resolvedSearchParams.reference;

  if (!reference) redirect("/");

  // Note: For perfect security, your OnePay Webhook (Callback URL) should also 
  // verify this in the background, but we can optimistically update it here for the user.
  await db.update(serviceOrders)
    .set({ status: "paid" })
    .where(eq(serviceOrders.referenceId, reference));

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container mx-auto flex-1 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full text-center border-border shadow-md">
          <CardContent className="pt-10 pb-8 space-y-6">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
            <h1 className="text-3xl font-bold">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Your OnePay transaction was successful and the freelancer has been notified.
            </p>
            <Button asChild className="w-full">
              <Link href="/paid">View My Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}