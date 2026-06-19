"use client";

import React, { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createServiceAction } from "@/app/actions/services";
import { 
  Loader2, AlertCircle, Plus, X, Package, 
  CheckCircle2, Crown, Star, LayoutGrid, Info,
  ImagePlus, Trash2
} from "lucide-react";

const CATEGORIES = [
  "Web Development", "Mobile App Development", "Design & Creative",
  "Writing & Translation", "Sales & Marketing", "Video & Animation",
  "Data Science & Analytics", "AI & Machine Learning", "Music & Audio",
  "Admin & Customer Support", "Legal"
];

type Tier = "basic" | "standard" | "premium";

const countWords = (text: string) => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

const MAX_IMAGES = 5;

export default function NewFreelanceProjectPage() {
  const router = useRouter();
  const { status } = useSession();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [packages, setPackages] = useState({
    basic: { name: "Basic", description: "", price: "", features: [""] },
    standard: { name: "Standard", description: "", price: "", features: [""] },
    premium: { name: "Premium", description: "", price: "", features: [""] },
  });

  if (status === "unauthenticated") {
    router.push("/auth?mode=signin");
    return null;
  }

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...toAdd]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageRemove = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // --- UPDATED: Handle commas for prices ---
  const handlePackageChange = (tier: Tier, field: string, value: string) => {
    let finalValue = value;

    if (field === "price") {
      // Remove all non-digits first
      const rawValue = value.replace(/\D/g, "");
      // Format with commas
      finalValue = rawValue ? Number(rawValue).toLocaleString("en-US") : "";
    }

    setPackages((prev) => ({
      ...prev,
      [tier]: { ...prev[tier], [field]: finalValue },
    }));
  };

  const updateFeature = (tier: Tier, index: number, value: string) => {
    const newFeatures = [...packages[tier].features];
    newFeatures[index] = value;
    handlePackageChange(tier, "features", newFeatures as any);
  };

  const addFeature = (tier: Tier) => {
    handlePackageChange(tier, "features", [...packages[tier].features, ""] as any);
  };

  const removeFeature = (tier: Tier, index: number) => {
    const newFeatures = packages[tier].features.filter((_, i) => i !== index);
    handlePackageChange(tier, "features", newFeatures as any);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;

    if (!title?.trim() || !category || !description?.trim()) {
      return setErrorMsg("Please fill out all general information fields (Title, Category, and Description).");
    }

    const descWords = countWords(description);
    if (descWords < 15 || descWords > 200) {
      return setErrorMsg(`Main description must be between 15 and 200 words. You currently have ${descWords} words.`);
    }

    const tiers: Tier[] = ["basic", "standard", "premium"];
    for (const tier of tiers) {
      const pkg = packages[tier];
      
      if (!pkg.description.trim() || !pkg.price || pkg.features.some(f => !f.trim())) {
        return setErrorMsg(`Please ensure all fields and features are filled out for the ${pkg.name} package.`);
      }

      const shortDescWords = countWords(pkg.description);
      if (shortDescWords < 2 || shortDescWords > 10) {
        return setErrorMsg(`${pkg.name} short description must be 2-10 words. Currently: ${shortDescWords} words.`);
      }
    }

    // Remove commas to validate the numbers mathematically
    const basicPrice = parseFloat(packages.basic.price.replace(/,/g, ""));
    const stdPrice = parseFloat(packages.standard.price.replace(/,/g, ""));
    const premPrice = parseFloat(packages.premium.price.replace(/,/g, ""));

    if (stdPrice < basicPrice) {
      return setErrorMsg("Standard price cannot be lower than the Basic price.");
    }
    if (premPrice < stdPrice || premPrice < basicPrice) {
      return setErrorMsg("Premium price cannot be lower than the Standard price.");
    }

    // Clean out the commas before sending to the backend
    const cleanPackages = {
      basic: { ...packages.basic, price: basicPrice.toString() },
      standard: { ...packages.standard, price: stdPrice.toString() },
      premium: { ...packages.premium, price: premPrice.toString() },
    };

    formData.append("packages", JSON.stringify(cleanPackages));
    images.forEach((img) => formData.append("images", img.file));

    startTransition(async () => {
      const result = await createServiceAction(formData);
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => router.push("/freelancer/projects"), 2000);
      } else {
        setErrorMsg(result.error || "Failed to create project.");
      }
    });
  };

  const handleSaveDraft = () => {
    console.log("Save draft", packages);
  };

  return (
    <DashboardShell title="Create Project" role="freelancer">
      <div className="mx-auto w-full max-w-6xl pb-8">
        
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-foreground">Create a New Service</h1>
            <p className="text-sm text-muted-foreground">Set up your service packages and start earning.</p>
          </div>
        </div>

        {isSuccess ? (
          <Card className="bg-card border-green-500/20 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 bg-green-500/10 text-green-500 flex items-center justify-center rounded-full mb-3">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold">Your service has been submitted for review</h2>
              <p className="text-sm text-muted-foreground mt-1">Redirecting to your dashboard...</p>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* General Info Card */}
            <Card className="bg-card border-border/50">
              <CardHeader className="py-3 border-b border-border/40">
                <CardTitle className="flex items-center gap-2 text-base">
                  <LayoutGrid className="h-4 w-4 text-primary" /> General Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-sm font-semibold">Service Title</Label>
                    <Input name="title" placeholder="I will build a modern e-commerce website..." disabled={isPending} className="h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Category</Label>
                    <select 
                      name="category" 
                      defaultValue="" 
                      disabled={isPending}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="" disabled>Select a category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Detailed Description</Label>
                    <span className="text-xs text-muted-foreground">15 - 200 words</span>
                  </div>
                  <textarea
                    name="description"
                    disabled={isPending}
                    placeholder="Describe exactly what makes your service great, your process, and what the buyer will receive..."
                    className="min-h-[90px] w-full rounded-md border border-input bg-background p-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                {/* ── Service Images ── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Service Images</Label>
                    <span className="text-xs text-muted-foreground">{images.length} / {MAX_IMAGES}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                      >
                        <img
                          src={img.preview}
                          alt={`Service image ${idx + 1}`}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-[10px] font-bold text-white">
                          {idx + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleImageRemove(idx)}
                          disabled={isPending}
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {images.length < MAX_IMAGES && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => fileInputRef.current?.click()}
                        className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary disabled:pointer-events-none disabled:opacity-50"
                      >
                        <ImagePlus className="h-6 w-6 transition-transform group-hover:scale-110" />
                        <span className="text-[11px] font-medium">Add Image</span>
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleImageAdd}
                  />

                  <p className="text-xs text-muted-foreground">
                    Upload up to {MAX_IMAGES} images (PNG, JPG, WEBP). First image will be used as the thumbnail.
                  </p>
                </div>

              </CardContent>
            </Card>

            {/* Pricing Tiers Grid */}
            <div>
              <h2 className="text-base font-bold mb-3">Package Pricing</h2>
              <div className="grid gap-4 lg:grid-cols-3">
                <TierCard 
                  tier="basic" title="Basic" icon={<Package className="h-4 w-4 text-slate-500" />} colorClass="border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30"
                  data={packages.basic} isPending={isPending} updateFeature={updateFeature} addFeature={addFeature} removeFeature={removeFeature} handlePackageChange={handlePackageChange}
                />
                <TierCard 
                  tier="standard" title="Standard" icon={<Star className="h-4 w-4 text-blue-500" />} colorClass="border-blue-200 bg-blue-50/30 ring-1 ring-blue-500/20 relative shadow-md dark:border-blue-900 dark:bg-blue-950/20"
                  data={packages.standard} isPending={isPending} updateFeature={updateFeature} addFeature={addFeature} removeFeature={removeFeature} handlePackageChange={handlePackageChange}
                  badge="Most Popular"
                />
                <TierCard 
                  tier="premium" title="Premium" icon={<Crown className="h-4 w-4 text-amber-500" />} colorClass="border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/20"
                  data={packages.premium} isPending={isPending} updateFeature={updateFeature} addFeature={addFeature} removeFeature={removeFeature} handlePackageChange={handlePackageChange}
                />
              </div>
            </div>

            {/* ACTION BAR */}
            <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
              
              {errorMsg && (
                <div className="animate-in fade-in slide-in-from-bottom-2 flex items-center justify-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 py-2.5 px-4 rounded-md border border-red-200 dark:border-red-900 shadow-sm w-full">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 w-full flex-wrap">
                <div className="flex items-start gap-2 text-xs text-muted-foreground max-w-md">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Your service will be reviewed and published instantly. You can edit prices and packages anytime from your dashboard.</span>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>Cancel</Button>
                  <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={isPending}>Save Draft</Button>
                  <Button type="submit" size="lg" disabled={isPending} className="px-8 shadow-md">
                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : "Publish Service"}
                  </Button>
                </div>
              </div>
            </div>

          </form>
        )}
      </div>
    </DashboardShell>
  );
}

