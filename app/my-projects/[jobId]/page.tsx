import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { jobs } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader"; 
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, Clock, Users, Pencil } from "lucide-react"; // Swapped ArrowRight for Pencil
import { DeleteJobButton } from "@/components/DeleteJobButton";
import { ThemeProvider } from "@/components/ThemeProvider";

export const dynamic = "force-dynamic";

export default async function MyProjectsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth?mode=signin");
  }

  const myJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.buyerId, session.user.id))
    .orderBy(desc(jobs.createdAt));

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col bg-muted/10">
        <SiteHeader />

        <main className="container mx-auto flex-1 px-4 py-12 max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Posted Projects</h1>
              <p className="text-muted-foreground mt-1">Manage the jobs you've posted and review incoming bids.</p>
            </div>
            <Button asChild>
              <Link href="/post-projects">
                <Plus className="mr-2 h-4 w-4" /> Post New Project
              </Link>
            </Button>
          </div>

          {myJobs.length === 0 ? (
            <Card className="border-dashed border-2 bg-transparent py-20 text-center">
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-16 w-16 bg-primary/10 text-primary flex items-center justify-center rounded-full mb-4">
                  <Briefcase className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">You haven't posted any projects yet</h3>
                <p className="mt-2 text-muted-foreground max-w-sm mx-auto mb-6">
                  Ready to hire? Post your first project to start receiving bids from top freelancers.
                </p>
                <Button asChild size="lg">
                  <Link href="/post-projects">Post a Project Now</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myJobs.map((job) => (
                <Card key={job.id} className="group transition-all hover:border-primary/50 hover:shadow-md bg-card">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      
                      {/* Project Details */}
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold">{job.title}</h3>
                          
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            job.status === 'open' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900' : 
                            job.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900' :
                            'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                          }`}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1).replace('_', ' ')}
                          </span>
                          
                          {(job as any).category && (
                            <span className="text-[10px] uppercase tracking-wider font-semibold">
                              {(job as any).category}
                            </span>
                          )}
                        </div>

                       {(job as any).skills && (
                          <div className="flex flex-wrap gap-2">
                            {((job as any).skills).split(",").map((skill: any, idx: number) => (
                              <span key={idx} className="text-xs bg-primary/5 text-primary px-2 py-1 rounded border border-primary/10">
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1.5" />
                            Posted {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-md">
                            <Users className="h-3.5 w-3.5 mr-1.5" />
                            Review Bids
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 gap-2 w-full md:w-auto items-center mt-4 md:mt-0">
                        <Button variant="outline" className="flex-1 md:flex-none" asChild>
                          <Link href={`/jobs/${job.id}`}>View</Link>
                        </Button>
                        
                        {/* --- EDITED BUTTON --- */}
                        <Button className="flex-1 md:flex-none" asChild>
                          <Link href={`/my-projects/${job.id}/edit`}>
                            Edit <Pencil className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>

                        <DeleteJobButton jobId={job.id} />
                      </div>

                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        <SiteFooter />
      </div>
    </ThemeProvider>
  );
}