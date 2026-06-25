"use server";

import { db } from "@/lib/db";
import { categories } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.roles?.includes("admin")) {
    throw new Error("Unauthorized. Admins only.");
  }
}

export async function createCategory(name: string, slug: string) {
  await requireAdmin();
  await db.insert(categories).values({ name, slug });
  revalidatePath("/admin/categories");
}

export async function updateCategory(id: string, name: string, slug: string) {
  await requireAdmin();
  await db.update(categories).set({ name, slug }).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
}
