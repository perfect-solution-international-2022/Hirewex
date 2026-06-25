"use client";

import { useState, useTransition } from "react";
import { updateSetting } from "@/app/actions/platform-settings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Percent, Info, Loader2 } from "lucide-react";

export function SettingsClient({ serviceFeePercent }: { serviceFeePercent: string }) {
  const [fee, setFee] = useState(serviceFeePercent);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const feeNum = parseFloat(fee);
  const valid = !isNaN(feeNum) && feeNum >= 0 && feeNum <= 100;

  // Live preview of what buyer pays on a $100 service
  const previewBase = 100;
  const previewFee = valid ? (previewBase * feeNum) / 100 : 0;
  const previewTotal = previewBase + previewFee;

  const handleSave = () => {
    if (!valid) { setMsg({ type: "error", text: "Enter a number between 0 and 100." }); return; }
    setMsg(null);
    startTransition(async () => {
      try {
        await updateSetting("service_fee_percent", feeNum.toString());
        setMsg({ type: "success", text: `Service fee updated to ${feeNum}%.` });
      } catch (e: any) {
        setMsg({ type: "error", text: e?.message ?? "Failed to save." });
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Service fee card */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold">Buyer Service Fee</h2>
            <p className="text-sm text-muted-foreground mt-1">
              This percentage is added on top of the service or bid price when a buyer checks out.
              The fee is collected into the platform and kept by the admin at payment release.
            </p>
          </div>

          {/* Fee input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Service Fee %
            </label>
            <div className="flex items-center gap-3">
              <div className="relative w-36">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="w-full pr-8 pl-3 h-10 rounded-md border border-input bg-background text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <Button onClick={handleSave} disabled={isPending || !valid}>
                {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : "Save"}
              </Button>
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-xl bg-muted/40 border border-border/40 p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" /> Live preview — $100 service
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service price</span>
                <span className="font-medium">${previewBase.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service fee ({valid ? feeNum : 0}%)</span>
                <span className="font-medium text-amber-600">+${previewFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-1.5 font-bold">
                <span>Buyer pays</span>
                <span className="text-primary">${previewTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Fee flow explanation */}
          <div className="rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 p-4 text-sm space-y-2">
            <p className="font-semibold text-blue-800 dark:text-blue-300">How the fee flow works</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400 text-xs">
              <li>Buyer pays <strong>service price + {valid ? feeNum : "X"}% service fee</strong> at checkout</li>
              <li>Full amount is held in escrow</li>
              <li>Admin releases payment → keeps the service fee + deducts a 5% commission from the base price</li>
              <li>Freelancer receives: <strong>base price − 5% commission</strong></li>
            </ol>
          </div>

          {msg && (
            <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${msg.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`}>
              {msg.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
              {msg.text}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
