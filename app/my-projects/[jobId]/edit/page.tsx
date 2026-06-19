import { auth } from "@/auth";
import { db } from "@/lib/db";
import { jobs, categories } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import EditProjectClient from "./EditProjectClient";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: { params: Promise<{ jobId: string }> }) {
  // Await the params safely for Next.js 15
  const resolvedParams = await params;
  const jobId = resolvedParams.jobId;
  
  const session = await auth();

  if (!session?.user?.id) {
    return <div className="p-20 text-center text-red-500 font-bold text-2xl">Error: Not logged in.</div>;
  }

  // --- DEBUGGING CONSOLE LOGS ---
  console.log("Looking for Job ID:", jobId);
  console.log("Current User ID:", session.user.id);

  // Fetch the specific job
  const jobResult = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.buyerId, session.user.id)))
    .limit(1);

  // --- TEMPORARILY REMOVED notFound() TO SEE THE REAL ERROR ---
  if (!jobResult || jobResult.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-4 bg-muted/20">
        <h1 className="text-4xl font-bold text-red-500">Database Data Mismatch!</h1>
        <p className="text-lg">Next.js found your page file perfectly, but the database rejected the query.</p>
        
        <div className="bg-card border border-border p-6 rounded-lg text-left inline-block max-w-2xl w-full mt-8 shadow-sm">
          <p className="font-mono text-sm text-muted-foreground mb-2">1. The URL says the Job ID is:</p>
          <p className="font-bold mb-6 break-all">{jobId || "UNDEFINED (Folder name is still wrong!)"}</p>
          
          <p className="font-mono text-sm text-muted-foreground mb-2">2. Your logged-in User ID is:</p>
          <p className="font-bold break-all">{session.user.id}</p>
        </div>
      </div>
    );
  }

  const dbCategories = await db.select().from(categories);

  return (
    <EditProjectClient 
      job={jobResult[0]} 
      dbCategories={dbCategories} 
    />
  );
}