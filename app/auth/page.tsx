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
import { toast } from "sonner";
import { Briefcase, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react"; 
import { registerUser } from "@/app/actions/auth";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const modeParam = searchParams.get("mode");
  const roleParam = searchParams.get("role");

  const { data: session, status } = useSession();
  const loading = status === "loading";

  const [tab, setTab] = useState<"signin" | "signup">(
    modeParam === "signup" ? "signup" : "signin"
  );
  
  const [role, setRole] = useState<"freelancer" | "buyer">(
    roleParam === "buyer" ? "buyer" : "freelancer"
  );
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // <-- ADDED state
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  
  const [authMessage, setAuthMessage] = useState<{ type: "error" | "success", text: string } | null>(null);

  useEffect(() => {
    document.title = "Welcome — Hirewex";
  }, []);

  useEffect(() => {
    if (!loading && session?.user) {
      router.push("/");
    }
  }, [session, loading, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // <-- ADDED: Password match validation
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
    } else {
      setAuthMessage({ type: "success", text: "Account created! Logging you in..." });
      
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setBusy(false);
        setTab("signin"); 
      } else {
        window.location.href = "/";
      }
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setAuthMessage(null); 

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, 
      });

      if (result?.error) {
        setAuthMessage({ type: "error", text: "Invalid email or password." });
        setBusy(false);
      } else if (result?.ok) {
        setAuthMessage({ type: "success", text: "Welcome back!" });
        window.location.href = "/"; 
      }
    } catch (error) {
      setAuthMessage({ type: "error", text: "Something went wrong. Please try again." });
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setAuthMessage(null);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (err: any) { 
      setAuthMessage({ type: "error", text: "Google sign in failed." });
      setBusy(false); 
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left panel — full height, only shown on desktop */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        {/* Decorative blobs */}
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

          {/* Social proof stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "10K+", label: "Freelancers" },
              { value: "5K+", label: "Projects done" },
              { value: "98%", label: "Satisfaction" },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Trust badges */}
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

      {/* Right panel — card centred in remaining space */}
      <div className="flex min-h-screen lg:min-h-0 items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md p-8">
          <div className="lg:hidden mb-6 flex justify-center"><Logo /></div>
          
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
            setEmail("");
            setPassword("");
            setConfirmPassword(""); // <-- ADDED: clear confirm password on tab switch
            setName("");
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
                  {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : "Sign in"}
                </Button>
              </form>
              <Divider />
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
                {busy && tab === "signin" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Continue with Google
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="mt-6 space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <Field label="Full name" value={name} onChange={setName} disabled={busy} />
                <Field label="Email" type="email" value={email} onChange={setEmail} disabled={busy} />
                <Field label="Password" type="password" value={password} onChange={setPassword} disabled={busy} />
                {/* <-- ADDED: Confirm Password field --> */}
                <Field label="Confirm Password" type="password" value={confirmPassword} onChange={setConfirmPassword} disabled={busy} />
                <Button className="w-full" disabled={busy}>
                  {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : "Create account"}
                </Button>
              </form>
              <Divider />
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
                Continue with Google
              </Button>
            </TabsContent>
          </Tabs>
        </Card>
      </div>  {/* end right panel */}
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