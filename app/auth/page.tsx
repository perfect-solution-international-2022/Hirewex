'use client';

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Logo } from "@/components/Logo";
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Mail, RotateCcw } from "lucide-react";
import { registerUser, verifyEmailPin, resendVerificationPin } from "@/app/actions/auth";

// ── PIN digit input ────────────────────────────────────────────────────────────
function PinInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6);
    onChange(cleaned);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        placeholder="______"
        autoFocus
        className="w-full max-w-xs h-14 rounded-xl border-2 border-border bg-muted text-center text-3xl font-bold tracking-[0.5em] outline-none transition-all placeholder:text-border focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <p className="text-xs text-muted-foreground">{value.length}/6 digits entered</p>
    </div>
  );
}

// ── PIN verification screen ────────────────────────────────────────────────────
function VerifyScreen({
  email,
  password,
  onBack,
}: {
  email: string;
  password: string;
  onBack: () => void;
}) {
  const [pin, setPin]           = useState("");
  const [busy, setBusy]         = useState(false);
  const [resending, setResend]  = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage]   = useState<{ type: "error" | "success"; text: string } | null>(null);

  // countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleVerify() {
    if (pin.length < 6) { setMessage({ type: "error", text: "Enter all 6 digits." }); return; }
    setBusy(true);
    setMessage(null);

    const result = await verifyEmailPin(email, pin);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      setPin("");
      setBusy(false);
      return;
    }

    // Email verified — sign in automatically
    setMessage({ type: "success", text: "Email verified! Signing you in…" });
    const signInResult = await signIn("credentials", { email, password, redirect: false });
    if (signInResult?.ok) {
      window.location.href = "/";
    } else {
      setMessage({ type: "error", text: "Verified but sign-in failed. Please sign in manually." });
      setBusy(false);
    }
  }

  async function handleResend() {
    setResend(true);
    setMessage(null);
    const result = await resendVerificationPin(email);
    setResend(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "A new code has been sent to your email." });
      setPin("");
      setCooldown(60);
    }
  }

  return (
    <div className="space-y-6">
      {/* Icon */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Check your email</h2>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium ${
          message.type === "error"
            ? "border-red-500/20 bg-red-500/10 text-red-600"
            : "border-green-500/20 bg-green-500/10 text-green-600"
        }`}>
          {message.type === "error"
            ? <AlertCircle className="h-4 w-4 shrink-0" />
            : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* PIN entry */}
      <PinInput value={pin} onChange={setPin} disabled={busy} />

      {/* Verify button */}
      <Button
        className="w-full"
        disabled={busy || pin.length < 6}
        onClick={handleVerify}
      >
        {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : "Verify Email"}
      </Button>

      {/* Resend + back */}
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
          disabled={busy}
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0 || busy}
          className="flex items-center gap-1.5 text-primary hover:underline disabled:opacity-50 disabled:no-underline"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending…" : "Resend code"}
        </button>
      </div>
    </div>
  );
}

// ── Main auth content ──────────────────────────────────────────────────────────
function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const modeParam = searchParams?.get("mode");
  const roleParam = searchParams?.get("role");

  const { data: session, status } = useSession();
  const loading = status === "loading";

  const [tab, setTab] = useState<"signin" | "signup">(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("mode");
      return p === "signup" ? "signup" : "signin";
    }
    return modeParam === "signup" ? "signup" : "signin";
  });
  const [role, setRole] = useState<"freelancer" | "buyer">(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("role");
      return p === "buyer" ? "buyer" : "freelancer";
    }
    return roleParam === "buyer" ? "buyer" : "freelancer";
  });

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName]                 = useState("");
  const [busy, setBusy]                 = useState(false);
  const [authMessage, setAuthMessage]   = useState<{ type: "error" | "success"; text: string } | null>(null);

  // When set, show PIN verification screen instead of the tabs
  const [verifyState, setVerifyState]   = useState<{ email: string; password: string } | null>(null);

  useEffect(() => { document.title = "Welcome — Hirewex"; }, []);
  useEffect(() => {
    if (!loading && session?.user) router.push("/");
  }, [session, loading, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setAuthMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    setBusy(true);
    setAuthMessage(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("role", role);

    const result = await registerUser(formData);

    if (result.error) {
      setAuthMessage({ type: "error", text: result.error });
      setBusy(false);
    } else if (result.pendingVerification) {
      // Show PIN screen — keep password in memory for auto-login after verify
      setVerifyState({ email: result.email!, password });
      setBusy(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setAuthMessage(null);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setAuthMessage({ type: "error", text: "Invalid email or password, or email not yet verified." });
        setBusy(false);
      } else if (result?.ok) {
        window.location.href = "/";
      }
    } catch {
      setAuthMessage({ type: "error", text: "Something went wrong. Please try again." });
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setAuthMessage(null);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setAuthMessage({ type: "error", text: "Google sign in failed." });
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

        <Logo />

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold leading-tight tracking-tight">
              Build the career<br />or business<br />you want.
            </h2>
            <p className="text-lg text-muted-foreground max-w-sm">
              Hirewex is built for serious freelancers and discerning buyers. Real work, real pay, real reviews.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[{ value: "10K+", label: "Freelancers" }, { value: "5K+", label: "Projects done" }, { value: "98%", label: "Satisfaction" }].map(({ value, label }) => (
              <div key={label} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {["Secure escrow", "Verified freelancers", "Real reviews", "24/7 support"].map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium">
                <CheckCircle2 className="h-3 w-3 text-primary" /> {b}
              </span>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted-foreground relative z-10">© {new Date().getFullYear()} Hirewex</p>
      </div>

      {/* Right panel */}
      <div className="flex min-h-screen lg:min-h-0 items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md p-6 sm:p-8">
          <div className="lg:hidden mb-6 flex justify-center"><Logo /></div>

          {/* ── PIN verification screen ── */}
          {verifyState ? (
            <VerifyScreen
              email={verifyState.email}
              password={verifyState.password}
              onBack={() => { setVerifyState(null); setAuthMessage(null); }}
            />
          ) : (
            <>
              {authMessage && (
                <div className={`mb-6 flex items-center gap-2 rounded-lg border p-3 text-sm font-medium ${
                  authMessage.type === "error"
                    ? "border-red-500/20 bg-red-500/10 text-red-600"
                    : "border-green-500/20 bg-green-500/10 text-green-600"
                }`}>
                  {authMessage.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  {authMessage.text}
                </div>
              )}

              <Tabs value={tab} onValueChange={(v) => {
                setTab(v as any);
                setEmail(""); setPassword(""); setConfirmPassword(""); setName("");
                setAuthMessage(null);
              }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin" disabled={busy}>Sign in</TabsTrigger>
                  <TabsTrigger value="signup" disabled={busy}>Create account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-6 space-y-4">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <Field label="Email" type="email" value={email} onChange={setEmail} disabled={busy} />
                    <Field label="Password" type="password" value={password} onChange={setPassword} disabled={busy} />
                    <Button className="w-full" disabled={busy}>
                      {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : "Sign in"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-6 space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <Field label="Full name" value={name} onChange={setName} disabled={busy} />
                    <Field label="Email" type="email" value={email} onChange={setEmail} disabled={busy} />
                    <Field label="Password" type="password" value={password} onChange={setPassword} disabled={busy} />
                    <Field label="Confirm Password" type="password" value={confirmPassword} onChange={setConfirmPassword} disabled={busy} />
                    <Button className="w-full" disabled={busy}>
                      {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…</> : "Create account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <AuthContent />
    </Suspense>
  );
}

function Field({ label, type = "text", value, onChange, disabled }: { label: string; type?: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";
  const inputType = isPasswordField ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required
          className={isPasswordField ? "pr-10" : ""}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div>;
}
