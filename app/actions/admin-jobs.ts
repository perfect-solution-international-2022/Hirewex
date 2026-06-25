"use server";

import { db } from "@/lib/db";
import { jobs } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.roles?.includes("admin")) {
    throw new Error("Unauthorized. Admins only.");
  }
}

export async function deleteJob(id: string) {
  await requireAdmin();
  await db.delete(jobs).where(eq(jobs.id, id));
  revalidatePath("/admin/jobs");
}
