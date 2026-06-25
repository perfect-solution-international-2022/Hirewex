"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { submitReviewAction } from "@/app/actions/reviews";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star className={`h-8 w-8 transition-colors ${i <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20 hover:text-amber-300"}`} />
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <span className="text-sm font-semibold text-amber-600">{labels[hovered || value]}</span>
      )}
    </div>
  );
}

export function WriteReviewForm({
  serviceOrderId,
  revieweeId,
  freelancerName,
  freelancerAvatar,
  serviceTitle,
  alreadyReviewed,
  myReview,
}: {
  serviceOrderId:  string;
  revieweeId:      string;
  freelancerName:  string;
  freelancerAvatar: string;
  serviceTitle:    string;
  alreadyReviewed: boolean;
  myReview?:       { rating: number; comment: string | null } | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [rating, setRating]   = useState(myReview?.rating ?? 0);
  const [comment, setComment] = useState(myReview?.comment ?? "");
  const [submitted, setSubmitted] = useState(alreadyReviewed);

  const handleSubmit = () => {
    if (rating === 0) { toast.error("Please select a star rating."); return; }
    startTransition(async () => {
      const result = await submitReviewAction({ serviceOrderId, revieweeId, rating, comment });
      if (result.success) {
        toast.success("Review submitted! Thank you.");
        setSubmitted(true);
      } else {
        toast.error(result.error || "Failed to submit review.");
      }
    });
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-800/30 flex items-center justify-center shrink-0">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
        </div>
        <div>
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">Review submitted</p>
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i < (myReview?.rating ?? rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
            ))}
          </div>
          {(myReview?.comment || comment) && (
            <p className="text-sm text-muted-foreground mt-1 italic">&ldquo;{myReview?.comment || comment}&rdquo;</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={freelancerAvatar} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
            {freelancerName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">Rate your experience with {freelancerName}</p>
          <p className="text-xs text-muted-foreground">{serviceTitle}</p>
        </div>
      </div>

      <StarPicker value={rating} onChange={setRating} />

      <Textarea
        placeholder="Share your experience — quality, communication, delivery time..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="resize-none h-24 text-sm"
        disabled={isPending}
      />

      <Button
        onClick={handleSubmit}
        disabled={isPending || rating === 0}
        className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
      >
        {isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
        ) : (
          <><Star className="h-4 w-4" /> Submit Review</>
        )}
      </Button>
    </div>
  );
}
