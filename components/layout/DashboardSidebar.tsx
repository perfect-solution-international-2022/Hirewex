"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// ALL NAV IMPORTS HAPPEN HERE IN THE CLIENT COMPONENT
import { freelancerNav, adminNav, buyerNav } from "@/lib/nav"; 
import { 
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, 
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, 
  SidebarMenuItem, SidebarHeader, SidebarFooter 
} from "@/components/ui/sidebar";
import { Logo } from "@/components/Logo";

export function DashboardSidebar({ role }: { role: "admin" | "freelancer" | "buyer" }) {
  const pathname = usePathname();

  // Pick the correct nav locally based on the role
  const groups = role === "admin" ? adminNav : role === "buyer" ? buyerNav : freelancerNav;

  // Set the logo link based on role
  const logoHref = role === "admin" ? "/admin" : role === "buyer" ? "/dashboard" : "/freelancer";

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
                  const Icon = item.icon; // This works flawlessly now
                  const isActive = pathname === item.url;
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url}>
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
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