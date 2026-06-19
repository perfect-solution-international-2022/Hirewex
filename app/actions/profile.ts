"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users, freelancerWorkExperiences, freelancerSkills } from "@/drizzle/schema"; 
import { eq } from "drizzle-orm";
import { auth } from "@/auth"; 
import { put, del } from "@vercel/blob"; 

// Fetch User Data
export async function getProfileData(userId: string) {
  try {
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userResult[0];

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const experiences = await db.select().from(freelancerWorkExperiences).where(eq(freelancerWorkExperiences.userId, userId));
    const userSkills = await db.select().from(freelancerSkills).where(eq(freelancerSkills.userId, userId));

    const fullProfile = {
      ...user,
      workExperiences: experiences,
      skills: userSkills,
    };

    return { success: true, data: fullProfile };
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return { success: false, error: "Failed to load profile data." };
  }
}

// 1. Update basic text fields (SECURED)
export async function updateProfileBasic(data: any) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    
    const secureUserId = session.user.id;

    await db.update(users)
      .set(data)
      .where(eq(users.id, secureUserId));
      
    revalidatePath("/freelancer/profile");
    revalidatePath("/settings/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { success: false, error: "Failed to update profile." };
  }
}

// 2. Work Experience Actions
export async function saveWorkExperience(userId: string, workData: any) {
  try {
    if (!workData.id.startsWith("temp_")) {
      await db.update(freelancerWorkExperiences)
        .set({
          title: workData.title,
          type: workData.type,
          company: workData.company,
          current: workData.current ? 1 : 0, 
          startDate: workData.start,
          endDate: workData.end,
          desc: workData.desc,
          skills: workData.skills,
          industry: workData.industry
        })
        .where(eq(freelancerWorkExperiences.id, workData.id));
    } else {
      await db.insert(freelancerWorkExperiences).values({
        id: crypto.randomUUID(), 
        userId: userId, 
        title: workData.title,
        type: workData.type,
        company: workData.company,
        current: workData.current ? 1 : 0, 
        startDate: workData.start,
        endDate: workData.end,
        desc: workData.desc,
        skills: workData.skills,
        industry: workData.industry
      });
    }
    revalidatePath("/freelancer/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to save work experience:", error);
    return { success: false, error: "Failed to save work experience." };
  }
}

export async function deleteWorkExperience(workId: string) {
  try {
    if (!workId.startsWith("temp_")) {
      await db.delete(freelancerWorkExperiences).where(eq(freelancerWorkExperiences.id, workId));
    }
    revalidatePath("/freelancer/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete work experience:", error);
    return { success: false, error: "Failed to delete work experience." };
  }
}

// 3. Skills Actions
export async function saveSkill(userId: string, skillData: any) {
  try {
    if (!skillData.id.startsWith("temp_")) {
      await db.update(freelancerSkills)
        .set({ name: skillData.name, level: skillData.level })
        .where(eq(freelancerSkills.id, skillData.id));
    } else {
      await db.insert(freelancerSkills).values({ 
        id: crypto.randomUUID(),
        userId: userId, 
        name: skillData.name, 
        level: skillData.level 
      });
    }
    revalidatePath("/freelancer/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to save skill:", error);
    return { success: false, error: "Failed to save skill." };
  }
}

export async function deleteSkill(skillId: string) {
  try {
    if (!skillId.startsWith("temp_")) {
      await db.delete(freelancerSkills).where(eq(freelancerSkills.id, skillId));
    }
    revalidatePath("/freelancer/profile");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete skill:", error);
    return { success: false, error: "Failed to delete skill." };
  }
}

// 4. Vercel Blob Avatar Upload Action
export async function uploadAvatarAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const file = formData.get("avatar") as File;
    if (!file || file.size === 0) return { success: false, error: "No file provided" };

    const uniqueFilename = `avatars/${session.user.id}-${crypto.randomUUID()}-${file.name}`;
    
    const blob = await put(uniqueFilename, file, {
      access: 'public',
    });

    return { success: true, url: blob.url };
  } catch (error) {
    console.error("Avatar upload error:", error);
    return { success: false, error: "Upload failed" };
  }
}

// 5. Portfolio PDF Upload Action
export async function uploadPortfolioAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const file = formData.get("portfolio") as File;
    if (!file || file.size === 0) return { success: false, error: "No file provided" };

    if (file.type !== "application/pdf") {
      return { success: false, error: "Only PDF files are allowed." };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: "File must be under 10MB." };
    }

    // If an old portfolio exists, delete it from Blob first
    const [existing] = await db
      .select({ portfolioUrl: users.portfolioUrl })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (existing?.portfolioUrl) {
      try {
        await del(existing.portfolioUrl);
      } catch (err) {
        console.warn("Failed to delete old portfolio blob (continuing anyway):", err);
      }
    }

    const uniqueFilename = `portfolios/${session.user.id}-${crypto.randomUUID()}-${file.name}`;
    const blob = await put(uniqueFilename, file, { access: "public" });

    await db.update(users)
      .set({ portfolioUrl: blob.url })
      .where(eq(users.id, session.user.id));

    revalidatePath("/freelancer/profile");
    revalidatePath("/settings/profile");
    return { success: true, url: blob.url };
  } catch (error) {
    console.error("Portfolio upload error:", error);
    return { success: false, error: "Upload failed. Please try again." };
  }
}

// 6. Portfolio PDF Delete Action
export async function deletePortfolioAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const [existing] = await db
      .select({ portfolioUrl: users.portfolioUrl })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (existing?.portfolioUrl) {
      try {
        await del(existing.portfolioUrl);
      } catch (err) {
        console.warn("Failed to delete portfolio blob (continuing anyway):", err);
      }
    }

    await db.update(users)
      .set({ portfolioUrl: null })
      .where(eq(users.id, session.user.id));

    revalidatePath("/freelancer/profile");
    revalidatePath("/settings/profile");
    return { success: true };
  } catch (error) {
    console.error("Portfolio delete error:", error);
    return { success: false, error: "Failed to delete portfolio." };
  }
}
