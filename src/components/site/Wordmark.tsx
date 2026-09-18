import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/** Temporary text wordmark — deliberately no logo mark or monogram. */
export function Wordmark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span
      className={cn(
        "font-display text-lg font-extrabold",
        tone === "light" ? "text-primary-foreground" : "text-botanical",
        className,
      )}
    >
      {brand.wordmark.base}
      <span className={tone === "light" ? "font-medium text-primary-foreground/75" : "font-medium text-coral"}>
        {brand.wordmark.accent}
      </span>
    </span>
  );
}
