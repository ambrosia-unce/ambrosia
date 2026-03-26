import Link from "next/link";
import { CategoryBadge } from "@/components/category-badge";
import type { Pack } from "@/data/packs";
import { ArrowDownToLine, ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

export function PackCardFeatured({
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
          "relative flex h-full flex-col rounded-xl border border-border/40 bg-card/30 p-5 transition-all duration-300",
          "hover:border-primary/30 hover:bg-card/60 hover:glow-sm",
          className,
        )}
      >
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        <div className="flex h-full flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <CategoryBadge category={pack.category} />
              <span className="font-mono text-[11px] text-muted-foreground/50">
                v{pack.version}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="truncate font-mono text-[13px] font-bold transition-colors group-hover:text-primary">
                  {pack.name}
                </h3>
                {isOfficial && (
                  <Star className="size-3 shrink-0 fill-primary/50 text-primary/50" />
                )}
              </div>
              <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground/70">
                {pack.description}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/30 pt-3">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
              <ArrowDownToLine className="size-3" />
              <span className="tabular-nums">
                {formatNumber(pack.downloads)}
              </span>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/40 transition-colors group-hover:text-primary">
              View
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
