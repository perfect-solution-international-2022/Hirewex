"use server";

import { db } from "@/lib/db"; 
import { jobs } from "@/drizzle/schema"; 
import { auth } from "@/auth"; 
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

const jobSchema = z.object({
  title:        z.string().min(5, "Project title must be at least 5 characters."),
  categoryId:   z.string().min(1, "Please select a category."),
  description:  z.string().min(20, "Description must be at least 20 characters."),
  budgetMin:    z.coerce.number().min(1, "Please enter a minimum budget."),
  budgetMax:    z.coerce.number().min(1, "Please enter a maximum budget."),
  skills:       z.string().optional(),
  skillLevel:   z.string().min(1, "Please select a skill level."),
  projectScope: z.string().min(1, "Please select a project scope."),
});

// --- ACTION 1: POST A NEW JOB ---
export async function postJobAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const rawData = Object.fromEntries(formData.entries());
    const safeData = {
      title:        (rawData.title as string) || "",
      categoryId:   (rawData.categoryId as string) || "",
      description:  (rawData.description as string) || "",
      skillLevel:   (rawData.skillLevel as string) || "",
      projectScope: (rawData.projectScope as string) || "",
      budgetMin:    rawData.budgetMin || 0, 
      budgetMax:    rawData.budgetMax || 0,
      skills:       (rawData.skills as string) || "",
    };

    const validated = jobSchema.safeParse(safeData);
    if (!validated.success) {
      const fe = validated.error.flatten().fieldErrors;
      return { success: false, error: fe.title?.[0] || fe.categoryId?.[0] || fe.description?.[0] || fe.skillLevel?.[0] || fe.projectScope?.[0] || fe.budgetMin?.[0] || fe.budgetMax?.[0] || "Please fill out all required fields." };
    }

    await db.insert(jobs).values({
      id:            crypto.randomUUID(),
      buyerId:       session.user.id,
      title:         validated.data.title,
      categoryId:    validated.data.categoryId, 
      description:   validated.data.description, 
      budgetMin:     validated.data.budgetMin.toString(),
      budgetMax:     validated.data.budgetMax.toString(),
      skills:        validated.data.skills || null,
      skillLevel:    validated.data.skillLevel, 
      projectScope:  validated.data.projectScope,
      status:        "open",
      approvalStatus: "pending", // awaits admin approval before going live
    });
    
    revalidatePath("/my-projects");
    return { success: true };
  } catch (error) {
    console.error("Action error:", error);
    return { success: false, error: "Server error occurred while posting the project." };
  }
}

// --- ACTION 2: DELETE A JOB ---
export async function deleteJobAction(jobId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await db.delete(jobs).where(and(eq(jobs.id, jobId), eq(jobs.buyerId, session.user.id)));
    revalidatePath("/my-projects");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete job:", error);
    return { success: false, error: "Failed to delete project." };
  }
}

// --- ACTION 3: EDIT AN EXISTING JOB — resets approvalStatus to pending ---
export async function editJobAction(jobId: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const rawData = Object.fromEntries(formData.entries());
    const safeData = {
      title:        (rawData.title as string) || "",
      categoryId:   (rawData.categoryId as string) || "",
      description:  (rawData.description as string) || "",
      skillLevel:   (rawData.skillLevel as string) || "",
      projectScope: (rawData.projectScope as string) || "",
      budgetMin:    rawData.budgetMin || 0, 
      budgetMax:    rawData.budgetMax || 0,
      deadline:     (rawData.deadline as string) || "",
      skills:       (rawData.skills as string) || "",
    };

    const validated = jobSchema.safeParse(safeData);
    if (!validated.success) {
      const fe = validated.error.flatten().fieldErrors;
      return { success: false, error: fe.title?.[0] || fe.categoryId?.[0] || fe.description?.[0] || fe.skillLevel?.[0] || fe.projectScope?.[0] || fe.budgetMin?.[0] || fe.budgetMax?.[0] || "Please fill out all required fields." };
    }

    await db.update(jobs).set({
      title:          validated.data.title,
      categoryId:     validated.data.categoryId, 
      description:    validated.data.description, 
      budgetMin:      validated.data.budgetMin.toString(), 
      budgetMax:      validated.data.budgetMax.toString(),
      skills:         validated.data.skills || null,
      skillLevel:     validated.data.skillLevel, 
      projectScope:   validated.data.projectScope,
      approvalStatus: "pending", // re-review on edit
    }).where(and(eq(jobs.id, jobId), eq(jobs.buyerId, session.user.id)));
    
    revalidatePath("/my-projects");
    return { success: true };
  } catch (error) {
    console.error("Action error:", error);
    return { success: false, error: "Server error occurred while updating the project." };
  }
}
