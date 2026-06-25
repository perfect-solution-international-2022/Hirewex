export const dynamic = "force-dynamic";
export const metadata = { title: "Wallet — Hirewex" };

import { db } from "@/lib/db";
import { transactions, withdrawals, users } from "@/drizzle/schema";
import { eq, and, sum, desc, or } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { WalletClient } from "./WalletClient";

export default async function WalletPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const userId = session.user.id;

  const [[earned], [withdrawn], [pendingSum], txRows, wdRows, [userRow]] = await Promise.all([
    db.select({ total: sum(transactions.amount) }).from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.type, "release"))),

    db.select({ total: sum(withdrawals.amount) }).from(withdrawals)
      .where(and(eq(withdrawals.userId, userId), eq(withdrawals.status, "completed"))),

    db.select({ total: sum(withdrawals.amount) }).from(withdrawals)
      .where(and(eq(withdrawals.userId, userId), eq(withdrawals.status, "pending"))),

    db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(50),

    db.select().from(withdrawals)
      .where(eq(withdrawals.userId, userId))
      .orderBy(desc(withdrawals.createdAt))
      .limit(50),

    db.select({
      bankName: users.bankName,
      bankAccountHolder: users.bankAccountHolder,
      bankAccountNumber: users.bankAccountNumber,
      bankBranch: users.bankBranch,
    }).from(users).where(eq(users.id, userId)).limit(1),
  ]);

  const totalEarned    = Number(earned?.total ?? 0);
  const totalWithdrawn = Number(withdrawn?.total ?? 0);
  const totalPending   = Number(pendingSum?.total ?? 0);
  const available      = Math.max(0, totalEarned - totalWithdrawn - totalPending);

  return (
    <DashboardShell title="Wallet" role="freelancer">
      <WalletClient
        totalEarned={totalEarned}
        totalWithdrawn={totalWithdrawn}
        totalPending={totalPending}
        available={available}
        transactions={txRows}
        withdrawals={wdRows}
        bankDetails={userRow ?? null}
      />
    </DashboardShell>
  );
}
