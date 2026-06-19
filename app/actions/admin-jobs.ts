"use server";
import { db } from "@/lib/db";
import { jobs } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteJob(id: string) {
  await db.delete(jobs).where(eq(jobs.id, id));
  revalidatePath("/admin/jobs");
}