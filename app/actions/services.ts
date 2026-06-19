"use server";

import { db } from "@/lib/db";
import { freelancerServices } from "@/drizzle/schema";
import { auth } from "@/auth"; 
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { put } from "@vercel/blob"; //
// --- 1. CREATE ACTION ---
export async function createServiceAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // 1. Extract standard text data (no Zod schema needed here since we validate on the frontend, 
    // but you can keep it if you want strict server-side validation)
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const packagesData = JSON.parse(formData.get("packages") as string);

    const category = formData.get("category") as string;
    
    // 2. EXTRACT THE IMAGES
    const imageFiles = formData.getAll("images") as File[];
    const imageUrls: string[] = [];

    // 3. VERCEL BLOB UPLOAD LOGIC
    for (const file of imageFiles) {
      if (file.size > 0) {
        // Create a unique filename so images don't overwrite each other
        const uniqueFilename = `${crypto.randomUUID()}-${file.name}`;
        
        // Upload the file to Vercel Blob
        const blob = await put(`services/${uniqueFilename}`, file, {
          access: 'public',
        });
        
        // Push the live URL into our array
        imageUrls.push(blob.url);
      }
    }

    // 4. Save everything to the database
    await db.insert(freelancerServices).values({
      id: crypto.randomUUID(),
      freelancerId: session.user.id,
      title: title,
      description: description,
      packages: packagesData,
      images: imageUrls, 
      category: category,
    
    });
    
    revalidatePath("/freelancer/projects"); 
    return { success: true };
  } catch (error) {
    console.error("Action error:", error);
    return { success: false, error: "Failed to create service." };
  }
}

// --- 2. DELETE ACTION ---
export async function deleteServiceAction(serviceId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Security check: Only delete if the user owns this service
    await db
      .delete(freelancerServices)
      .where(
        and(
          eq(freelancerServices.id, serviceId),
          eq(freelancerServices.freelancerId, session.user.id)
        )
      );

    revalidatePath("/freelancer/projects");
    revalidatePath("/admin/service-approval");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete service:", error);
    return { success: false, error: "Failed to delete project." };
  }
}

// Add this at the bottom of app/actions/services.ts

export async function updateServiceAction(serviceId: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const packagesData = JSON.parse(formData.get("packages") as string);
    
    // 1. Get the existing images the user decided to KEEP
    const existingImages = JSON.parse(formData.get("existingImages") as string || "[]");
    let finalImageUrls: string[] = [...existingImages];

    // 2. UPLOAD NEW IMAGES (if they added any)
    const imageFiles = formData.getAll("images") as File[];
    if (imageFiles.length > 0 && imageFiles[0].size > 0) {
      for (const file of imageFiles) {
        if (file.size > 0) {
          const uniqueFilename = `${crypto.randomUUID()}-${file.name}`;
          const blob = await put(`services/${uniqueFilename}`, file, {
            access: 'public',
          });
          finalImageUrls.push(blob.url); // Add new URLs to the kept URLs
        }
      }
    }

    // 3. UPDATE THE DATABASE
    const updateData: any = {
      title,
      category,
      description,
      packages: packagesData,
      images: finalImageUrls, 
      status: "pending",    
      adminNote: null,
    };

    await db
      .update(freelancerServices)
      .set(updateData)
      .where(
        and(
          eq(freelancerServices.id, serviceId),
          eq(freelancerServices.freelancerId, session.user.id)
        )
      );
    
    revalidatePath("/freelancer/projects"); 
    return { success: true };
  } catch (error) {
    console.error("Action error:", error);
    return { success: false, error: "Failed to update service." };
  }
}
