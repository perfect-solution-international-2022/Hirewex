"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type AppRole = "admin" | "freelancer" | "buyer";

type User = {
  id: string;
  email: string;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  role: AppRole | null;
  roles: string[]; // Added to satisfy SiteHeader's array check!
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Creating a default local mock buyer session so you can preview everything
  const [user, setUser] = useState<User | null>({
    id: "local-dev-id",
    email: "dev@hirewex.local",
  });
  const [role, setRole] = useState<AppRole | null>("buyer");
  const [roles, setRoles] = useState<string[]>(["buyer"]); // Providing the array expected by .includes()
  const [loading, setLoading] = useState(false);

  const signOut = async () => {
    setUser(null);
    setRole(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider value={{ user, loading, role, roles, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}