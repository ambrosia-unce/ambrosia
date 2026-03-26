import Link from "next/link";
import { CategoryBadge } from "@/components/category-badge";
import type { Pack } from "@/data/packs";
import { ArrowDownToLine, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export function PackCard({
  pack,
  className,
}: {
  pack: Pack;
  className?: string;
}) {
  const isOfficial = pack.author === "ambrosia";

  return (
    <Link href={`/packs/${pack.slug}`} className="group block">
      <div
        className={cn(
          "relative flex h-full flex-col rounded-xl border border-border/50 bg-card/40 p-4 transition-all duration-200",
          "hover:border-primary/30 hover:bg-card/70 hover:glow-sm",
          isOfficial && "border-primary/15 bg-primary/[0.02]",
          className,
        )}
      >
        {/* Top row: name + badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-mono text-[13px] font-semibold transition-colors group-hover:text-primary">
                {pack.name}
              </h3>
              {isOfficial && (
                <Star className="size-3 shrink-0 fill-primary/60 text-primary/60" />
              )}
            </div>
            <span className="font-mono text-[11px] text-muted-foreground/60">
              v{pack.version}
            </span>
          </div>
          <CategoryBadge category={pack.category} className="shrink-0" />
        </div>

        {/* Description */}
        <p className="mt-2.5 line-clamp-2 flex-1 text-[12px] leading-relaxed text-muted-foreground/80">
          {pack.description}
        </p>

        {/* Tags */}
        {pack.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {pack.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground/70"
              >
                {tag}
              </span>
            ))}
            {pack.tags.length > 3 && (
              <span className="rounded-md px-1 py-0.5 text-[10px] text-muted-foreground/50">
                +{pack.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-2.5 text-[11px] text-muted-foreground/60">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ArrowDownToLine className="size-3" />
              <span className="tabular-nums">{formatNumber(pack.downloads)}</span>
            </span>
            <span className="text-muted-foreground/40">
              {isOfficial ? "official" : pack.author}
            </span>
          </div>
          <span>{formatDate(pack.updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
