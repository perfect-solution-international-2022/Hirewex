"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";

export function PayButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="w-full font-bold text-lg h-14 bg-[#1e88e5] hover:bg-[#1565c0] disabled:opacity-90 gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Redirecting to OnePay...
        </>
      ) : (
        <>
          <Lock className="h-4 w-4" />
          Confirm & Pay via OnePay
        </>
      )}
    </Button>
  );
}
