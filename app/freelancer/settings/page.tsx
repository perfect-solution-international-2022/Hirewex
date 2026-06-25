"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { freelancerNav } from "@/lib/nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import {
  User, Bell, Shield, Palette, LogOut, ChevronRight,
  Mail, Calendar, CheckCircle2, BellOff, BellRing, Banknote,
  FileText, Star, ExternalLink,
} from "lucide-react";

const NOTIF_KEY = "hirewex_notif_prefs";

const defaultPrefs = {
  newBid: true,
  bidAccepted: true,
  newMessage: true,
  orderUpdate: true,
  reviewReceived: true,
  withdrawalStatus: true,
};

type NotifPrefs = typeof defaultPrefs;

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-bold text-foreground leading-none">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function FreelancerSettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(defaultPrefs);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIF_KEY);
      if (stored) setNotifPrefs({ ...defaultPrefs, ...JSON.parse(stored) });
    } catch {}
  }, []);

  const updatePref = (key: keyof NotifPrefs, value: boolean) => {
    const next = { ...notifPrefs, [key]: value };
    setNotifPrefs(next);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt as string).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : null;

  const notifItems: { key: keyof NotifPrefs; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: "newBid", label: "New bid on your job", desc: "When someone bids on a job you posted", icon: <FileText className="h-4 w-4" /> },
    { key: "bidAccepted", label: "Bid accepted", desc: "When a buyer accepts one of your proposals", icon: <CheckCircle2 className="h-4 w-4" /> },
    { key: "newMessage", label: "New message", desc: "When you receive a chat message", icon: <Mail className="h-4 w-4" /> },
    { key: "orderUpdate", label: "Order updates", desc: "Status changes on your service orders", icon: <BellRing className="h-4 w-4" /> },
    { key: "reviewReceived", label: "New review", desc: "When a client leaves you a review", icon: <Star className="h-4 w-4" /> },
    { key: "withdrawalStatus", label: "Withdrawal status", desc: "Updates on your withdrawal requests", icon: <Banknote className="h-4 w-4" /> },
  ];

  return (
    <DashboardShell title="Settings" role="freelancer">
      <div className="mx-auto max-w-2xl space-y-6">

        {saved && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-lg animate-in slide-in-from-top-4">
            <CheckCircle2 className="h-4 w-4" /> Preferences saved
          </div>
        )}

        {/* Account info */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <SectionHeader icon={<User className="h-5 w-5" />} title="Account" subtitle="Your account details" />
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <div>
                  <p className="text-xs text-muted-foreground">Display name</p>
                  <p className="text-sm font-medium">{user?.name || "—"}</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/settings/profile" className="flex items-center gap-1 text-xs text-primary">
                    Edit <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <div>
                  <p className="text-xs text-muted-foreground">Email address</p>
                  <p className="text-sm font-medium">{user?.email || "—"}</p>
                </div>
                <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">Read-only</span>
              </div>
              {memberSince && (
                <div className="flex items-center gap-2 py-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Member since <span className="font-medium text-foreground">{memberSince}</span></p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <SectionHeader icon={<Palette className="h-5 w-5" />} title="Appearance" subtitle="Customise how Hirewex looks" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Notification preferences */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <SectionHeader
              icon={<Bell className="h-5 w-5" />}
              title="Notifications"
              subtitle="Choose what you want to be notified about"
            />
            <div className="space-y-4">
              {notifItems.map(({ key, label, desc, icon }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">{icon}</div>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <Toggle checked={notifPrefs[key]} onChange={(v) => updatePref(key, v)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <SectionHeader icon={<Shield className="h-5 w-5" />} title="Profile & Payments" subtitle="Manage your public profile and payout details" />
            <div className="space-y-1">
              {[
                { href: "/settings/profile", label: "Edit profile & bio", desc: "Update your name, title, location and about section" },
                { href: "/settings/profile#bank", label: "Bank account / payout", desc: "Add or update your bank details for withdrawals" },
                { href: "/freelancer/reviews", label: "My reviews", desc: "See all reviews left by your clients" },
                { href: "/freelancer/withdraw", label: "Withdraw earnings", desc: "Request a payout to your bank account" },
              ].map(({ href, label, desc }) => (
                <Link key={href} href={href} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                  <div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sign out */}
        <Card className="border-destructive/30 shadow-sm">
          <CardContent className="p-6">
            <SectionHeader icon={<LogOut className="h-5 w-5 text-destructive" />} title="Sign out" subtitle="End your current session" />
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive hover:text-white"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign out of Hirewex
            </Button>
          </CardContent>
        </Card>

      </div>
    </DashboardShell>
  );
}
