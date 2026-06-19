'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";

type Role = "admin" | "freelancer" | "buyer";

interface RequireAuthProps {
  children: ReactNode;
  role?: Role;
}

export function RequireAuth({ children, role }: RequireAuthProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const loading = status === "loading";
  const user = session?.user;
  const roles = session?.user?.roles || [];

  useEffect(() => {
    if (loading) return;

    // 1. If not logged in, kick them to the auth screen
    if (!user) {
      router.replace("/auth");
      return;
    }

    // 2. STRICT CHECK: Only restrict access if the page requires 'admin'
    if (role === "admin" && !roles.includes("admin")) {
      router.replace("/"); // Kick non-admins back to the homepage
    }
    
    // NOTE: We no longer check for "buyer" or "freelancer" roles explicitly. 
    // If they are logged in, they are allowed to view both dashboards!

  }, [user, roles, loading, role, router]);

  if (loading || !user || (role === "admin" && !roles.includes("admin"))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Checking authentication...
      </div>
    );
  }

  return <>{children}</>;
}