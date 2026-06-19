"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Star, MapPin, Globe, Clock, BadgeCheck,
  Briefcase, CheckCircle2, DollarSign, Calendar,
  Building2, ImageIcon, FileText, Download
} from "lucide-react";

function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(new Date(d));
}

export function ProfilePreviewClient({
  user, profile, skills, workExperiences, reviews, services,
}: {
  user: any; profile: any; skills: any[]; workExperiences: any[]; reviews: any[]; services: any[];
}) {
  const displayName = user.displayName || user.name || "Freelancer";
  const headline     = profile?.headline || user.title || "Freelancer";
  const avatar       = profile?.avatarUrl || user.image || user.avatarUrl || "";
  const cover        = profile?.coverUrl || "";
  const rating       = profile?.rating ? Number(profile.rating).toFixed(1) : "New";
  const reviewCount  = profile?.totalReviews ?? 0;
  const jobsCompleted = profile?.jobsCompleted ?? 0;
  const memberSince  = formatDate(user.createdAt);
  const hourlyRate   = profile?.hourlyRate ? Number(profile.hourlyRate) : null;
  const portfolioUrl = user.portfolioUrl || null;

  let languages: string[] = [];
  try {
    const parsed = typeof profile?.languages === "string" ? JSON.parse(profile.languages) : profile?.languages;
    languages = Array.isArray(parsed) ? parsed : [];
  } catch {}

  return (
    <div className="bg-muted/10">

      {/* Cover */}
      <div className="h-40 sm:h-56 w-full bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
        {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
      </div>

      <div className="container mx-auto px-4 max-w-5xl">

        {/* Profile header */}
        <div className="relative -mt-16 sm:-mt-20 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <Avatar className="h-28 w-28 sm:h-36 sm:w-36 ring-4 ring-background shadow-lg shrink-0">
              <AvatarImage src={avatar} />
              <AvatarFallback className="bg-primary/10 text-3xl font-light text-primary">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{displayName}</h1>
                <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  <BadgeCheck className="h-3 w-3" /> Top Rated
                </span>
              </div>
              <p className="text-muted-foreground mt-1">{headline}</p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-foreground">{rating}</span>
                  <span className="text-muted-foreground">({reviewCount} reviews)</span>
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {profile?.country || user.location || "Unknown"}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Member since {memberSince}
                </span>
              </div>
            </div>

            {hourlyRate && (
              <div className="rounded-xl border border-border/60 bg-card px-5 py-3 shadow-sm shrink-0">
                <p className="text-xs text-muted-foreground">Hourly rate</p>
                <p className="text-xl font-bold text-foreground">${hourlyRate}/hr</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">

          {/* LEFT — main content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Bio */}
            {(user.aboutText || profile?.bio) && (
              <section>
                <h2 className="text-lg font-bold mb-3 pb-2 border-b border-border/50">About</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {user.aboutText || profile?.bio}
                </p>
              </section>
            )}

            {/* Portfolio */}
            {portfolioUrl && (
              <section>
                <h2 className="text-lg font-bold mb-3 pb-2 border-b border-border/50">Portfolio</h2>
                <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Portfolio document</p>
                    <p className="text-xs text-muted-foreground">PDF</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={portfolioUrl} target="_blank" rel="noreferrer">
                      <Download className="h-3.5 w-3.5 mr-1.5" /> View PDF
                    </a>
                  </Button>
                </div>
              </section>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-3 pb-2 border-b border-border/50">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <Badge key={s.id} variant="secondary" className="rounded-full px-3 py-1.5 text-xs font-medium">
                      {s.name}
                      <span className="ml-1.5 text-muted-foreground/70">· {s.level}</span>
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Work experience */}
            {workExperiences.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border/50">Work Experience</h2>
                <div className="space-y-5">
                  {workExperiences.map((exp) => (
                    <div key={exp.id} className="flex gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground">{exp.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {exp.company} {exp.type ? `· ${exp.type}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {exp.startDate} — {exp.current ? "Present" : exp.endDate || "—"}
                        </p>
                        {exp.desc && (
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{exp.desc}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Services */}
            {services.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border/50">Services</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map((service) => {
                    let cover = "";
                    try {
                      const imgs = typeof service.images === "string" ? JSON.parse(service.images) : service.images;
                      if (Array.isArray(imgs) && imgs.length > 0) cover = imgs[0];
                    } catch {}
                    let startingPrice = "—";
                    try {
                      const pkgs = typeof service.packages === "string" ? JSON.parse(service.packages) : service.packages;
                      if (pkgs?.basic?.price) startingPrice = `$${pkgs.basic.price}`;
                    } catch {}

                    return (
                      <Link
                        key={service.id}
                        href={`/service/${service.id}`}
                        className="group rounded-xl border border-border/60 overflow-hidden hover:border-primary/40 transition-colors bg-card"
                      >
                        <div className="aspect-video bg-muted overflow-hidden">
                          {cover ? (
                            <img src={cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {service.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">From {startingPrice}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section>
              <h2 className="text-lg font-bold mb-4 pb-2 border-b border-border/50 flex items-center gap-2">
                Reviews <span className="text-sm font-normal text-muted-foreground">({reviewCount})</span>
              </h2>
              {reviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No reviews yet.</p>
                </div>
              ) : (
                <div className="space-y-0 divide-y divide-border/50">
                  {reviews.map((review) => (
                    <div key={review.id} className="py-5 first:pt-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">R</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT — stats sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-border/60 shadow-sm">
              <CardContent className="p-5 space-y-5">
                <h3 className="text-sm font-bold text-foreground">Stats</h3>
                <div className="space-y-3">
                  {[
                    { icon: CheckCircle2, label: "Jobs completed", value: jobsCompleted },
                    { icon: Star,         label: "Average rating", value: rating },
                    { icon: Briefcase,    label: "Success score",  value: profile?.successScore ?? 0 },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Icon className="h-4 w-4" /> {label}
                      </span>
                      <span className="font-semibold text-foreground">{value}</span>
                    </div>
                  ))}
                </div>

                {languages.length > 0 && (
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" /> Languages
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {languages.map((lang, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border/50 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Responds within ~1 hour
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
