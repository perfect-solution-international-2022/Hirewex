"use server";

import { db } from "@/lib/db";
import { withdrawals, transactions, users } from "@/drizzle/schema";
import { auth } from "@/auth";
import { eq, and, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function requestWithdrawal(amount: number) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  if (!amount || amount < 10) return { success: false, error: "Minimum withdrawal is $10." };

  // Check bank details are set
  const [user] = await db
    .select({ bankName: users.bankName, bankAccountNumber: users.bankAccountNumber, bankAccountHolder: users.bankAccountHolder, bankBranch: users.bankBranch })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.bankAccountNumber) {
    return { success: false, error: "Please add your bank details in Profile > Bank Account before requesting a withdrawal." };
  }

  // Calculate available balance
  const [[earned], [withdrawn], [pending]] = await Promise.all([
    db.select({ total: sum(transactions.amount) }).from(transactions)
      .where(and(eq(transactions.userId, session.user.id), eq(transactions.type, "release"))),
    db.select({ total: sum(withdrawals.amount) }).from(withdrawals)
      .where(and(eq(withdrawals.userId, session.user.id), eq(withdrawals.status, "completed"))),
    db.select({ total: sum(withdrawals.amount) }).from(withdrawals)
      .where(and(eq(withdrawals.userId, session.user.id), eq(withdrawals.status, "pending"))),
  ]);

  const totalEarned  = Number(earned?.total ?? 0);
  const totalWithdrawn = Number(withdrawn?.total ?? 0);
  const totalPending   = Number(pending?.total ?? 0);
  const available = totalEarned - totalWithdrawn - totalPending;

  if (amount > available) {
    return { success: false, error: `Insufficient balance. Available: $${available.toFixed(2)}.` };
  }

  await db.insert(withdrawals).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    amount: amount.toFixed(2),
    fee: "0.00",
    status: "pending",
    accountDetails: {
      bankName: user.bankName,
      bankAccountHolder: user.bankAccountHolder,
      bankAccountNumber: user.bankAccountNumber,
      bankBranch: user.bankBranch,
    },
  });

  revalidatePath("/freelancer/wallet");
  return { success: true };
}
