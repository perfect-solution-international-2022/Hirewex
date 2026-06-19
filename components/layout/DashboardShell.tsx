"use client";

import { ReactNode, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react"; 
import { LogOut, ArrowRightLeft } from "lucide-react";
import Link from "next/link";

export function DashboardShell({ 
  title, 
  role, 
  children 
}: { 
  title: string; 
  role: "admin" | "freelancer" | "buyer"; 
  children: ReactNode 
}) {
  const { data: session } = useSession();
  const user = session?.user;
  
  // State to control the sign-out modal
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  return (
    <RequireAuth role={role}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full relative">
          
          {/* ONLY pass the role string down */}
          <DashboardSidebar role={role} />
          
          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
              
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <h1 className="font-display text-lg font-semibold">{title}</h1>
                
                {role !== "admin" && (
                  <div className="hidden md:flex ml-4 border-l border-border/60 pl-4">
                    {role === "freelancer" ? (
                      <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:bg-transparent hover:text-foreground">
                        <Link href="/"><ArrowRightLeft className="mr-2 h-3.5 w-3.5" />Switch to Client</Link>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:bg-transparent hover:text-foreground">
                        <Link href="/freelancer"><ArrowRightLeft className="mr-2 h-3.5 w-3.5" />Switch to Freelancer</Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <span className="hidden text-sm text-muted-foreground md:inline">
                  {user?.email}
                </span>
                {/* Changed onClick to open the modal instead of instantly signing out */}
                <Button size="sm" variant="ghost" onClick={() => setShowSignOutModal(true)}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              
            </header>
            <main className="flex-1 p-6">{children}</main>
          </div>

          {/* Sign out modal */}
          {showSignOutModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300 ease-in-out">
              <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-6 shadow-xl sm:max-w-md animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                    <LogOut className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-foreground">Ready to leave?</h3>
                  <p className="mb-8 text-sm text-muted-foreground">
                    Are you sure you want to sign out of your account? You will need to log back in to access your dashboard.
                  </p>
                  <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowSignOutModal(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" className="w-full sm:w-auto" onClick={() => signOut({ callbackUrl: "/" })}>
                      Sign out
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </SidebarProvider>
    </RequireAuth>
  );
}