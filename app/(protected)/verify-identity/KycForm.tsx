"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { submitKycApplication } from "@/app/actions/kyc-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  User, MapPin, FileText, ShieldCheck,
  ChevronRight, ChevronLeft, CheckCircle2,
  UploadCloud, X, Image as ImageIcon
} from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const STEPS = [
  { id: 1, label: "Personal",   icon: User },
  { id: 2, label: "Address",    icon: MapPin },
  { id: 3, label: "Documents",  icon: FileText },
  { id: 4, label: "Review",     icon: ShieldCheck },
];

// ── Reusable field wrapper ──────────────────────────────────────────
function Field({
  label, htmlFor, required, children
}: { label: string; htmlFor?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

// ── File drop zone ──────────────────────────────────────────────────
function FileZone({
  id, name, label, required, disabled, preview, onFile
}: {
  id: string; name: string; label: string;
  required?: boolean; disabled?: boolean;
  preview: string | null; onFile: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) { onFile(null); return; }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", { description: `${file.name} exceeds 5 MB.` });
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Unsupported format", { description: "Use JPG, PNG, or WEBP." });
      return;
    }
    onFile(file);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>

      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0] ?? null);
        }}
        className={`relative group flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all cursor-pointer h-36
          ${preview
            ? "border-primary/40 bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50 bg-muted/20"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {preview ? (
          <>
            <img src={preview} alt="preview" className="h-full w-full object-cover rounded-[10px]" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFile(null); }}
              className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/90 border border-border flex items-center justify-center shadow-sm hover:bg-destructive hover:text-white hover:border-destructive transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <UploadCloud className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Drop file or click to upload</p>
              <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WEBP · max 5 MB</p>
            </div>
          </>
        )}

        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required={required}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}

// ── Review row ──────────────────────────────────────────────────────
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0 w-36">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value || "—"}</span>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────
export function KycForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);

  // Form state
  const [legalName, setLegalName]         = useState("");
  const [dob, setDob]                     = useState("");
  const [phoneNumber, setPhoneNumber]     = useState("");
  const [country, setCountry]             = useState("");
  const [fullAddress, setFullAddress]     = useState("");
  const [docType, setDocType]             = useState("passport");
  const [documentNumber, setDocumentNumber] = useState("");

  // File state
  const [frontFile, setFrontFile]   = useState<File | null>(null);
  const [backFile, setBackFile]     = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview]   = useState<string | null>(null);
  const [backPreview, setBackPreview]     = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const setFileWithPreview = (
    file: File | null,
    setFile: (f: File | null) => void,
    setPreview: (s: string | null) => void
  ) => {
    setFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  // ── Step validation ──
  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (!legalName.trim()) {
        toast.error("Full name required", { description: "Enter your legal name as it appears on your ID." });
        return false;
      }
      if (!dob) {
        toast.error("Date of birth required");
        return false;
      }
      const age = (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (age < 18) {
        toast.error("Age requirement", { description: "You must be at least 18 years old to verify." });
        return false;
      }
      if (!phoneNumber.trim()) {
        toast.error("Phone number required");
        return false;
      }
      const phoneRegex = /^\+?[\d\s\-().]{7,20}$/;
      if (!phoneRegex.test(phoneNumber)) {
        toast.error("Invalid phone number", { description: "Include country code, e.g. +94 071 123 4567." });
        return false;
      }
    }

    if (s === 2) {
      if (!country.trim()) {
        toast.error("Country required");
        return false;
      }
      if (!fullAddress.trim()) {
        toast.error("Street address required");
        return false;
      }
      if (fullAddress.trim().length < 10) {
        toast.error("Address too short", { description: "Enter your full street address including city and postcode." });
        return false;
      }
    }

    if (s === 3) {
      if (!documentNumber.trim()) {
        toast.error("Document number required");
        return false;
      }
      if (!frontFile) {
        toast.error("Front of ID required", { description: "Upload a photo of the front of your document." });
        return false;
      }
      if (docType !== "passport" && !backFile) {
        toast.error("Back of ID required", { description: "This document type requires both sides." });
        return false;
      }
      if (!selfieFile) {
        toast.error("Selfie required", { description: "Upload a clear photo of your face looking at the camera." });
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 4));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // ── Submit ──
  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("legalName", legalName);
    formData.append("dob", dob);
    formData.append("phoneNumber", phoneNumber);
    formData.append("country", country);
    formData.append("fullAddress", fullAddress);
    formData.append("documentType", docType);
    formData.append("documentNumber", documentNumber);
    if (frontFile)  formData.append("frontId", frontFile);
    if (backFile)   formData.append("backId", backFile);
    if (selfieFile) formData.append("selfie", selfieFile);

    startTransition(async () => {
      try {
        const promise = submitKycApplication(formData);
        toast.promise(promise, {
          loading: "Uploading your documents securely…",
          success: "Verification submitted — we'll review it shortly.",
          error: (err) => err.message || "Something went wrong. Please try again.",
        });
        await promise;
        router.refresh();
      } catch (err) {
        console.error("KYC upload failed", err);
      }
    });
  };

  const DOC_LABELS: Record<string, string> = {
    passport: "Passport",
    national_id: "National ID Card",
    drivers_license: "Driver's License",
  };

  return (
    <div className="space-y-8">

      {/* ── Step indicator ── */}
      <div className="flex items-center justify-between relative">
        {/* connector line */}
        <div className="absolute top-5 left-0 right-0 h-px bg-border -z-10" />
        <div
          className="absolute top-5 left-0 h-px bg-primary transition-all duration-500 -z-10"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map(({ id, label, icon: Icon }) => {
          const done    = step > id;
          const current = step === id;
          return (
            <div key={id} className="flex flex-col items-center gap-2">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-background
                ${done    ? "border-primary bg-primary text-primary-foreground"  : ""}
                ${current ? "border-primary text-primary shadow-md shadow-primary/20" : ""}
                ${!done && !current ? "border-border text-muted-foreground" : ""}
              `}>
                {done
                  ? <CheckCircle2 className="h-5 w-5" />
                  : <Icon className="h-4 w-4" />
                }
              </div>
              <span className={`text-xs font-semibold hidden sm:block transition-colors
                ${current ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}
              `}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Step panels ── */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">

        {/* Panel header */}
        <div className="px-6 py-5 border-b border-border/50 bg-muted/20">
          <h2 className="text-base font-bold text-foreground">
            {step === 1 && "Personal details"}
            {step === 2 && "Residential address"}
            {step === 3 && "Identity documents"}
            {step === 4 && "Review & submit"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {step === 1 && "Must match your government-issued ID exactly."}
            {step === 2 && "Your current residential address."}
            {step === 3 && "Upload clear, uncropped photos — no flash glare."}
            {step === 4 && "Check everything before submitting. You can't edit after."}
          </p>
        </div>

        {/* Panel body */}
        <div className="p-6 sm:p-8">

          {/* STEP 1 */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Full legal name" htmlFor="legalName" required>
                <Input
                  id="legalName" value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="John Doe" disabled={isPending}
                />
              </Field>
              <Field label="Date of birth" htmlFor="dob" required>
                <Input
                  id="dob" type="date" value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  disabled={isPending}
                  max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                />
              </Field>
              <Field label="Phone number" htmlFor="phoneNumber" required>
                <Input
                  id="phoneNumber" value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+94 071 234 5678" disabled={isPending}
                />
              </Field>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Country" htmlFor="country" required>
                <Input
                  id="country" value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Sri Lanka" disabled={isPending}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Full street address" htmlFor="fullAddress" required>
                  <Input
                    id="fullAddress" value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="123 Main St, Apt 4B, Colombo, SL 10001"
                    disabled={isPending}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Document type" required>
                  <Select disabled={isPending} value={docType} onValueChange={(v) => { setDocType(v); setBackFile(null); setBackPreview(null); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="national_id">National ID Card</SelectItem>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Document number" htmlFor="documentNumber" required>
                  <Input
                    id="documentNumber" value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="e.g. A12345678" disabled={isPending}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <FileZone
                  id="frontId" name="frontId"
                  label="Front of ID"
                  required preview={frontPreview}
                  disabled={isPending}
                  onFile={(f) => setFileWithPreview(f, setFrontFile, setFrontPreview)}
                />
                <FileZone
                  id="backId" name="backId"
                  label={`Back of ID ${docType === "passport" ? "(optional)" : ""}`}
                  required={docType !== "passport"}
                  preview={backPreview}
                  disabled={isPending || docType === "passport"}
                  onFile={(f) => setFileWithPreview(f, setBackFile, setBackPreview)}
                />
              </div>

              <div className="pt-2">
                <FileZone
                  id="selfie" name="selfie"
                  label="Selfie — face looking at camera"
                  required preview={selfiePreview}
                  disabled={isPending}
                  onFile={(f) => setFileWithPreview(f, setSelfieFile, setSelfiePreview)}
                />
              </div>
            </div>
          )}

          {/* STEP 4 — Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Personal</p>
                <div className="rounded-xl border border-border/60 bg-muted/10 px-4">
                  <ReviewRow label="Full name"      value={legalName} />
                  <ReviewRow label="Date of birth"  value={dob} />
                  <ReviewRow label="Phone"          value={phoneNumber} />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Address</p>
                <div className="rounded-xl border border-border/60 bg-muted/10 px-4">
                  <ReviewRow label="Country"        value={country} />
                  <ReviewRow label="Street address" value={fullAddress} />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Documents</p>
                <div className="rounded-xl border border-border/60 bg-muted/10 px-4">
                  <ReviewRow label="Type"            value={DOC_LABELS[docType]} />
                  <ReviewRow label="Document number" value={documentNumber} />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Uploaded files</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Front ID",  src: frontPreview },
                    { label: "Back ID",   src: backPreview },
                    { label: "Selfie",    src: selfiePreview },
                  ].map(({ label, src }) => (
                    <div key={label} className="space-y-1.5">
                      <p className="text-xs text-muted-foreground font-medium">{label}</p>
                      <div className="aspect-video rounded-lg border border-border/60 bg-muted/30 overflow-hidden flex items-center justify-center">
                        {src
                          ? <img src={src} alt={label} className="w-full h-full object-cover" />
                          : <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust note */}
              <div className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm text-muted-foreground">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p>Your documents are encrypted and stored securely. They are only used for identity verification and are never shared with third parties.</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation footer */}
        <div className="px-6 py-4 border-t border-border/50 bg-muted/10 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1 || isPending}
            className="gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>

          <span className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</span>

          {step < 4 ? (
            <Button type="button" onClick={nextStep} disabled={isPending} className="gap-1.5">
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="gap-2 min-w-36"
            >
              {isPending ? (
                <><UploadCloud className="h-4 w-4 animate-bounce" /> Submitting…</>
              ) : (
                <><ShieldCheck className="h-4 w-4" /> Submit verification</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
