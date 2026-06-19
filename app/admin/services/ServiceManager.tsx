"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertCircle, Search, Filter, Eye } from "lucide-react";
import { deleteService } from "@/app/actions/admin-services";

export function ServiceManager({ initialServices }: { initialServices: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [deleteData, setDeleteData] = useState<{ id: string; title: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const uniqueCategories = useMemo(() => {
    const categories = initialServices.map((s) => s.category).filter(Boolean);
    return ["All", ...Array.from(new Set(categories))];
  }, [initialServices]);

  const filteredServices = useMemo(() => {
    return initialServices.filter((service) => {
      const matchesSearch =
        service.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [initialServices, searchQuery, selectedCategory]);

  const confirmDelete = () => {
    if (!deleteData) return;
    startTransition(async () => {
      await deleteService(deleteData.id);
      setDeleteData(null);
    });
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Service Moderation</h2>
        <p className="text-muted-foreground mt-1">
          Review, filter, and manage active freelancer services.
        </p>
      </div>

      {/* FILTER PANEL */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search gig titles or descriptions..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex w-full md:w-auto items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <Filter className="h-4 w-4 text-muted-foreground mr-1 shrink-0" />
            {uniqueCategories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* GIG GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredServices.length === 0 ? (
          <div className="col-span-full py-20 text-center border rounded-xl bg-background border-dashed">
            <p className="text-muted-foreground">No gigs match your current filters.</p>
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          filteredServices.map((service) => {
            let coverImage =
              "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";
            try {
              const parsedImages =
                typeof service.images === "string"
                  ? JSON.parse(service.images)
                  : service.images;
              if (Array.isArray(parsedImages) && parsedImages.length > 0)
                coverImage = parsedImages[0];
            } catch (e) {}

            let startingPrice = "--";
            try {
              const parsedPackages =
                typeof service.packages === "string"
                  ? JSON.parse(service.packages)
                  : service.packages;
              if (parsedPackages?.basic?.price)
                startingPrice = `$${parsedPackages.basic.price}`;
              else if (parsedPackages?.price)
                startingPrice = `$${parsedPackages.price}`;
            } catch (e) {}

            return (
              <Card
                key={service.id}
                className="flex flex-col overflow-hidden group border-border/50 hover:border-primary/30 transition-all shadow-sm"
              >
                {/* ── Clickable area → admin detail page ── */}
                <Link
                  href={`/admin/services/${service.id}`}
                  className="flex flex-col flex-1 cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    <Badge className="absolute top-3 left-3 z-10 shadow-md">
                      {service.category || "Uncategorized"}
                    </Badge>
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-black/50 text-white text-[11px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <Eye className="h-3 w-3" /> Review
                    </div>
                    <img
                      src={coverImage}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Body */}
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <h3 className="font-semibold text-lg line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Starting Price
                      </span>
                      <span className="text-xl font-bold">{startingPrice}</span>
                    </div>
                  </CardContent>
                </Link>

                {/* ── Admin footer — outside link ── */}
                <div className="bg-destructive/5 border-t p-3 flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      setDeleteData({ id: service.id, title: service.title })
                    }
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Gig
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* DELETE MODAL */}
      {deleteData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <Card className="w-full max-w-sm shadow-lg border-destructive/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-lg">Delete this Gig?</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                This will permanently remove{" "}
                <strong>{deleteData.title}</strong> from the marketplace.
              </p>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setDeleteData(null)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  {isPending ? "Deleting..." : "Delete Gig"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
