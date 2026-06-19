"use client";

import { useState, useTransition } from "react";
import { approveKyc, rejectKyc } from "@/app/actions/admin-kyc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  User,
  Calendar,
  Phone,
  Globe,
  MapPin,
  Hash,
  ZoomIn,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

interface KycManagerProps {
  initialApplications: any[];
}

// Small helper so the table reads "3 days ago" instead of a raw date —
// the full timestamp is still available on hover via the title attribute.
function formatRelativeTime(input: string | Date) {
  const date = new Date(input);
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

// A labeled field with an icon — used so the detail panels can be scanned
// at a glance rather than read line by line.
function DetailRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof User;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-2.5 ${className ?? ""}`}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
      <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground/70">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}

// A document/selfie preview with a consistent frame and a "view full size"
// affordance on hover instead of a bare overlay label.
function DocumentImage({ label, url }: { label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="group block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
        <img
          src={url}
          alt={label}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/0 text-white opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100">
          <ZoomIn className="h-4 w-4" />
          <span className="text-sm font-medium">View full size</span>
        </div>
      </div>
    </a>
  );
}

export function KycManager({ initialApplications }: KycManagerProps) {
  const [isPending, startTransition] = useTransition();

  // State for the modal
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleApprove = () => {
    if (!selectedApp) return;
    startTransition(async () => {
      try {
        await approveKyc(selectedApp.app.id, selectedApp.app.userId);
        toast.success("User Approved", { description: `${selectedApp.app.legalName} has been verified.` });
        setSelectedApp(null);
      } catch (err: any) {
        toast.error("Approval Failed", { description: err.message });
      }
    });
  };

  const handleReject = () => {
    if (!selectedApp) return;
    if (!rejectReason.trim()) {
      toast.error("Reason Required", { description: "You must provide a reason for rejection." });
      return;
    }

    startTransition(async () => {
      try {
        await rejectKyc(selectedApp.app.id, selectedApp.app.userId, rejectReason);
        toast.success("User Rejected", { description: "The user has been notified and their documents deleted." });
        setSelectedApp(null);
        setShowRejectInput(false);
        setRejectReason("");
      } catch (err: any) {
        toast.error("Rejection Failed", { description: err.message });
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b py-4">
        <div>
          <CardTitle className="text-base font-semibold">Pending Applications</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review identity documents before granting verified status.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 rounded-full px-3 font-medium">
          {initialApplications.length} pending
        </Badge>
      </CardHeader>

      <CardContent className="p-0">
        <div className="w-full overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="h-10 px-4 text-[11px] font-semibold uppercase tracking-wide">Applicant</th>
                <th className="h-10 px-4 text-[11px] font-semibold uppercase tracking-wide">Document</th>
                <th className="h-10 px-4 text-[11px] font-semibold uppercase tracking-wide">Submitted</th>
                <th className="h-10 px-4 text-[11px] font-semibold uppercase tracking-wide text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {initialApplications.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <CheckCircle2 className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="font-medium text-foreground">All caught up</p>
                    <p className="text-sm text-muted-foreground">No pending KYC applications right now.</p>
                  </td>
                </tr>
              ) : (
                initialApplications.map((data) => (
                  <tr key={data.app.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                          {getInitials(data.app.legalName)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium leading-tight">{data.app.legalName}</span>
                          <span className="text-xs text-muted-foreground leading-tight">
                            {data.user?.email || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="capitalize">
                        {data.app.documentType.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      <span
                        className="flex items-center gap-2"
                        title={new Date(data.app.submittedAt).toLocaleString()}
                      >
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(data.app.submittedAt)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => {
                          setSelectedApp(data);
                          setShowRejectInput(false);
                          setRejectReason("");
                        }}
                      >
                        Review
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* --- REVIEW MODAL --- */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Identity Application</DialogTitle>
            <DialogDescription>Verify that the document matches the user's selfie and information.</DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">

              {/* Left Column: User Data & Actions */}
              <div className="space-y-6 lg:border-r lg:pr-6">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" /> Personal Details
                  </h3>
                  <div className="bg-muted/30 p-4 rounded-lg grid grid-cols-2 gap-4">
                    <DetailRow icon={User} label="Legal Name" value={selectedApp.app.legalName} className="col-span-2" />
                    <DetailRow icon={Calendar} label="Date of Birth" value={new Date(selectedApp.app.dob).toLocaleDateString()} />
                    <DetailRow icon={Phone} label="Phone" value={selectedApp.app.phoneNumber} />
                    <DetailRow icon={Globe} label="Country" value={selectedApp.app.country} />
                    <DetailRow icon={MapPin} label="Address" value={selectedApp.app.fullAddress} className="col-span-2" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Document Info
                  </h3>
                  <div className="bg-muted/30 p-4 rounded-lg grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <span className="text-[11px] uppercase tracking-wide text-muted-foreground/70 block mb-1">Type</span>
                      <Badge variant="outline" className="capitalize">
                        {selectedApp.app.documentType.replace("_", " ")}
                      </Badge>
                    </div>
                    <DetailRow icon={Hash} label="Number" value={selectedApp.app.documentNumber} className="col-span-2" />
                  </div>
                </div>

                {/* Actions Section */}
                <div className="pt-4 border-t space-y-3">
                  {!showRejectInput ? (
                    <>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove} disabled={isPending}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approve User
                      </Button>
                      <Button variant="destructive" className="w-full" onClick={() => setShowRejectInput(true)} disabled={isPending}>
                        <XCircle className="mr-2 h-4 w-4" /> Reject Application
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                      <Textarea
                        placeholder="Reason for rejection (e.g. Blurry photo, mismatched name...)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="resize-none"
                        disabled={isPending}
                      />
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setShowRejectInput(false)} className="flex-1" disabled={isPending}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={isPending} className="flex-1">Confirm Reject</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Document Images */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DocumentImage label="Front of ID" url={selectedApp.app.frontIdUrl} />
                  <DocumentImage label="Liveness Selfie" url={selectedApp.app.selfieUrl} />
                  {selectedApp.app.backIdUrl && (
                    <div className="md:col-span-2 max-w-sm">
                      <DocumentImage label="Back of ID" url={selectedApp.app.backIdUrl} />
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
