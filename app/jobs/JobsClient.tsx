"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown } from "lucide-react";
import Image from "next/image";

// Time formatter
function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function JobsClient({ initialJobs }: { initialJobs: any[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev => 
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  };

  const handleBidClick = (e: React.MouseEvent<HTMLButtonElement>, jobId: string) => {
    if (!session?.user) {
      e.preventDefault();
      router.push("/auth");
    } else {
      router.push(`/jobs/${jobId}`);
    }
  };

  // --- DYNAMIC CATEGORY EXTRACTION ---
  const categoriesList = useMemo(() => {
    const counts: Record<string, number> = {};
    
    initialJobs.forEach((item) => {
      const jobData = item.job || item; 
      const categoryData = item.category || jobData.category; 
      
      const catName = categoryData?.name || jobData.categoryId || "Uncategorized";
      counts[catName] = (counts[catName] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [initialJobs]);

  // --- DYNAMIC COUNTS FOR SKILLS & SCOPE ---
  const filterCounts = useMemo(() => {
    const skills: Record<string, number> = { "Pro Level": 0, "Expert": 0, "Intermediate": 0, "Entry": 0 };
    const scopes: Record<string, number> = { "Large": 0, "Medium": 0, "Small": 0 };

    initialJobs.forEach((item) => {
      const jobData = item.job || item;
      if (jobData.skillLevel && skills[jobData.skillLevel] !== undefined) skills[jobData.skillLevel]++;
      if (jobData.projectScope && scopes[jobData.projectScope] !== undefined) scopes[jobData.projectScope]++;
    });

    return { skills, scopes };
  }, [initialJobs]);

  // --- FILTERING LOGIC ---
  const filteredJobs = useMemo(() => {
    return initialJobs.filter((item) => {
      const jobData = item.job || item;
      const categoryData = item.category || jobData.category;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = jobData.title?.toLowerCase().includes(q);
        const matchDesc = jobData.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      if (selectedCategory !== "All") {
        const catName = categoryData?.name || jobData.categoryId || "Uncategorized";
        if (catName !== selectedCategory) return false;
      }

      if (minBudget) {
        if (!jobData.budgetMin || Number(jobData.budgetMin) < Number(minBudget)) return false;
      }

      if (maxBudget) {
        if (!jobData.budgetMax || Number(jobData.budgetMax) > Number(maxBudget)) return false;
      }

      if (selectedSkills.length > 0) {
        if (!jobData.skillLevel || !selectedSkills.includes(jobData.skillLevel)) return false;
      }

      if (selectedScopes.length > 0) {
        if (!jobData.projectScope || !selectedScopes.includes(jobData.projectScope)) return false;
      }

      return true;
    });
  }, [initialJobs, searchQuery, selectedCategory, minBudget, maxBudget, selectedSkills, selectedScopes]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* ================= LEFT SIDEBAR (FILTERS) ================= */}
      <aside className="w-full lg:w-64 shrink-0 space-y-8">
        
        {/* Budget Filter */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center justify-between">
            Budget <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </h3>
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Min" 
              className="h-9 bg-background" 
              type="number" 
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input 
              placeholder="Max" 
              className="h-9 bg-background" 
              type="number" 
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Filter */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center justify-between">
            Categories <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </h3>
          <div className="space-y-2.5">
            <div 
              onClick={() => setSelectedCategory("All")}
              className={`flex items-center justify-between text-sm cursor-pointer transition-colors ${selectedCategory === "All" ? "text-green-600 font-bold" : "text-muted-foreground hover:text-foreground"}`}
            >
              <span>All</span>
              <span>({initialJobs.length})</span>
            </div>
            
            {categoriesList.map((cat) => (
              <div 
                key={cat.name} 
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center justify-between text-sm cursor-pointer transition-colors ${selectedCategory === cat.name ? "text-green-600 font-bold" : "text-muted-foreground hover:text-foreground"}`}
              >
                <span className="truncate pr-2">{cat.name}</span>
                <span className="shrink-0">({cat.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Level Filter */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center justify-between">
            Skill Level <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </h3>
          <div className="space-y-3">
            {["Pro Level", "Expert", "Intermediate", "Entry"].map((level) => (
              <label key={level} className="flex items-center justify-between text-sm text-muted-foreground cursor-pointer group">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    checked={selectedSkills.includes(level)}
                    onChange={() => toggleSkill(level)} 
                  />
                  <span className="group-hover:text-foreground transition-colors">{level}</span>
                </div>
                <span>({filterCounts.skills[level] || 0})</span>
              </label>
            ))}
          </div>
        </div>

        {/* Project Scope Filter */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center justify-between">
            Project Scope <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </h3>
          <div className="space-y-3">
            {["Large", "Medium", "Small"].map((scope) => (
              <label key={scope} className="flex items-center justify-between text-sm text-muted-foreground cursor-pointer group">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    checked={selectedScopes.includes(scope)}
                    onChange={() => toggleScope(scope)} 
                  />
                  <span className="group-hover:text-foreground transition-colors">{scope}</span>
                </div>
                <span>({filterCounts.scopes[scope] || 0})</span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* ================= RIGHT MAIN CONTENT ================= */}
      <div className="flex-1 space-y-6">
        
        {/* Top Search Bar */}
        <div className="relative w-full shadow-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Type job keyword" 
            className="pl-10 h-12 bg-card border-border/60 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Job Feed */}
        <div className="bg-card border border-border/60 rounded-xl overflow-hidden divide-y divide-border/60 shadow-sm">
          
          {/* EMPTY STATE */}
          {filteredJobs.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="bg-muted h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No jobs match your criteria</h3>
              <p className="text-muted-foreground">
                We couldn&apos;t find any jobs available with these filters. Try clearing your search or adjusting the budget.
              </p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => {
                  setSearchQuery("");
                  setMinBudget("");
                  setMaxBudget("");
                  setSelectedCategory("All");
                  setSelectedSkills([]); 
                  setSelectedScopes([]); 
                }}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            filteredJobs.map((item) => {
              const jobData = item.job || item;

              // --- EXTRACT POSTER INFO ---
              const poster = item.user || jobData.user || item.author || jobData.author || {};
              const posterName = poster.name || "Anonymous Client";
              const posterPic = poster.avatarUrl || poster.image || null;

              // Safe JSON Parsing for skills
              let skillsArray: string[] = [];
              if (typeof jobData.skills === 'string') {
                try {
                  const parsed = JSON.parse(jobData.skills);
                  skillsArray = Array.isArray(parsed) ? parsed : jobData.skills.split(',').map((s: string) => s.trim());
                } catch {
                  skillsArray = jobData.skills.split(',').map((s: string) => s.trim());
                }
              } else if (Array.isArray(jobData.skills)) {
                skillsArray = jobData.skills;
              }

              // Determine Budget Display
              const budgetText = jobData.budgetMin 
                ? `$${Number(jobData.budgetMin).toLocaleString()} USD` 
                : "Negotiable";

              return (
                <div key={jobData.id} className="p-6 sm:p-8 hover:bg-muted/10 transition-colors">
                  
                  {/* --- USER INFO ROW --- */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shrink-0 border border-border/50">
                      {posterPic ? (
                        <Image src={posterPic} alt={posterName} width={24} height={24} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-primary">
                          {posterName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground">{posterName}</span>
                  </div>
                  
                  {/* Title & Bid Button Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
                    <Link href={`/jobs/${jobData.id}`} className="text-xl sm:text-2xl font-bold hover:text-primary transition-colors text-foreground">
                      {jobData.title}
                    </Link>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 shrink-0 shadow-sm"
                      onClick={(e) => handleBidClick(e, jobData.id)}
                    >
                      Bid Now
                    </Button>
                  </div>

                  {/* Meta Info Row */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
                    <p>Posted {timeAgo(jobData.createdAt)}</p>
                    <p>Bids: {jobData.bidCount || 0}</p>
                  </div>

                  {/* Budget & Level Row */}
                  <div className="flex items-start gap-12 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Budget
                      </p>
                      <p className="font-bold text-foreground">
                        {jobData.budgetMin && jobData.budgetMax ? `$${Number(jobData.budgetMin).toLocaleString()} - $${Number(jobData.budgetMax).toLocaleString()}` : budgetText}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Experience level</p>
                      <p className="font-bold text-foreground">{jobData.skillLevel || "Not specified"}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-3 whitespace-pre-wrap">
                    {jobData.description}
                  </p>

                  {/* Skills Badges */}
                  <div className="flex flex-wrap gap-2">
                    {skillsArray.filter(Boolean).map((s) => (
                      <Badge 
                        key={s} 
                        variant="secondary" 
                        className="bg-muted text-muted-foreground font-medium hover:bg-muted/80 rounded-full px-3 py-1 text-xs"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}