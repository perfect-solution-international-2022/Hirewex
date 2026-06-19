"use server";

import { db } from "@/lib/db";
import { conversations, freelancerServices, jobs, categories } from "@/drizzle/schema";
import { and, eq, or } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

// --- UPDATED: Accepts jobId as an optional parameter ---
export async function createOrGetConversation(
  targetUserId: string, 
  targetRole: "seller" | "buyer", 
  contextId?: string, // This will be either serviceId or jobId
  contextType?: "service" | "job" // Added to distinguish context type
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const currentUserId = session.user.id;

  if (!targetUserId || targetUserId === "undefined" || targetUserId === "null") {
    throw new Error("Target User ID is missing.");
  }

  // 1. Check for existing chat
  const existingChat = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      or(
        and(eq(conversations.userA, currentUserId), eq(conversations.userB, targetUserId)),
        and(eq(conversations.userA, targetUserId), eq(conversations.userB, currentUserId))
      )
    )
    .limit(1);

  // Helper to construct the redirect URL with the correct context
  const getUrl = (convoId: string) => {
    if (!contextId || !contextType) return `/chat/${convoId}`;
    return `/chat/${convoId}?${contextType}Id=${contextId}`;
  };

  if (existingChat.length > 0) {
    redirect(getUrl(existingChat[0].id));
  }

  // 2. Insert new conversation
  await db.insert(conversations).values({
    userA: currentUserId,
    userB: targetUserId,
  });

  // 3. Fetch the ID we just created
  const [newChat] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.userA, currentUserId), eq(conversations.userB, targetUserId)))
    .limit(1);

  if (!newChat) throw new Error("Database failed to save conversation.");

  redirect(getUrl(newChat.id));
}

// --- EXISTING: Service context ---
export async function getServiceContext(serviceId: string) {
  const [service] = await db
    .select({ id: freelancerServices.id, title: freelancerServices.title, images: freelancerServices.images })
    .from(freelancerServices)
    .where(eq(freelancerServices.id, serviceId));
  return service;
}

// --- NEW: Job context ---
export async function getJobContext(jobId: string) {
  try {
    const [job] = await db
      .select({ 
        id: jobs.id, 
        title: jobs.title, 
      })
      .from(jobs)
      .where(eq(jobs.id, jobId));

    if (!job) {
      // FALLBACK: If the DB finds nothing, STILL return a card so the UI doesn't break
      return { id: jobId, title: "Job Details", type: "job", image: null };
    }

    return {
      id: job.id,
      title: job.title,
      type: "job",
      image: null,
    };
  } catch (error) {
    console.error("Failed to fetch job context:", error);
    // FALLBACK ON ERROR
    return { id: jobId, title: "Job Details", type: "job", image: null };
  }
}