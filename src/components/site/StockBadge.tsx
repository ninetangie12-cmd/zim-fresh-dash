import { stockLabels, type StockStatus } from "@/data/catalog";
import { cn } from "@/lib/utils";

const tone: Record<StockStatus, string> = {
  in_stock: "bg-success-bg text-success",
  low_stock: "bg-warning-bg text-warning",
  out_of_stock: "bg-error-bg text-error",
  unavailable: "bg-error-bg text-error",
  other_store: "bg-info-bg text-info",
};

export function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium",
        tone[status],
        className,
      )}
    >
      {stockLabels[status]}
    </span>
  );
}
