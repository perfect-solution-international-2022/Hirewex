"use server";

import { db } from "@/lib/db";
import { users, userRoles } from "@/drizzle/schema"; 
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  role: z.enum(["buyer", "freelancer"]),
});

export async function registerUser(formData: FormData) {
  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as string,
  };

  const validatedData = registerSchema.safeParse(rawData);

  if (!validatedData.success) {
   return { error: validatedData.error.issues[0].message };
  }

  const { name, email, password, role } = validatedData.data;

  try {
    const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUsers.length > 0) {
      return { error: "An account with this email already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate the UUID before inserting!
    const newUserId = crypto.randomUUID(); 

    await db.transaction(async (tx) => {
      // Insert user
      await tx.insert(users).values({
        id: newUserId,
        name,
        email,
        passwordHash: hashedPassword, // Fixed: camelCase
      });

      // Insert role
      await tx.insert(userRoles).values({
        id: crypto.randomUUID(), 
        userId: newUserId, // Fixed: camelCase
        role: role,
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Something went wrong during registration. Please try again." };
  }
}