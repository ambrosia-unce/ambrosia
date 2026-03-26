"use client";

import { useState, useMemo } from "react";
import Header from "@/app/components/header";
import { PackCard } from "@/components/pack-card";
import { SearchInput } from "@/components/search-input";
import { type PackCategory, type Pack, categoryConfig } from "@/data/packs";
import { cn } from "@/lib/utils";
import {
  ArrowDownToLine,
  CalendarDays,
  CaseSensitive,
  ChevronDown,
  Filter,
  LayoutGrid,
  LayoutList,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortOption = "downloads" | "updated" | "name";
type AuthorFilter = "all" | "official" | "community";
type ViewMode = "grid" | "list";

// ---------------------------------------------------------------------------
// Category grouping — organize 29 categories into logical sections
// ---------------------------------------------------------------------------

const categoryGroups: { label: string; keys: PackCategory[] }[] = [
  {
    label: "Core",
    keys: ["http", "graphql", "websocket", "microservices"],
  },
  {
    label: "Data",
    keys: ["database", "orm", "cache", "search", "storage"],
  },
  {
    label: "Security",
    keys: ["auth", "permissions", "security"],
  },
  {
    label: "Infrastructure",
    keys: ["messaging", "scheduling", "monitoring", "cloud", "config", "logging"],
  },
  {
    label: "Tooling",
    keys: ["validation", "testing", "devtools", "documentation", "templating", "utils"],
  },
  {
    label: "Services",
    keys: ["mail", "notification", "payment", "events", "i18n"],
  },
];

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------

const sortOptions: { value: SortOption; label: string; icon: typeof ArrowDownToLine }[] = [
  { value: "downloads", label: "Downloads", icon: ArrowDownToLine },
  { value: "updated", label: "Updated", icon: CalendarDays },
  { value: "name", label: "Name", icon: CaseSensitive },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BrowseClient({
  packs: allPacks,
  initialCategory = null,
  initialSearch = "",
}: {
  packs: Pack[];
  initialCategory?: string | null;
  initialSearch?: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState<PackCategory | null>(
    (initialCategory as PackCategory) || null,
  );
  const [sort, setSort] = useState<SortOption>("downloads");
  const [authorFilter, setAuthorFilter] = useState<AuthorFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Derived: category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of allPacks) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [allPacks]);

  // Derived: active tags from search
  const activeTags = useMemo(() => {
    const tags: Set<string> = new Set();
    for (const p of allPacks) {
      for (const t of p.tags) tags.add(t);
    }
    return tags;
  }, [allPacks]);

  // Filter + sort
  const filtered = useMemo(() => {
    return allPacks
      .filter((p) => {
        if (activeCategory && p.category !== activeCategory) return false;
        if (authorFilter === "official" && p.author !== "ambrosia") return false;
        if (authorFilter === "community" && p.author === "ambrosia") return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.tags.some((t) => t.includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        switch (sort) {
          case "downloads":
            return b.downloads - a.downloads;
          case "updated":
            return b.updatedAt.localeCompare(a.updatedAt);
          case "name":
            return a.name.localeCompare(b.name);
        }
      });
  }, [allPacks, activeCategory, authorFilter, search, sort]);

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const hasActiveFilters = activeCategory !== null || authorFilter !== "all" || search !== "";

  const clearFilters = () => {
    setActiveCategory(null);
    setAuthorFilter("all");
    setSearch("");
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-6 py-6">
        <div className="flex gap-6 lg:gap-8">
          {/* ============ Sidebar ============ */}
          <aside className="hidden shrink-0 lg:block lg:w-60">
            <div className="sticky top-16 space-y-5 pb-8">
              {/* Search */}
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search packs..."
              />

              {/* Sort */}
              <div>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Sort by
                </h3>
                <div className="flex flex-wrap gap-1">
                  {sortOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSort(opt.value)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all",
                          sort === opt.value
                            ? "bg-primary/15 text-primary"
                            : "text-muted-foreground/60 hover:bg-muted/50 hover:text-muted-foreground",
                        )}
                      >
                        <Icon className="size-3" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Author filter */}
              <div>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Author
                </h3>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      { value: "all", label: "All" },
                      { value: "official", label: "Official", icon: Star },
                      { value: "community", label: "Community" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAuthorFilter(opt.value)}
                      className={cn(
                        "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all",
                        authorFilter === opt.value
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground/60 hover:bg-muted/50 hover:text-muted-foreground",
                      )}
                    >
                      {"icon" in opt && opt.icon && (
                        <opt.icon className="size-3 fill-current" />
                      )}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories — grouped */}
              <div>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Categories
                </h3>
                <div className="space-y-0.5">
                  {/* All button */}
                  <button
                    type="button"
                    onClick={() => setActiveCategory(null)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] transition-all",
                      activeCategory === null
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground/70 hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    All
                    <span className="ml-auto text-[11px] tabular-nums text-muted-foreground/50">
                      {allPacks.length}
                    </span>
                  </button>

                  {/* Category groups */}
                  {categoryGroups.map((group) => {
                    const groupTotal = group.keys.reduce(
                      (sum, k) => sum + (categoryCounts[k] || 0),
                      0,
                    );
                    const collapsed = collapsedGroups.has(group.label);
                    const hasActive = group.keys.includes(activeCategory as PackCategory);

                    return (
                      <div key={group.label}>
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.label)}
                          className={cn(
                            "flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider transition-all",
                            hasActive
                              ? "text-primary"
                              : "text-muted-foreground/40 hover:text-muted-foreground/60",
                          )}
                        >
                          <ChevronDown
                            className={cn(
                              "size-3 transition-transform",
                              collapsed && "-rotate-90",
                            )}
                          />
                          {group.label}
                          {groupTotal > 0 && (
                            <span className="ml-auto text-[10px] tabular-nums font-normal text-muted-foreground/30">
                              {groupTotal}
                            </span>
                          )}
                        </button>

                        {!collapsed && (
                          <div className="ml-1 space-y-0.5">
                            {group.keys.map((key) => {
                              const config = categoryConfig[key];
                              const count = categoryCounts[key] || 0;
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() =>
                                    setActiveCategory(
                                      activeCategory === key ? null : key,
                                    )
                                  }
                                  className={cn(
                                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-1 text-left text-[12px] transition-all",
                                    activeCategory === key
                                      ? "bg-primary/10 font-medium text-primary"
                                      : count > 0
                                        ? "text-muted-foreground/70 hover:bg-muted/40 hover:text-foreground"
                                        : "text-muted-foreground/30",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "size-1.5 shrink-0 rounded-full",
                                      count > 0 ? config.color : "bg-muted-foreground/20",
                                    )}
                                  />
                                  {config.label}
                                  {count > 0 && (
                                    <span className="ml-auto text-[11px] tabular-nums text-muted-foreground/40">
                                      {count}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* ============ Main content ============ */}
          <main className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Mobile search */}
              <div className="lg:hidden">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search packs..."
                />
              </div>

              {/* Result count + active filters */}
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13px] text-muted-foreground">
                  <span className="font-semibold tabular-nums text-foreground">
                    {filtered.length}
                  </span>{" "}
                  {filtered.length === 1 ? "pack" : "packs"}
                </p>

                {activeCategory && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory(null)}
                    className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        categoryConfig[activeCategory]?.color,
                      )}
                    />
                    {categoryConfig[activeCategory]?.label}
                    <X className="ml-0.5 size-3" />
                  </button>
                )}

                {authorFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setAuthorFilter("all")}
                    className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    {authorFilter}
                    <X className="ml-0.5 size-3" />
                  </button>
                )}

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    &ldquo;{search}&rdquo;
                    <X className="ml-0.5 size-3" />
                  </button>
                )}

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-[11px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* View toggle + mobile sort */}
              <div className="flex items-center gap-2">
                {/* Mobile sort buttons */}
                <div className="flex gap-1 lg:hidden">
                  {sortOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSort(opt.value)}
                        className={cn(
                          "flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all",
                          sort === opt.value
                            ? "bg-primary/15 text-primary"
                            : "text-muted-foreground/50 hover:text-muted-foreground",
                        )}
                      >
                        <Icon className="size-3" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* View mode */}
                <div className="flex rounded-lg border border-border/40 p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "rounded-md p-1.5 transition-colors",
                      viewMode === "grid"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground/40 hover:text-muted-foreground",
                    )}
                  >
                    <LayoutGrid className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "rounded-md p-1.5 transition-colors",
                      viewMode === "list"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground/40 hover:text-muted-foreground",
                    )}
                  >
                    <LayoutList className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Pack grid / list */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/40 py-20 text-center">
                <Filter className="mb-3 size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground/60">
                  No packs found.
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-2 text-[12px] text-primary transition-colors hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((pack) => (
                  <PackCard key={pack.slug} pack={pack} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((pack) => (
                  <PackCard key={pack.slug} pack={pack} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
