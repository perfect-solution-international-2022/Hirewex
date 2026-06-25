"use server";

import { db } from "@/lib/db";
import { freelancerServices } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.roles?.includes("admin")) {
    throw new Error("Unauthorized. Admins only.");
  }
}

export async function approveService(serviceId: string) {
  await requireAdmin();
  await db
    .update(freelancerServices)
    .set({ status: "approved" })
    .where(eq(freelancerServices.id, serviceId));
  revalidatePath("/admin/service-approval");
  revalidatePath("/freelancer/projects");
  revalidatePath("/service");
  revalidatePath("/");
}

export async function denyService(serviceId: string) {
  await requireAdmin();
  await db
    .update(freelancerServices)
    .set({ status: "denied" })
    .where(eq(freelancerServices.id, serviceId));
  revalidatePath("/admin/service-approval");
  revalidatePath("/freelancer/projects");
  revalidatePath("/service");
}

// --- UPDATED FUNCTION ---
export async function requestModification(serviceId: string, note: string) {
  await requireAdmin();
  
  if (!note || note.trim() === "") {
    throw new Error("A modification note is required.");
  }

  await db
    .update(freelancerServices)
    .set({ 
      status: "requires_modification",
      adminNote: note // <-- This saves the text to your database!
    })
    .where(eq(freelancerServices.id, serviceId));
    
  revalidatePath("/admin/service-approval");
  revalidatePath("/freelancer/projects");
}