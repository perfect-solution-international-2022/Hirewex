"use server";

import { db } from "@/lib/db";
import { users, userRoles, verificationTokens } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendVerificationPin } from "@/lib/email";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  role: z.enum(["buyer", "freelancer"]),
});

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function expiresAt(): string {
  return new Date(Date.now() + 15 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}

export async function registerUser(formData: FormData) {
  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as string,
  };

  const validated = registerSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { name, email, password, role } = validated.data;

  try {
    const existing = await db.select({ id: users.id, emailVerified: users.emailVerified })
      .from(users).where(eq(users.email, email)).limit(1);

    if (existing.length > 0) {
      // If account exists but email not verified, allow re-sending PIN
      if (!existing[0].emailVerified) {
        await sendNewPin(email, name);
        return { pendingVerification: true, email };
      }
      return { error: "An account with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: newUserId,
        name,
        email,
        passwordHash: hashedPassword,
      });
      await tx.insert(userRoles).values({
        id: crypto.randomUUID(),
        userId: newUserId,
        role,
      });
    });

    await sendNewPin(email, name);

    return { pendingVerification: true, email };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

async function sendNewPin(email: string, name: string) {
  const pin = generatePin();

  // Delete any existing token for this email first
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));

  await db.insert(verificationTokens).values({
    identifier: email,
    token: pin,
    expires: expiresAt(),
  });

  await sendVerificationPin(email, name, pin);
}

export async function verifyEmailPin(email: string, pin: string) {
  try {
    const [record] = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.identifier, email))
      .limit(1);

    if (!record) {
      return { error: "No verification code found. Please request a new one." };
    }

    // Check expiry
    if (new Date(record.expires) < new Date()) {
      await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
      return { error: "This code has expired. Please request a new one." };
    }

    if (record.token !== pin.trim()) {
      return { error: "Incorrect code. Please check your email and try again." };
    }

    // Mark email as verified
    await db.update(users)
      .set({ emailVerified: new Date().toISOString().slice(0, 19).replace("T", " ") })
      .where(eq(users.email, email));

    // Clean up the token
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));

    return { success: true };
  } catch (error) {
    console.error("verifyEmailPin error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function resendVerificationPin(email: string) {
  try {
    const [user] = await db.select({ name: users.name, emailVerified: users.emailVerified })
      .from(users).where(eq(users.email, email)).limit(1);

    if (!user) return { error: "Account not found." };
    if (user.emailVerified) return { error: "This email is already verified." };

    await sendNewPin(email, user.name || "there");
    return { success: true };
  } catch (error) {
    console.error("resendVerificationPin error:", error);
    return { error: "Failed to resend code. Please try again." };
  }
}
