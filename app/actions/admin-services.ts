"use server";

import { db } from "@/lib/db";
import { freelancerServices } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createService(name: string, slug: string) {
  await db.insert(freelancerServices).values({ title: name });
  revalidatePath("/admin/services");
}

export async function updateService(id: string, name: string, slug: string) {
  await db.update(freelancerServices).set({ title: name }).where(eq(freelancerServices.id, id));
  revalidatePath("/admin/services");
}

export async function deleteService(id: string) {
  await db.delete(freelancerServices).where(eq(freelancerServices.id, id));
  revalidatePath("/admin/services");
}