import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projectSubmissions, transactions, userRoles } from "@/drizzle/schema";
import { eq, and, isNull, gte, count } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ badges: {} });

    const userId = session.user.id;

    const [roles, buyerPending, freelancerRecent, adminPending] = await Promise.all([
      // User roles
      db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, userId)),

      // Buyer: pending submissions awaiting review
      db.select({ value: count() })
        .from(projectSubmissions)
        .where(and(eq(projectSubmissions.buyerId, userId), eq(projectSubmissions.status, "pending"))),

      // Freelancer: release transactions in the last 7 days
      db.select({ value: count() })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.type, "release"),
          gte(transactions.createdAt, sql`DATE_SUB(NOW(), INTERVAL 7 DAY)`),
        )),

      // Admin: accepted submissions not yet released (only if admin)
      db.select({ value: count() })
        .from(projectSubmissions)
        .where(and(eq(projectSubmissions.status, "accepted"), isNull(projectSubmissions.paymentReleasedAt))),
    ]);

    const roleSet = new Set(roles.map((r) => r.role));
    const isAdmin = roleSet.has("admin");
    const badges: Record<string, number> = {};

    if (roleSet.has("buyer")) {
      const n = buyerPending[0]?.value ?? 0;
      if (n > 0) badges["/submitted-work"] = n;
    }

    if (roleSet.has("freelancer")) {
      const n = freelancerRecent[0]?.value ?? 0;
      if (n > 0) badges["/freelancer/transactions"] = n;
    }

    if (isAdmin) {
      const n = adminPending[0]?.value ?? 0;
      if (n > 0) badges["/admin/payments"] = n;
    }

    return NextResponse.json({ badges });
  } catch (err) {
    console.error("nav-badges error:", err);
    return NextResponse.json({ badges: {} });
  }
}
