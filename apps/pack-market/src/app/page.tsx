import Link from "next/link";
import Header from "@/app/components/header";
import { PackCardFeatured } from "@/components/pack-card-featured";
import { PackCard } from "@/components/pack-card";
import { StatCard } from "@/components/stat-card";
import { CopyCommand } from "@/components/copy-command";
import { HeroSearch } from "@/components/hero-search";
import { Button } from "@/components/ui/button";
import { categoryConfig } from "@/data/packs";
import type { PackCategory } from "@/data/packs";
import { getPackDisplayList, ensureDb } from "@/lib/store";
import {
  ArrowRight,
  Box,
  Download,
  Sparkles,
  Users,
  Zap,
  Terminal,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureDb();
  const allPacks = await getPackDisplayList();

  const featured = allPacks.filter((p) => p.featured);
  const recent = [...allPacks]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);
  const popular = [...allPacks]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 8);

  const counts = new Map<string, number>();
  for (const pack of allPacks) {
    counts.set(pack.category, (counts.get(pack.category) || 0) + 1);
  }
  const categoryStats = Array.from(counts.entries())
    .map(([category, count]) => ({
      category: category as PackCategory,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const totalPacks = allPacks.length;
  const totalDownloads = allPacks.reduce((sum, p) => sum + p.downloads, 0);
  const totalAuthors = new Set(allPacks.map((p) => p.author)).size;

  return (
    <div className="min-h-screen">
      <Header />

      {/* ==================== Hero ==================== */}
      <section className="relative overflow-hidden border-b border-border/30">
        {/* Background layers */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent" />
        <div className="absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-primary/[0.06] blur-[80px]" />

        <div className="container relative mx-auto px-4 pb-12 pt-16 sm:px-6 sm:pb-20 sm:pt-28">
          <div className="mx-auto max-w-2xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/30 px-3.5 py-1.5 text-[12px] text-muted-foreground/80 backdrop-blur-sm">
              <Sparkles className="size-3 text-primary" />
              TypeScript framework for Bun
            </div>

            <h1 className="text-gradient text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Ambrosia Pack Market
            </h1>

            <p className="mx-auto mt-5 max-w-md text-[14px] leading-relaxed text-muted-foreground/70 sm:text-[15px]">
              Discover, install, and publish packs for the Ambrosia framework.
              Build faster with community-driven components.
            </p>

            {/* Search bar */}
            <div className="mx-auto mt-8 max-w-md px-2 sm:px-0">
              <HeroSearch />
            </div>

            {/* CTA buttons */}
            <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
              <Link href="/packs" className="w-full sm:w-auto">
                <Button size="lg" className="w-full rounded-xl px-6 sm:w-auto">
                  Browse Packs
                  <ArrowRight className="ml-1.5 size-4" />
                </Button>
              </Link>
              <Link href="/submit" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-xl px-6 sm:w-auto"
                >
                  Publish a Pack
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-14 grid max-w-lg grid-cols-3 gap-2 sm:gap-4">
            <StatCard label="Packs" value={totalPacks} icon={Box} />
            <StatCard
              label="Downloads"
              value={totalDownloads}
              icon={Download}
            />
            <StatCard label="Authors" value={totalAuthors} icon={Users} />
          </div>
        </div>
      </section>

      {/* ==================== Featured ==================== */}
      <section className="border-b border-border/30">
        <div className="container mx-auto px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="size-3.5 text-primary" />
              </div>
              <h2 className="text-[15px] font-semibold">Featured Packs</h2>
            </div>
            <Link href="/packs">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-[12px] text-muted-foreground/60 hover:text-foreground"
              >
                View all
                <ArrowRight className="size-3" />
              </Button>
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((pack) => (
              <PackCardFeatured
                key={pack.name}
                pack={{
                  slug: pack.name,
                  name: pack.name,
                  description: pack.description,
                  version: pack.version,
                  author: pack.author,
                  category: pack.category as PackCategory,
                  tags: pack.tags,
                  downloads: pack.downloads,
                  updatedAt: pack.updatedAt,
                  dependencies: [],
                  installCommand: pack.installCommand,
                  featured: pack.featured,
                  readme: "",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ==================== Categories ==================== */}
      <section className="border-b border-border/30" id="categories">
        <div className="container mx-auto px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="size-3.5 text-primary" />
            </div>
            <h2 className="text-[15px] font-semibold">
              Browse by Category
            </h2>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {categoryStats.map(({ category, count }) => {
              const config = categoryConfig[category];
              if (!config) return null;
              return (
                <Link
                  key={category}
                  href={`/packs?category=${category}`}
                  className="group flex items-center gap-2.5 rounded-lg border border-border/30 bg-card/20 px-3.5 py-2.5 transition-all duration-200 hover:border-primary/20 hover:bg-card/50"
                >
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full transition-shadow",
                      config.color,
                      "group-hover:shadow-[0_0_6px] group-hover:shadow-current",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-muted-foreground/80 transition-colors group-hover:text-foreground">
                    {config.label}
                  </span>
                  <span className="text-[11px] tabular-nums text-muted-foreground/30">
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== Popular ==================== */}
      <section className="border-b border-border/30">
        <div className="container mx-auto px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                <Download className="size-3.5 text-primary" />
              </div>
              <h2 className="text-[15px] font-semibold">Most Popular</h2>
            </div>
            <Link href="/packs">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-[12px] text-muted-foreground/60 hover:text-foreground"
              >
                View all
                <ArrowRight className="size-3" />
              </Button>
            </Link>
          </div>

          {/* Compact list */}
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {popular.map((pack, i) => (
              <Link
                key={pack.name}
                href={`/packs/${pack.name}`}
                className="group flex items-center gap-2 rounded-lg border border-border/30 bg-card/20 px-3 py-2.5 transition-all hover:border-primary/20 hover:bg-card/50 sm:gap-3 sm:px-4 sm:py-3"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/40 text-[11px] font-bold tabular-nums text-muted-foreground/50">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-[12px] font-semibold transition-colors group-hover:text-primary">
                      {pack.name}
                    </span>
                    <span className="hidden shrink-0 font-mono text-[10px] text-muted-foreground/40 sm:inline">
                      v{pack.version}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground/50">
                    {pack.description}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-[11px] tabular-nums text-muted-foreground/40">
                  <Download className="size-3" />
                  <span className="hidden sm:inline">{pack.downloads.toLocaleString()}</span>
                  <span className="sm:hidden">{formatNumber(pack.downloads)}</span>
                </span>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/20 transition-colors group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== Recently Updated ==================== */}
      <section className="border-b border-border/30">
        <div className="container mx-auto px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="size-3.5 text-primary" />
              </div>
              <h2 className="text-[15px] font-semibold">Recently Updated</h2>
            </div>
            <Link href="/packs">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-[12px] text-muted-foreground/60 hover:text-foreground"
              >
                View all
                <ArrowRight className="size-3" />
              </Button>
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((pack) => (
              <PackCard
                key={pack.name}
                pack={{
                  slug: pack.name,
                  name: pack.name,
                  description: pack.description,
                  version: pack.version,
                  author: pack.author,
                  category: pack.category as PackCategory,
                  tags: pack.tags,
                  downloads: pack.downloads,
                  updatedAt: pack.updatedAt,
                  dependencies: [],
                  installCommand: pack.installCommand,
                  featured: pack.featured,
                  readme: "",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ==================== Quick Start ==================== */}
      <section className="border-b border-border/30">
        <div className="container mx-auto px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto max-w-xl text-center">
            <div className="mb-4 inline-flex items-center justify-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Terminal className="size-5 text-primary" />
              </div>
            </div>
            <h2 className="text-lg font-semibold">Get started in seconds</h2>
            <p className="mt-2 text-[13px] text-muted-foreground/60">
              Install the CLI, create a project, and add packs with a single
              command.
            </p>

            <div className="mx-auto mt-6 max-w-sm space-y-2">
              <div className="flex items-center gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  1
                </span>
                <CopyCommand
                  command="bun add -g @ambrosia-unce/cli"
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  2
                </span>
                <CopyCommand
                  command="ambrosia new my-app"
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  3
                </span>
                <CopyCommand
                  command="ambrosia add jwt-auth-pack"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Footer ==================== */}
      <footer>
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground/40">
            <span className="text-gradient font-semibold">Ambrosia</span>
            Pack Market
          </div>
          <div className="flex items-center gap-4 text-[12px] text-muted-foreground/30">
            <Link
              href="https://github.com/ambrosia-unce/ambrosia"
              target="_blank"
              className="transition-colors hover:text-muted-foreground"
            >
              GitHub
            </Link>
            <Link
              href="/packs"
              className="transition-colors hover:text-muted-foreground"
            >
              Browse
            </Link>
            <Link
              href="/submit"
              className="transition-colors hover:text-muted-foreground"
            >
              Publish
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