function TierCard({ tier, title, icon, colorClass, badge, data, isPending, updateFeature, addFeature, removeFeature, handlePackageChange }: any) {
  return (
    <Card className={`overflow-hidden transition-all ${colorClass}`}>
      {badge && <div className="bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider text-center py-1">{badge}</div>}
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="flex items-center gap-2 text-base">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Short Description</Label>
            <span className="text-[10px] text-muted-foreground">2-10 words</span>
          </div>
          <textarea 
            value={data.description} onChange={(e) => handlePackageChange(tier, "description", e.target.value)}
            disabled={isPending} placeholder={`Briefly describe the ${title} tier...`} className="min-h-[56px] w-full rounded-md border bg-background p-2 text-sm focus:ring-1 focus:ring-primary outline-none resize-none" 
          />
        </div>

        <div className="space-y-1">
          {/* UPDATED: Changed label to USD */}
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Price (USD)</Label>
          <div className="relative">
            {/* UPDATED: Changed prefix to $ */}
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">$</span>
            {/* UPDATED: Changed to type="text" and adjusted padding (pl-7) to allow commas */}
            <Input type="text" disabled={isPending} className="pl-7 h-10 font-bold" placeholder="0" value={data.price} onChange={(e) => handlePackageChange(tier, "price", e.target.value)} />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border/50">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Included Features</Label>
          {data.features.map((feat: string, index: number) => (
            <div key={index} className="flex gap-1.5 items-center">
              <Input 
                value={feat} onChange={(e) => updateFeature(tier, index, e.target.value)}
                disabled={isPending} placeholder="e.g. 3 Revisions" className="h-8 text-sm" 
              />
              {data.features.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={() => removeFeature(tier, index)} disabled={isPending}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="w-full text-xs h-8 border-dashed bg-transparent" onClick={() => addFeature(tier)} disabled={isPending}>
            <Plus className="mr-1 h-3 w-3" /> Add Feature
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}