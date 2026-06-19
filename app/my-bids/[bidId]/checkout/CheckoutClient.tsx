"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Briefcase, Clock, DollarSign, Star, ShieldCheck,
  ChevronLeft, FileText, MapPin, CheckCircle2,
  Lock, CreditCard
} from "lucide-react";

function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

export function CheckoutClient({ data }: { data: any }) {
  const { bid, job, category, freelancer, profile } = data;

  const name      = freelancer?.displayName || freelancer?.name || "Freelancer";
  const avatar    = profile?.avatarUrl || freelancer?.avatarUrl || freelancer?.image || "";
  const rating    = profile?.rating ? Number(profile.rating).toFixed(1) : null;
  const jobsDone  = profile?.jobsCompleted ?? 0;
  const country   = profile?.country || freelancer?.location || "Unknown";
  const headline  = profile?.headline || freelancer?.title || category?.name;

  const amount       = Number(bid.amount);
  const platformFee  = Math.round(amount * 0.05 * 100) / 100; // 5% placeholder fee
  const total         = amount + platformFee;

  return (
    <div className="space-y-6">

      {/* Back link */}
      <Link
        href="/my-bids"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Back to My Bids
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Confirm & Hire</h1>
        <p className="text-muted-foreground mt-1">Review the details below before accepting this proposal.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── LEFT: details ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Job card */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" /> Project
              </div>
              <h2 className="text-xl font-bold text-foreground">{job.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {job.description}
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-sm">
                {category?.name && (
                  <Badge variant="outline">{category.name}</Badge>
                )}
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Posted {formatDate(job.createdAt)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Freelancer card */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" /> Freelancer
              </div>

              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14 shrink-0">
                  <AvatarImage src={avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground">{name}</h3>
                  {headline && <p className="text-sm text-muted-foreground">{headline}</p>}
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {country}
                    </span>
                    {rating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {rating}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" /> {jobsDone} jobs completed
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild className="shrink-0">
                  <Link href={`/profile-preview/${freelancer?.id}`}>View Profile</Link>
                </Button>
              </div>

              {/* Bid details */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Delivery time</p>
                  <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {bid.deliveryDays} {bid.deliveryDays === 1 ? "day" : "days"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Bid submitted</p>
                  <p className="text-sm font-bold text-foreground">{formatDate(bid.createdAt)}</p>
                </div>
              </div>

              {bid.coverLetter && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">Cover letter</p>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-3 border border-border/50">
                    {bid.coverLetter}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: payment summary ── */}
        <div className="lg:sticky lg:top-24">
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Order Summary
              </h3>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Freelancer's bid</span>
                  <span className="font-medium text-foreground">${amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Service fee (5%)</span>
                  <span className="font-medium text-foreground">${platformFee.toLocaleString()}</span>
                </div>
                <div className="border-t border-border/50 pt-2.5 flex items-center justify-between">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="text-xl font-bold text-foreground">${total.toLocaleString()}</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full font-bold gap-2 h-12"
                disabled
              >
                <Lock className="h-4 w-4" />
                Pay ${total.toLocaleString()} to Accept
              </Button>

              <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your payment will be held securely until the job is completed and reviewed by you.
                </p>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
