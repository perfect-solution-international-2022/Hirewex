"use server";

import { db } from "@/lib/db";
import { bids, jobs, projects, projectSubmissions, notifications } from "@/drizzle/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { put } from "@vercel/blob";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

async function triggerNotification(userId: string, payload: { id: string; title: string; body: string; link: string }) {
  await db.insert(notifications).values({ ...payload, userId, read: 0 });
  try {
    await pusher.trigger(`user-${userId}`, "notification", payload);
  } catch (err) {
    console.warn("Pusher trigger failed (non-fatal):", err);
  }
}

export async function submitWorkAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const bidId = formData.get("bidId") as string;
    const jobId = formData.get("jobId") as string;
    const description = (formData.get("description") as string)?.trim() || null;
    const linkUrl = (formData.get("linkUrl") as string)?.trim() || null;
    const file = formData.get("file") as File | null;

    if (!bidId || !jobId) return { success: false, error: "Missing required fields." };
    if (!description && !linkUrl && (!file || file.size === 0)) {
      return { success: false, error: "Please provide a description, link, or file." };
    }

    const [bid] = await db
      .select({ freelancerId: bids.freelancerId, amount: bids.amount, status: bids.status })
      .from(bids)
      .where(eq(bids.id, bidId))
      .limit(1);

    if (!bid || bid.freelancerId !== session.user.id || bid.status !== "accepted") {
      return { success: false, error: "Unauthorized" };
    }

    // Get or create the project
    let [project] = await db.select().from(projects).where(eq(projects.bidId, bidId)).limit(1);

    if (!project) {
      const [jobRow] = await db.select({ buyerId: jobs.buyerId }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
      if (!jobRow) return { success: false, error: "Job not found." };
      const projectId = crypto.randomUUID();
      await db.insert(projects).values({
        id: projectId,
        jobId,
        bidId,
        buyerId: jobRow.buyerId,
        freelancerId: session.user.id,
        amount: bid.amount,
        status: "active",
      });
      [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    }

    if (project.freelancerId !== session.user.id) return { success: false, error: "Unauthorized" };

    let fileUrl: string | null = null;
    if (file && file.size > 0) {
      const blob = await put(
        `submissions/${session.user.id}/${crypto.randomUUID()}-${file.name}`,
        file,
        { access: "public" }
      );
      fileUrl = blob.url;
    }

    await db.insert(projectSubmissions).values({
      id: crypto.randomUUID(),
      projectId: project.id,
      freelancerId: session.user.id,
      buyerId: project.buyerId,
      description,
      fileUrl,
      linkUrl,
      status: "pending",
    });

    await db.update(projects).set({ status: "submitted" }).where(eq(projects.id, project.id));

    const [jobRow] = await db.select({ title: jobs.title }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
    const notifId = crypto.randomUUID();
    await triggerNotification(project.buyerId, {
      id: notifId,
      title: "Work submitted for review",
      body: `A freelancer has submitted work for "${jobRow?.title ?? "your project"}". Review it now.`,
      link: "/submitted-work",
    });

    revalidatePath("/freelancer/hired");
    revalidatePath("/submitted-work");
    return { success: true };
  } catch (error) {
    console.error("submitWorkAction error:", error);
    return { success: false, error: "Failed to submit work. Please try again." };
  }
}

export async function reviewSubmissionAction(
  submissionId: string,
  action: "accepted" | "rejected" | "revision_requested",
  buyerNote?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const [submission] = await db
      .select()
      .from(projectSubmissions)
      .where(eq(projectSubmissions.id, submissionId))
      .limit(1);

    if (!submission || submission.buyerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    await db
      .update(projectSubmissions)
      .set({ status: action, buyerNote: buyerNote?.trim() || null })
      .where(eq(projectSubmissions.id, submissionId));

    if (action === "accepted") {
      await db
        .update(projects)
        .set({ status: "completed", completedAt: new Date().toISOString() })
        .where(eq(projects.id, submission.projectId));
    } else {
      await db
        .update(projects)
        .set({ status: "active" })
        .where(eq(projects.id, submission.projectId));
    }

    const [proj] = await db
      .select({ jobId: projects.jobId })
      .from(projects)
      .where(eq(projects.id, submission.projectId))
      .limit(1);
    const [jobRow] = proj
      ? await db.select({ title: jobs.title }).from(jobs).where(eq(jobs.id, proj.jobId)).limit(1)
      : [null];

    const notifTitle =
      action === "accepted" ? "Work accepted!" :
      action === "rejected" ? "Submission rejected" :
      "Revision requested";
    const notifBody =
      action === "accepted"
        ? `Your work on "${jobRow?.title ?? "the project"}" has been accepted!`
        : action === "rejected"
        ? `Your submission for "${jobRow?.title ?? "the project"}" was rejected.${buyerNote ? ` Reason: ${buyerNote}` : ""}`
        : `The buyer requested a revision for "${jobRow?.title ?? "the project"}".${buyerNote ? ` Note: ${buyerNote}` : ""}`;

    const notifId = crypto.randomUUID();
    await triggerNotification(submission.freelancerId, {
      id: notifId,
      title: notifTitle,
      body: notifBody,
      link: "/freelancer/hired",
    });

    revalidatePath("/submitted-work");
    revalidatePath("/freelancer/hired");
    return { success: true };
  } catch (error) {
    console.error("reviewSubmissionAction error:", error);
    return { success: false, error: "Failed to review submission. Please try again." };
  }
}
