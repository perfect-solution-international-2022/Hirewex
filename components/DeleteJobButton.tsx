"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteJobAction } from "@/app/actions/jobs";

export function DeleteJobButton({ jobId }: { jobId: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteJobAction(jobId);
      setIsConfirming(false); // Reset state after deletion
    });
  };

  // If they clicked the trash can, show the confirmation UI
  if (isConfirming) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-2 py-1">
        <span className="flex items-center text-xs font-medium text-destructive">
          <AlertTriangle className="mr-1 h-3 w-3" /> Sure?
        </span>
        <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={handleDelete} disabled={isPending}>
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setIsConfirming(false)} disabled={isPending}>
          No
        </Button>
      </div>
    );
  }

  // Default state: Just the trash icon
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => setIsConfirming(true)} 
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}