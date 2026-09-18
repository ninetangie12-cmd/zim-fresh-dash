import { Info } from "lucide-react";

import { DISCLAIMER } from "@/config/brand";
import { cn } from "@/lib/utils";

export function IndependentNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex gap-2 rounded-md bg-info-bg px-3 py-2 text-xs leading-relaxed text-info",
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{DISCLAIMER}</span>
    </p>
  );
}

export function EstimateNotice({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-relaxed text-slate-muted", className)}>
      Prices shown are estimates. Your shopper confirms the shelf price before payment is taken.
    </p>
  );
}
