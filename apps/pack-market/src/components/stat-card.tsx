import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border/40 bg-card/30 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3.5",
        className,
      )}
    >
      {Icon && (
        <div className="hidden size-9 items-center justify-center rounded-lg bg-primary/10 sm:flex">
          <Icon className="size-4 text-primary" />
        </div>
      )}
      <div className="min-w-0">
        <div className="truncate text-base font-bold tabular-nums text-foreground sm:text-xl">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="truncate text-[10px] font-medium text-muted-foreground/60 sm:text-[11px]">
          {label}
        </div>
      </div>
    </div>
  );
}
