"use server";

import { db } from "@/lib/db";
import { platformSettings } from "@/drizzle/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSetting(key: string, fallback: string): Promise<string> {
  try {
    const [row] = await db
      .select({ value: platformSettings.value })
      .from(platformSettings)
      .where(eq(platformSettings.key, key))
      .limit(1);
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getServiceFeePercent(): Promise<number> {
  const val = await getSetting("service_fee_percent", "5");
  const n = parseFloat(val);
  return isNaN(n) ? 5 : Math.min(Math.max(n, 0), 100);
}

export async function updateSetting(key: string, value: string) {
  const session = await auth();
  if (!session?.user?.roles?.includes("admin")) throw new Error("Unauthorized");

  await db
    .insert(platformSettings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value, updatedAt: new Date().toISOString().slice(0, 19).replace("T", " ") } });

  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
}
