"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ChevronDown, Star, ImageIcon } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader";

export function ServicesClient({ initialServices, currentUserId }: { initialServices: any[], currentUserId?: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // --- DYNAMIC CATEGORY EXTRACTION ---
  const categoriesList = useMemo(() => {
    const counts: Record<string, number> = {};
    initialServices.forEach(({ service }) => {
      const catName = service.category || "Uncategorized";
      counts[catName] = (counts[catName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [initialServices]);

  // --- FILTERING LOGIC ---
  const filteredServices = useMemo(() => {
    return initialServices.filter(({ service, user }) => {
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = service.title?.toLowerCase().includes(q);
        const matchUser = (user?.displayName || user?.name || "").toLowerCase().includes(q);
        if (!matchTitle && !matchUser) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== "All") {
        const catName = service.category || "Uncategorized";
        if (catName !== selectedCategory) return false;
      }

      // 3. Price Filter
      const packages = service.packages as any;
      const startingPrice = Number(packages?.basic?.price || 0);

      if (minPrice && startingPrice < Number(minPrice)) return false;
      if (maxPrice && startingPrice > Number(maxPrice)) return false;

      return true;
    });
  }, [initialServices, searchQuery, selectedCategory, minPrice, maxPrice]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      {/* UPDATED: Changed max-w-7xl to max-w-[1400px] to make it wider */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-[1400px]">
        <div className="mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">Find Services</h1>
          <p className="mt-2 text-muted-foreground">Browse top-rated services across every category.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ================= LEFT SIDEBAR (FILTERS) ================= */}
          <aside className="w-full lg:w-64 shrink-0 space-y-8">
            
            {/* Price Filter */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg flex items-center justify-between">
                Starting Price <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </h3>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Min" 
                  className="h-9 bg-card" 
                  type="number" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span className="text-muted-foreground text-sm">to</span>
                <Input 
                  placeholder="Max" 
                  className="h-9 bg-card" 
                  type="number" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
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
                  className={`flex items-center justify-between text-sm cursor-pointer transition-colors ${selectedCategory === "All" ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <span>All</span>
                  <span>({initialServices.length})</span>
                </div>
                
                {categoriesList.map((cat) => (
                  <div 
                    key={cat.name} 
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`flex items-center justify-between text-sm cursor-pointer transition-colors ${selectedCategory === cat.name ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <span className="truncate pr-2">{cat.name}</span>
                    <span className="shrink-0">({cat.count})</span>
                  </div>
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
                placeholder="Search for a service or freelancer..." 
                className="pl-10 h-12 bg-card border-border/60 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Service Grid */}
            {filteredServices.length === 0 ? (
              <div className="text-center py-20 px-4 border border-dashed border-border rounded-xl bg-muted/20">
                <div className="bg-background h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No services match your criteria</h3>
                <p className="text-muted-foreground mb-6">
                  Try clearing your search or adjusting your price range.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setMinPrice("");
                    setMaxPrice("");
                    setSelectedCategory("All");
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              // UPDATED: Added xl:grid-cols-4 to fit 4 cards on extra large screens
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredServices.map(({ service, user }) => {
                  const packages = service.packages as any;
                  const startingPrice = packages?.basic?.price || "0";
                  
                  const images = service.images as string[] | null;
                  const thumbnail = images && images.length > 0 ? images[0] : null;

                  const authorName = user?.displayName || user?.name || "Freelancer";
                  const authorAvatar = user?.avatarUrl || user?.image || "";
                  const authorHeadline = user?.title || service.category;
                  
                  const isOwner = currentUserId === service.freelancerId;

                  return (
                    <Card key={service.id} className="overflow-hidden group hover:shadow-md transition-all border-border/60 flex flex-col cursor-pointer relative bg-card">
                      <Link href={`/service/${service.id}`} className="flex flex-col h-full">
                        
                        {/* Thumbnail Image Container */}
                        <div className="aspect-[4/3] w-full bg-muted border-b border-border/50 relative overflow-hidden">
                          {isOwner && (
                            <div className="absolute top-2 left-2 z-10 bg-primary/90 backdrop-blur-sm text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm shadow-sm">
                              Yours
                            </div>
                          )}

                          {thumbnail ? (
                            <img 
                              src={thumbnail} 
                              alt={service.title} 
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-muted/50">
                              <ImageIcon className="h-10 w-10" />
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          {/* Author Info */}
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-8 w-8 border border-border">
                              <AvatarImage src={authorAvatar} alt={authorName} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold uppercase">
                                {authorName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm leading-none text-foreground group-hover:text-primary transition-colors">
                                {authorName}
                              </span>
                              <span className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                                {authorHeadline}
                              </span>
                            </div>
                          </div>
                          
                          {/* Title */}
                          <h3 className="font-medium text-sm line-clamp-2 leading-snug mb-4 flex-1">
                            {service.title}
                          </h3>
                          
                          {/* Footer / Price */}
                          <div className="flex items-end justify-between pt-3 border-t border-border/50 mt-auto">
                            <span className="inline-flex items-center gap-1.5 text-foreground font-semibold text-sm">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 
                              5.0 <span className="text-muted-foreground font-normal text-xs">(0)</span>
                            </span>
                            <div className="text-right">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide block mb-0.5">
                                Starting at
                              </span>
                              <p className="font-bold text-base leading-none">USD {Number(startingPrice).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        
                      </Link>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}