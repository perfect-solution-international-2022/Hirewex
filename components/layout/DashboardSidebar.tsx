"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { freelancerNav, adminNav, buyerNav } from "@/lib/nav";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarHeader, SidebarFooter
} from "@/components/ui/sidebar";
import { Logo } from "@/components/Logo";

export function DashboardSidebar({ role }: { role: "admin" | "freelancer" | "buyer" }) {
  const pathname = usePathname();
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    async function fetchBadges() {
      try {
        const res = await fetch("/api/nav-badges");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setBadges(data.badges ?? {});
      } catch {}
    }

    fetchBadges();
    const interval = setInterval(fetchBadges, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const groups = role === "admin" ? adminNav : role === "buyer" ? buyerNav : freelancerNav;
  const logoHref = role === "admin" ? "/admin" : "/";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Logo href={logoHref} />
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.url;
                  const badgeCount = badges[item.url] ?? 0;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url} className="flex items-center justify-between w-full">
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.title}</span>
                          </span>
                          {badgeCount > 0 && (
                            <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1.5 shrink-0">
                              {badgeCount > 99 ? "99+" : badgeCount}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Hirewex
      </SidebarFooter>
    </Sidebar>
  );
}
