"use client";

import Link from "next/link";
import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postJobAction } from "@/app/actions/jobs";
import { 
  Loader2, AlertCircle, Briefcase, FileText, 
  CheckCircle2, LayoutGrid, X, Calendar, Coins 
} from "lucide-react";

type Category = {
  id: string;
  name: string;
};

export default function PostProjectClient({ dbCategories }: { dbCategories: Category[] }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isPending, startTransition] = useTransition();
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const formatted = rawValue ? Number(rawValue).toLocaleString("en-US") : "";
    setter(formatted);
  };

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        setErrorMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const addSkill = () => {
    if (skillInput.trim() && skills.length < 5) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?mode=signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    
    const formData = new FormData(e.currentTarget);
    formData.append("skills", skills.join(","));

    formData.set("budgetMin", minBudget.replace(/,/g, ""));
    formData.set("budgetMax", maxBudget.replace(/,/g, ""));

    startTransition(async () => {
      const result = await postJobAction(formData);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg(result.error || "Something went wrong.");
      }
    });
  };

  return (
    <div className="flex flex-col">
      <main className="container mx-auto flex-1 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Tell us what you need done</h1>
          <p className="mt-2 text-muted-foreground">
            Provide specific details about your project to attract the best freelancers on Hirewex.
          </p>
        </div>

        {isSuccess ? (
          <Card className="border-border/50 bg-card shadow-sm max-w-2xl mx-auto mt-12">
            <CardContent className="p-6 sm:p-10">
              <div className="flex min-h-[300px] flex-col items-center justify-center text-center animate-in zoom-in-95">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold">Project Posted!</h2>
                <p className="mt-2 text-muted-foreground">Your project is now live for freelancers to bid on.</p>
                
                <div className="mt-8 flex flex-col gap-3 w-full max-w-sm">
                  <Button asChild className="w-full">
                    <Link href="/my-projects">View your added projects</Link>
                  </Button>
                  <Button variant="ghost" onClick={() => setIsSuccess(false)}>
                    Post another project
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LEFT COLUMN: Main Project Details (Spans 8 columns on large screens) */}
              <div className="lg:col-span-8 space-y-6">
                
                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-6 sm:p-8 space-y-6">
                    {/* Title */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-base font-semibold">
                        <Briefcase className="h-4 w-4 text-primary" /> Project Title <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input 
                        name="title" 
                        placeholder="e.g. Build a responsive WordPress e-commerce site" 
                        className="h-11"
                        required 
                        disabled={isPending}
                      />
                      <p className="text-xs text-muted-foreground">A clear title helps you get better proposals.</p>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-base font-semibold">
                        <FileText className="h-4 w-4 text-primary" /> Description <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <textarea 
                        name="description" 
                        placeholder="Describe your project requirements, goals, and any specific skills needed..." 
                        className="min-h-[220px] w-full rounded-md border border-input bg-background px-3 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        required
                        disabled={isPending}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Skills Card */}
                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-6 sm:p-8 space-y-4">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">
                        Required Skills <span className="text-xs font-normal text-muted-foreground">(Max 5)</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input 
                          value={skillInput} 
                          onChange={(e) => setSkillInput(e.target.value)}
                          placeholder="Add a skill (e.g. React)"
                          disabled={skills.length >= 5 || isPending}
                          className="h-11"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSkill();
                            }
                          }}
                        />
                        <Button type="button" onClick={addSkill} disabled={skills.length >= 5 || isPending} className="h-11 px-8">
                          Add
                        </Button>
                      </div>
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {skills.map((skill, index) => (
                            <span
                              key={index}
                              className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full text-sm font-medium"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => removeSkill(index)}
                                className="hover:text-red-500 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div> 
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT COLUMN: Settings, Budget, and Submit (Spans 4 columns on large screens) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Configuration Card */}
                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-6 space-y-6">
                    {/* Category */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-base font-semibold">
                        <LayoutGrid className="h-4 w-4 text-primary" /> Category <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <select 
                        name="categoryId" 
                        required
                        defaultValue=""
                        disabled={isPending}
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="" disabled>Select a category</option>
                        {dbCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Skill Level */}
                    <div className="space-y-3">
                      <Label className="flex items-center text-sm font-semibold">
                        Job skill level <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <select 
                        name="skillLevel" 
                        required
                        defaultValue=""
                        disabled={isPending}
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="" disabled>Select a skill level</option>
                        <option value="Pro Level">Pro Level</option>
                        <option value="Expert">Expert</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Entry">Entry</option>
                      </select>
                    </div>

                    {/* Project Scope */}
                    <div className="space-y-3">
                      <Label className="flex items-center text-sm font-semibold">
                        Scope of your project work <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <select 
                        name="projectScope" 
                        required
                        defaultValue=""
                        disabled={isPending}
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="" disabled>Select project scope</option>
                        <option value="Large">Large</option>
                        <option value="Medium">Medium</option>
                        <option value="Small">Small</option>
                      </select>
                    </div>

                    {/* Deadline */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-base font-semibold">
                        <Calendar className="h-4 w-4 text-primary" /> Project Deadline <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input 
                        name="deadline" 
                        type="date" 
                        required 
                        disabled={isPending}
                        className="h-11 w-full text-foreground"
                        min={new Date().toISOString().split("T")[0]} 
                      />
                    </div>
                  </CardContent>
                </Card>

               {/* Budget Card */}
                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <Label className="flex items-center gap-2 text-base font-semibold">
                      <Coins className="h-4 w-4 text-primary" /> Estimated Budget (USD) <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Minimum</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">$</span>
                          <Input 
                            name="budgetMin" 
                            type="text"
                            placeholder="150" 
                            className="pl-7 h-11" 
                            required 
                            disabled={isPending} 
                            value={minBudget}
                            onChange={(e) => handleBudgetChange(e, setMinBudget)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Maximum</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">$</span>
                          <Input 
                            name="budgetMax" 
                            type="text"
                            placeholder="1,500" 
                            className="pl-7 h-11" 
                            required 
                            disabled={isPending}
                            value={maxBudget}
                            onChange={(e) => handleBudgetChange(e, setMaxBudget)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions / Errors */}
                <div className="flex flex-col gap-4">
                  {errorMsg && (
                    <div className="relative flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 animate-pulse" />
                      <div className="flex-1 font-medium leading-relaxed">
                        {errorMsg}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setErrorMsg(null)}
                        className="text-red-600/60 hover:text-red-600 transition-colors mt-0.5"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={isPending}>
                    {isPending ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Posting...</>
                    ) : (
                      "Post Project Now"
                    )}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full h-11" onClick={() => router.back()} disabled={isPending}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}