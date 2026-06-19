"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Briefcase, Clock, DollarSign, CheckCircle2,
  MessageCircle, PartyPopper, Calendar
} from "lucide-react";

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

export function HiredJobsClient({ hiredJobs }: { hiredJobs: any[] }) {
  if (hiredJobs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hired Jobs</h1>
          <p className="text-muted-foreground mt-1">Projects you've been hired for will appear here.</p>
        </div>
        <Card className="border-dashed border-2 bg-transparent py-20 text-center">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <div className="h-16 w-16 bg-primary/10 flex items-center justify-center rounded-full">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">No hires yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Once a buyer accepts one of your proposals, the project will show up here.
            </p>
            <Button asChild className="mt-2">
              <Link href="/jobs">Browse Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hired Jobs</h1>
          <p className="text-muted-foreground mt-1">Projects you've been hired for.</p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1 w-fit">
          {hiredJobs.length} active {hiredJobs.length === 1 ? "hire" : "hires"}
        </Badge>
      </div>

      <div className="grid gap-4">
        {hiredJobs.map(({ bid, job, buyer, category }) => {
          const buyerName = buyer?.displayName || buyer?.name || "Client";
          const buyerAvatar = buyer?.avatarUrl || buyer?.image || "";

          return (
            <Card key={bid.id} className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-900/5 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200">
                        <PartyPopper className="h-3 w-3" /> Hired
                      </span>
                      {category?.name && (
                        <span className="text-[10px] uppercase tracking-wider font-semibold bg-muted px-2 py-0.5 rounded text-muted-foreground">
                          {category.name}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-foreground">{job.title}</h3>

                    {/* Client info */}
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={buyerAvatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {buyerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        Client: <span className="font-medium text-foreground">{buyerName}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-bold text-foreground">
                        <DollarSign className="h-3.5 w-3.5" /> ${Number(bid.amount).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> {bid.deliveryDays} {bid.deliveryDays === 1 ? "day" : "days"} delivery
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> Hired {formatDate(bid.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-2 w-full md:w-auto items-center mt-4 md:mt-0">
                    <Button variant="outline" className="flex-1 md:flex-none" asChild>
                      <Link href={`/jobs/${job.id}`}>
                        <Briefcase className="h-4 w-4 mr-1.5" /> Job Details
                      </Link>
                    </Button>
                    <Button className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                      <Link href={`/chat`}>
                        <MessageCircle className="h-4 w-4 mr-1.5" /> Message Client
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
