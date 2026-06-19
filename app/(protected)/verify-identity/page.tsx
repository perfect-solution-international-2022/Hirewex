import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { KycForm } from "./KycForm";
import { SiteHeader } from "@/components/layout/SiteHeader"; // Adjust if needed

export const metadata = {
  title: "Verify Identity | Hirewex",
};

export default async function VerifyIdentityPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/");
  }

  // Check their status. If they are already pending or approved, they shouldn't be on this form!
  const [currentUser] = await db
    .select({ kycStatus: users.kycStatus })
    .from(users)
    .where(eq(users.id, session.user.id));

  if (currentUser?.kycStatus === "pending" || currentUser?.kycStatus === "approved") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-muted/10">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Identity Verification</h1>
          <p className="text-muted-foreground mt-2">
            Please provide your legal information and documents. This keeps Hirewex safe for everyone.
          </p>
        </div>
        
        <KycForm />
      </main>
    </div>
  );
}