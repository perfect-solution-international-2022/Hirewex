import { db } from "@/lib/db"; 
import { categories, users } from "@/drizzle/schema"; 
import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { KycGuard } from "@/components/auth/KycGuard";
import { DashboardShell } from "@/components/layout/DashboardShell"; 
import PostProjectClient from "./PostProjectClient";

// Disable caching so you always get the latest categories
export const dynamic = "force-dynamic"; 

export default async function PostProjectPage() {
  const session = await auth();
  
  // 1. Kick out unauthenticated users to the Auth page
  if (!session?.user?.id) {
    redirect("/auth"); // Ensure this matches your login route (e.g., /auth or /auth?mode=signin)
  }

  // 2. Fetch the current user's KYC status
  const [currentUser] = await db
    .select({ kycStatus: users.kycStatus })
    .from(users)
    .where(eq(users.id, session.user.id));

  // 3. Fetch categories
  const dbCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories)
    .orderBy(asc(categories.name));

  // 4. Wrap the Client component and Guard inside the DashboardShell
  return (
    <DashboardShell title="Post a Project" role="buyer">
      <KycGuard kycStatus={currentUser?.kycStatus || "unverified"}>
        <PostProjectClient dbCategories={dbCategories} />
      </KycGuard>
    </DashboardShell>
  );
}