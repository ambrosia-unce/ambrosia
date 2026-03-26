import { Badge } from "@/components/ui/badge";
import { type PackCategory, categoryConfig } from "@/data/packs";
import { cn } from "@/lib/utils";

export function CategoryBadge({
  category,
  className,
}: {
  category: PackCategory;
  className?: string;
}) {
  const config = categoryConfig[category];
  if (!config) {
    return (
      <Badge variant="secondary" className={cn("rounded-lg text-xs font-medium", className)}>
        {category}
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className={cn("gap-1.5 rounded-lg text-xs font-medium", className)}
    >
      <span className={cn("size-2 rounded-full", config.color)} />
      {config.label}
    </Badge>
  );
}
