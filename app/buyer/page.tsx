'use client';

import { useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Briefcase, FileText, PlusCircle, Wallet, ArrowDownToLine, Receipt, LifeBuoy, MessagesSquare, User, Users, ShieldCheck } from "lucide-react";

const groups = [
  { label: "Hire", items: [
    { title: "Dashboard", url: "/buyer", icon: Briefcase },
    { title: "My Jobs", url: "/buyer/jobs", icon: Briefcase },
    { title: "Post a Job", url: "/buyer/jobs/new", icon: PlusCircle },
    { title: "All Bids", url: "/buyer/bids", icon: FileText },
    { title: "Projects", url: "/buyer/projects", icon: Briefcase },
    { title: "Find Talent", url: "/buyer/talent", icon: Users },
  ]},
  { label: "Money", items: [
    { title: "Deposit", url: "/buyer/deposit", icon: Wallet },
    { title: "Withdraw", url: "/buyer/withdraw", icon: ArrowDownToLine },
    { title: "Transactions", url: "/buyer/transactions", icon: Receipt },
  ]},
  { label: "Account", items: [
    { title: "Chat", url: "/buyer/chat", icon: MessagesSquare },
    { title: "Support", url: "/buyer/support", icon: LifeBuoy },
    { title: "Verification", url: "/buyer/verification", icon: ShieldCheck },
    { title: "Profile", url: "/buyer/profile", icon: User },
  ]},
];

export default function BuyerDashboardPage() {
  // Safe client-side document head title handling for Next.js
  useEffect(() => {
    document.title = "Buyer Dashboard — Hirewex";
  }, []);

  return (
    <DashboardShell title="Buyer" role="buyer" groups={groups}>
      <div className="grid gap-4 md:grid-cols-4">
        {[["Open jobs","0"],["Active projects","0"],["Bids received","0"],["Spent","$0"]].map(([l,v]) => (
          <Card key={l} className="p-5">
            <p className="text-2xl font-bold text-primary">{v}</p>
            <p className="text-sm text-muted-foreground">{l}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6 p-8 text-center text-muted-foreground">
        Welcome, hiring made simple. Post jobs, review bids, fund projects with escrow, and chat with your freelancers — all in one place.
      </Card>
    </DashboardShell>
  );
}