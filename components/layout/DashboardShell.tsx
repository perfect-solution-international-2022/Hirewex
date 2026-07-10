"use client";

import { ReactNode, useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "next-auth/react";
import { LogOut, ArrowRightLeft, Bell } from "lucide-react";
import Link from "next/link";
import Pusher from "pusher-js";
import { getNotifications, deleteNotifications } from "@/app/actions/notifications";
import { toast } from "sonner";

function timeAgo(dateString: string) {
  const seconds = Math.round((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

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

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [notifList, setNotifList] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    getNotifications().then((res) => {
      if (res.success) {
        setNotifList(res.data);
        setUnreadCount(res.data.filter((n: any) => !n.read).length);
      }
    });
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`user-${session.user.id}`);
    channel.bind("notification", (data: any) => {
      setNotifList((prev) => [{ ...data, read: 0, createdAt: new Date().toISOString() }, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast(data.title, {
        description: data.body,
        action: data.link ? { label: "View", onClick: () => window.location.href = data.link } : undefined,
      });
    });
    return () => { pusher.unsubscribe(`user-${session.user.id}`); pusher.disconnect(); };
  }, [session?.user?.id]);

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
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-transparent hover:text-foreground" onClick={() => { localStorage.setItem("hirewex_mode", "buying"); window.location.href = "/"; }}>
                        <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />Switch to Buying
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-transparent hover:text-foreground" onClick={() => { localStorage.setItem("hirewex_mode", "selling"); window.location.href = "/freelancer"; }}>
                        <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />Switch to Selling
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />

                {/* Notification bell */}
                <DropdownMenu
                  open={bellOpen}
                  onOpenChange={(open) => {
                    setBellOpen(open);
                    if (open) {
                      setHasViewed(true);
                    } else if (hasViewed && notifList.length > 0) {
                      const ids = notifList.map((n) => n.id);
                      setNotifList([]);
                      setUnreadCount(0);
                      setHasViewed(false);
                      deleteNotifications(ids);
                    }
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <button className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground font-bold">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-0">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                      <span className="text-sm font-bold text-foreground">Notifications</span>
                      {notifList.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">Clears when closed</span>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
                          <Bell className="h-8 w-8 text-muted-foreground/20" />
                          <p className="text-xs text-muted-foreground">No notifications yet</p>
                        </div>
                      ) : (
                        notifList.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => {
                              setNotifList((prev) => prev.filter((n) => n.id !== notif.id));
                              setUnreadCount((prev) => Math.max(0, prev - (notif.read ? 0 : 1)));
                              deleteNotifications([notif.id]);
                              if (notif.link) window.location.href = notif.link;
                            }}
                            className={`w-full text-left px-4 py-3 border-b border-border/30 last:border-0 hover:bg-muted/50 transition-colors flex items-start gap-3 ${!notif.read ? "bg-primary/5" : ""}`}
                          >
                            <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${!notif.read ? "bg-primary" : "bg-transparent"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground line-clamp-1">{notif.title}</p>
                              {notif.body && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.body}</p>}
                              <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(notif.createdAt)}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <span className="hidden text-sm text-muted-foreground md:inline">
                  {user?.email}
                </span>
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