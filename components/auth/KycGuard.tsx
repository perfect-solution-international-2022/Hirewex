"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Clock, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface KycGuardProps {
  children: React.ReactNode;
  kycStatus: "unverified" | "pending" | "approved" | "rejected";
}

export function KycGuard({ children, kycStatus }: KycGuardProps) {
  const router = useRouter();

  // If approved, render the page normally
  if (kycStatus === "approved") {
    return <>{children}</>;
  }

  // Otherwise, render the blurred background and the popup
  return (
    <div className="relative min-h-screen">
      {/* Blurred background (the actual page content rendered underneath) */}
      <div className="pointer-events-none blur-md select-none opacity-40">
        {children}
      </div>

      {/* The Popup Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              {kycStatus === "pending" ? (
                <Clock className="h-8 w-8 text-primary animate-pulse" />
              ) : (
                <ShieldAlert className="h-8 w-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {kycStatus === "pending" ? "Verification Pending" : "Activate Your Account"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            
            {kycStatus === "unverified" && (
              <>
                <p className="text-muted-foreground">
                  To keep our marketplace safe and secure, all new users must verify their identity before buying or selling services.
                </p>
                <div className="flex flex-col gap-3">
                  <Button size="lg" className="w-full" onClick={() => router.push("/verify-identity")}>
                    Start Verification
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => signOut({ callbackUrl: "/" })}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </Button>
                </div>
              </>
            )}

            {kycStatus === "pending" && (
              <>
                <p className="text-muted-foreground">
                  Your identity documents have been submitted and are currently being reviewed by our team. This usually takes less than 24 hours.
                </p>
                <div className="p-4 bg-muted/50 rounded-lg text-sm border border-dashed">
                  Please wait for an email confirmation, or check back here later.
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              </>
            )}

            {kycStatus === "rejected" && (
              <>
                <p className="text-destructive font-medium">
                  Your previous verification attempt was rejected.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please ensure your documents are clear, readable, and match your registered details.
                </p>
                <div className="flex flex-col gap-3 mt-4">
                  <Button size="lg" className="w-full" onClick={() => router.push("/verify-identity")}>
                    Try Again
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => signOut({ callbackUrl: "/" })}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </Button>
                </div>
              </>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}