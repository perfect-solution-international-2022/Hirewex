"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSession, signOut } from "next-auth/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, LayoutDashboard, User as UserIcon, Briefcase, ChevronDown, MessageCircle, ShieldAlert, Users, Bell, PartyPopper, CheckCircle2 } from "lucide-react"; 
import { getProfileData } from "@/app/actions/profile"; 
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotifications } from "@/app/actions/notifications";
import { toast } from "sonner";
import Pusher from "pusher-js";

const nav = [
  { href: "/service", label: "Find Freelancers" },
  { href: "/jobs", label: "Find a Job" },
  { href: "/how-it-works", label: "How it Works" },
];

function timeAgo(dateString: string) {
  const seconds = Math.round((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

export function SiteHeader() {
  const { data: session } = useSession();
  const pathname = usePathname(); 
  const [unreadGlobal, setUnreadGlobal] = useState(0);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // --- NOTIFICATION BELL STATE ---
  const [notifList, setNotifList] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [hasViewedThisOpen, setHasViewedThisOpen] = useState(false);
  
  const roles = session?.user?.roles || [];
  const isSellingMode = pathname.startsWith("/freelancer");
  const isAdmin = roles.includes("admin");
  const logoHref = isSellingMode ? "/freelancer" : "/";

  const kycStatus = (session?.user as any)?.kycStatus || "unverified";
  const isApproved = kycStatus === "approved" || isAdmin;

  const [avatar, setAvatar] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Load notifications once on mount / login
  useEffect(() => {
    if (!session?.user?.id) return;
    getNotifications().then((res) => {
      if (res.success) {
        setNotifList(res.data);
        setUnreadNotifCount(res.data.filter((n: any) => !n.read).length);
      }
    });
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;

    getProfileData(session.user.id).then((res) => {
      if (res.success && res.data) {
        setAvatar(res.data.avatarUrl || res.data.image || null);
        setDisplayName(res.data.displayName || res.data.name || session.user.name || "User");
      }
    });

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`user-${session.user.id}`);

    // Chat messages
    channel.bind("inbox-update", (data: any) => {
      setUnreadGlobal((prev) => prev + 1);
      toast("New message", {
        description: `You received a new message from ${data.senderName || "someone"}`,
        action: {
          label: "View",
          onClick: () => window.location.href = `/chat/${data.conversationId}`,
        },
      });
    });

    // General notifications (hires, bids, etc.)
    channel.bind("notification", (data: any) => {
      setNotifList((prev) => [{ ...data, read: 0, createdAt: new Date().toISOString() }, ...prev]);
      setUnreadNotifCount((prev) => prev + 1);
      toast(data.title, {
        description: data.body,
        action: data.link ? {
          label: "View",
          onClick: () => window.location.href = data.link,
        } : undefined,
      });
    });

    return () => {
      pusher.unsubscribe(`user-${session.user.id}`);
      pusher.disconnect();
    };
  }, [session?.user?.id]);

  const handleNotifClick = async (notif: any) => {
    setNotifList((prev) => prev.filter((n) => n.id !== notif.id));
    setUnreadNotifCount((prev) => Math.max(0, prev - (notif.read ? 0 : 1)));
    deleteNotifications([notif.id]);
    if (notif.link) window.location.href = notif.link;
  };


  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Logo href={logoHref} />
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {session?.user && isApproved && (
              <DropdownMenu
                open={bellOpen}
                onOpenChange={(open) => {
                  setBellOpen(open);

                  if (open) {
                    setHasViewedThisOpen(true);
                    if (notifList.length === 0 && !isLoadingNotifs) {
                      setIsLoadingNotifs(true);
                      getNotifications().then((res) => {
                        if (res.success) {
                          setNotifList(res.data);
                          setUnreadNotifCount(res.data.filter((n: any) => !n.read).length);
                        }
                        setIsLoadingNotifs(false);
                      });
                    }
                  } else if (hasViewedThisOpen && notifList.length > 0) {
                    // Closing the dropdown after viewing — clear them out
                    const idsToClear = notifList.map((n) => n.id);
                    setNotifList([]);
                    setUnreadNotifCount(0);
                    setHasViewedThisOpen(false);
                    deleteNotifications(idsToClear);
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
                    <Bell className="h-4.5 w-4.5 text-muted-foreground" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground font-bold">
                        {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
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
                          onClick={() => handleNotifClick(notif)}
                          className={`w-full text-left px-4 py-3 border-b border-border/30 last:border-0 hover:bg-muted/50 transition-colors flex items-start gap-3 ${
                            !notif.read ? "bg-primary/5" : ""
                          }`}
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
            )}
            
            {session?.user ? (
              isApproved ? (
                <>
                  {isSellingMode ? (
                    <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex text-muted-foreground hover:bg-transparent hover:text-foreground">
                      <Link href="/">Switch to buying</Link> 
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex text-muted-foreground hover:bg-transparent hover:text-foreground">
                      <Link href="/freelancer">Switch to selling</Link>
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="ml-2 flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                        {avatar ? (
                          <img src={avatar} alt="Profile" className="h-7 w-7 rounded-full object-cover border border-border/50 bg-background" />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground border border-border/50">
                            <UserIcon className="h-4 w-4" />
                          </div>
                        )}
                        <span className="max-w-[120px] truncate">
                          {displayName || session.user.email?.split("@")[0]}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent align="end" className="w-56">
                      {isAdmin && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/admin"><LayoutDashboard className="mr-2 h-4 w-4" />Admin Dashboard</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      
                      <DropdownMenuItem asChild>
                        <Link href="/settings/profile"><UserIcon className="mr-2 h-4 w-4" />Profile</Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {/* BUYER SECTION */}
                      <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Buyer
                      </div>
                      <DropdownMenuItem asChild>
                        <Link href="/my-projects"><Briefcase className="mr-2 h-4 w-4" />My Projects</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/my-bids"><Users className="mr-2 h-4 w-4" />My Bids</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/chat" className="relative flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            <span>Chat</span>
                          </div>
                          {unreadGlobal > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                              {unreadGlobal}
                            </span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {/* FREELANCER SECTION */}
                      <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Freelancer
                      </div>
                      <DropdownMenuItem asChild>
                        <Link href="/freelancer"><UserIcon className="mr-2 h-4 w-4" />Freelancer Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/freelancer/hired"><PartyPopper className="mr-2 h-4 w-4" />Hired Jobs</Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem onClick={() => setShowSignOutModal(true)} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-3 ml-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {kycStatus === "pending" ? "Reviewing ID" : "Action Required"}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowSignOutModal(true)}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </Button>
                </div>
              )
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild><Link href="/auth">Sign in</Link></Button>
                <Button size="sm" asChild><Link href="/auth?mode=signup">Join</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Sign out modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300 ease-in-out">
          <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-6 shadow-xl sm:max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <LogOut className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">Ready to leave?</h3>
              <p className="mb-8 text-sm text-muted-foreground">
                Are you sure you want to sign out of your account? You will need to log back in to access your projects and messages.
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
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <Logo href="/" />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">The modern marketplace where buyers meet world-class freelancers.</p>
        </div>
        <FooterCol title="For Clients" links={[["Post a job","/post-projects"],["Browse talent","/talent"],["How it works","/how-it-works"]]} />
        <FooterCol title="For Freelancers" links={[["Find work","/jobs"],["Create profile","/auth"],["Success score","/how-it-works"]]} />
        <FooterCol title="Company" links={[["Blog","/blog"],["Privacy","/privacy"],["Terms","/terms"]]} />
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Hirewex. All rights reserved.</div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={href}><Link href={href} className="hover:text-foreground">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
