import { db } from "@/lib/db";
import {
  freelancerServices, serviceOrders, bids, projects,
  profiles, users, freelancerSkills, jobs,
} from "@/drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { aliasedTable } from "drizzle-orm";
import FreelancerDashboardClient from "./DashboardClient";

export const metadata = { title: "Freelancer Dashboard — Hirewex" };

function monthLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", { month: "short" });
}

export default async function FreelancerDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const uid = session.user.id;

  const buyerAlias = aliasedTable(users, "buyer");

  // Run all queries in parallel
  const [
    services,
    profile,
    paidOrders,
    activeBids,
    activeProjects,
    freelancerReviews,
  ] = await Promise.all([
    // Service status breakdown
    db.select({ status: freelancerServices.status })
      .from(freelancerServices)
      .where(eq(freelancerServices.freelancerId, uid)),

    // Profile for rating
    db.select({ rating: profiles.rating, totalReviews: profiles.totalReviews })
      .from(profiles)
      .where(eq(profiles.id, uid))
      .limit(1),

    // All paid service orders (for earnings + recent activity)
    db.select({
      id:          serviceOrders.id,
      price:       serviceOrders.price,
      createdAt:   serviceOrders.createdAt,
      tier:        serviceOrders.tier,
      serviceId:   serviceOrders.serviceId,
      buyerName:   buyerAlias.displayName,
      buyerFallback: buyerAlias.name,
      serviceTitle: freelancerServices.title,
    })
      .from(serviceOrders)
      .innerJoin(buyerAlias, eq(serviceOrders.buyerId, buyerAlias.id))
      .innerJoin(freelancerServices, eq(serviceOrders.serviceId, freelancerServices.id))
      .where(and(
        eq(serviceOrders.freelancerId, uid),
        eq(serviceOrders.status, "paid"),
      ))
      .orderBy(desc(serviceOrders.createdAt))
      .limit(50),

    // Pending bids count
    db.select({ id: bids.id })
      .from(bids)
      .where(and(eq(bids.freelancerId, uid), eq(bids.status, "pending"))),

    // Active projects (hired jobs)
    db.select({
      id:        projects.id,
      amount:    projects.amount,
      status:    projects.status,
      createdAt: projects.createdAt,
      jobTitle:  jobs.title,
      deadline:  jobs.deadline,
      buyerName: buyerAlias.displayName,
      buyerFallback: buyerAlias.name,
    })
      .from(projects)
      .innerJoin(jobs, eq(projects.jobId, jobs.id))
      .innerJoin(buyerAlias, eq(projects.buyerId, buyerAlias.id))
      .where(eq(projects.freelancerId, uid))
      .orderBy(desc(projects.createdAt))
      .limit(20),

    // Recent reviews received
    db.select({ rating: profiles.rating, totalReviews: profiles.totalReviews })
      .from(profiles)
      .where(eq(profiles.id, uid))
      .limit(1),
  ]);

  /* ── Service status pie ── */
  const statusCounts = { approved: 0, pending: 0, requires_modification: 0, denied: 0 };
  services.forEach((s) => {
    if (s.status && s.status in statusCounts) statusCounts[s.status as keyof typeof statusCounts]++;
  });
  const projectStatusData = [
    { name: "Active",    value: statusCounts.approved,              color: "#10b981" },
    { name: "Pending",   value: statusCounts.pending,               color: "#f59e0b" },
    { name: "Needs Mod", value: statusCounts.requires_modification, color: "#3b82f6" },
    { name: "Denied",    value: statusCounts.denied,                color: "#ef4444" },
  ].filter((d) => d.value > 0);
  if (projectStatusData.length === 0) {
    projectStatusData.push({ name: "No Services", value: 1, color: "#cbd5e1" });
  }

  /* ── Total earnings ── */
  const totalEarnings = paidOrders.reduce((s, o) => s + Number(o.price), 0);

  /* ── Monthly earnings (last 6 months) ── */
  const now = new Date();
  const months: { month: string; earnings: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.toLocaleString("en-US", { month: "short" }), earnings: 0 });
  }
  paidOrders.forEach((o) => {
    const label = monthLabel(o.createdAt);
    const slot = months.find((m) => m.month === label);
    if (slot) slot.earnings += Number(o.price);
  });

  /* ── Orders per day this week (Mon–Sun) ── */
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekActivity = dayNames.map((day) => ({ day, orders: 0, revenue: 0 }));
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  paidOrders.forEach((o) => {
    const d = new Date(o.createdAt);
    if (d >= monday) {
      const idx = (d.getDay() + 6) % 7; // Mon=0
      weekActivity[idx].orders++;
      weekActivity[idx].revenue += Number(o.price);
    }
  });

  /* ── Recent activity: combine orders + projects ── */
  type ActivityItem = {
    id: string; title: string; client: string; status: string; amount: string; date: string;
  };
  const recentActivity: ActivityItem[] = [
    ...paidOrders.slice(0, 5).map((o) => ({
      id:     o.id,
      title:  o.serviceTitle ?? "Service order",
      client: o.buyerName || o.buyerFallback || "Client",
      status: "completed",
      amount: `USD ${Number(o.price).toLocaleString()}`,
      date:   o.createdAt,
    })),
    ...activeProjects.slice(0, 5).map((p) => ({
      id:     p.id,
      title:  p.jobTitle ?? "Project",
      client: p.buyerName || p.buyerFallback || "Client",
      status: p.status === "completed" ? "completed" : p.status === "submitted" ? "in_progress" : p.status === "active" ? "in_progress" : "pending",
      amount: `USD ${Number(p.amount).toLocaleString()}`,
      date:   p.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map((item) => ({
      ...item,
      date: formatRelative(item.date),
    }));

  /* ── Upcoming deadlines: active projects with job deadline ── */
  const upcomingDeadlines = activeProjects
    .filter((p) => p.status === "active" || p.status === "submitted")
    .slice(0, 3)
    .map((p) => ({
      id:     p.id,
      title:  p.jobTitle ?? "Project work",
      client: p.buyerName || p.buyerFallback || "Client",
      due:    p.deadline ? formatDeadline(p.deadline) : "No deadline set",
    }));

  const profileData = profile[0] ?? null;
  const rating      = profileData?.rating ? Number(profileData.rating).toFixed(1) : null;
  const reviewCount = profileData?.totalReviews ?? 0;

  return (
    <FreelancerDashboardClient
      projectStatusData={projectStatusData}
      totalEarnings={totalEarnings}
      activeBidCount={activeBids.length}
      rating={rating}
      reviewCount={reviewCount}
      monthlyEarnings={months}
      weekActivity={weekActivity}
      recentActivity={recentActivity}
      upcomingDeadlines={upcomingDeadlines}
    />
  );
}

function formatRelative(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7)   return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDeadline(dateStr: string) {
  const d     = new Date(dateStr);
  const now   = new Date();
  const diff  = d.getTime() - now.getTime();
  const days  = Math.ceil(diff / 86400000);
  if (days < 0)  return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7)  return `In ${days} days`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
