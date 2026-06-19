"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Clock, RefreshCw, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createOrGetConversation } from "@/app/actions/chat"; 

type Tier = "basic" | "standard" | "premium";

const TIER_LABELS: Record<Tier, { label: string; highlight: boolean }> = {
  basic:    { label: "Basic",    highlight: false },
  standard: { label: "Standard", highlight: true  },
  premium:  { label: "Premium",  highlight: false },
};

export function PricingSidebar({ 
  packages, 
  freelancerId,
  serviceId,
  isOwner 
}: { 
  packages: any; 
  freelancerId: string;
  serviceId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tier>("standard");
  const currentPackage = packages[activeTab];

  const handleAuthRedirect = (e: React.MouseEvent<HTMLButtonElement>, callback?: () => void) => {
    if (!session?.user) {
      e.preventDefault();
      router.push("/auth");
    } else if (callback) {
      callback();
    }
  };

  return (
    <div className="sticky top-24 rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">

      <div className="grid grid-cols-3 border-b border-border/60">
        {(["basic", "standard", "premium"] as Tier[]).map((tier) => {
          const active = activeTab === tier;
          const { label, highlight } = TIER_LABELS[tier];
          return (
            <button
              key={tier}
              onClick={() => setActiveTab(tier)}
              className={`relative py-3.5 text-xs font-bold uppercase tracking-wide transition-colors
                ${active
                  ? "text-primary bg-primary/5 border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:bg-muted/30"
                }
              `}
            >
              {label}
              {highlight && !active && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-5 flex flex-col gap-5">

        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className="text-3xl font-bold text-foreground tracking-tight">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(Number(currentPackage.price))}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted px-2 py-1 rounded-md">
              {currentPackage.name}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            {currentPackage.description}
          </p>
        </div>

        <div className="space-y-2.5 py-4 border-t border-border/50">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">What&apos;s included</p>
          {currentPackage.features.map((feature: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-2.5 w-2.5 text-primary" />
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5 border-t border-border/50 pt-4">
          <Button 
            size="lg" 
            className="w-full font-bold group"
            onClick={(e) => handleAuthRedirect(e, () => {
              // <-- FIXED: Force hard redirect so NextJS routing doesn't get confused
              window.location.href = `/checkout/${serviceId}?tier=${activeTab}`;
            })}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          
          {!isOwner && (
            <form action={createOrGetConversation.bind(null, freelancerId, "seller", serviceId, "service")}>
              <Button 
                type="submit" 
                onClick={(e) => handleAuthRedirect(e)}
                className="w-full bg-slate-900 text-white border border-slate-700 hover:bg-slate-800 hover:border-slate-600 h-12 font-semibold rounded-lg shadow-sm transition-all"
              >
                Message freelancer
              </Button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          Secure payment · money-back guarantee
        </div>

      </div>
    </div>
  );
}