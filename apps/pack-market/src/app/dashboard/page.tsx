"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/header";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/category-badge";
import { StatCard } from "@/components/stat-card";
import { CopyCommand } from "@/components/copy-command";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ArrowDownToLine,
  Box,
  Calendar,
  ChevronRight,
  Download,
  ExternalLink,
  Github,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface UserPack {
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  downloads: number;
  featured: boolean;
  publishedAt: string;
  updatedAt: string;
  repoUrl: string;
  installCommand: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [packs, setPacks] = useState<UserPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingPack, setDeletingPack] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      loadPacks();
    }
  }, [status]);

  const loadPacks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/packs");
      if (!res.ok) throw new Error("Failed to load packs");
      const data = await res.json();
      setPacks(data.packs || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete pack "${name}"? This cannot be undone.`)) return;
    setDeletingPack(name);
    try {
      const res = await fetch(`/api/registry/${name}`, { method: "DELETE" });
      if (res.ok) {
        setPacks((prev) => prev.filter((p) => p.name !== name));
      }
    } finally {
      setDeletingPack(null);
    }
  };

  if (status === "loading") return null;
  if (!session) return null;

  const totalDownloads = packs.reduce((sum, p) => sum + (p.downloads || 0), 0);

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-6 py-8">
        {/* ============ Profile header ============ */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-14 border-2 border-border/30">
              <AvatarImage
                src={session.user.avatarUrl || session.user.image || ""}
                alt={session.user.username || ""}
              />
              <AvatarFallback className="text-lg">
                {(session.user.username || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {session.user.username || session.user.name}
              </h1>
              <div className="mt-0.5 flex items-center gap-3 text-[12px] text-muted-foreground/50">
                <span>{session.user.email}</span>
                {session.user.username && (
                  <a
                    href={`https://github.com/${session.user.username}`}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-1 transition-colors hover:text-muted-foreground"
                  >
                    <Github className="size-3" />
                    GitHub
                    <ExternalLink className="size-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <Link href="/submit">
            <Button size="sm" className="rounded-xl">
              <Plus className="mr-1.5 size-3.5" />
              Submit Pack
            </Button>
          </Link>
        </div>

        {/* ============ Stats ============ */}
        {!loading && packs.length > 0 && (
          <div className="mt-6 flex gap-3">
            <StatCard label="Published Packs" value={packs.length} icon={Box} />
            <StatCard
              label="Total Downloads"
              value={totalDownloads}
              icon={Download}
            />
          </div>
        )}

        {/* ============ Packs section ============ */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold">
              <div className="flex size-6 items-center justify-center rounded-md bg-primary/10">
                <Package className="size-3 text-primary" />
              </div>
              Your Packs
            </h2>
            {packs.length > 0 && (
              <button
                type="button"
                onClick={loadPacks}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
              >
                <RefreshCw className="size-3" />
                Refresh
              </button>
            )}
          </div>

          {loading ? (
            <div className="mt-12 flex flex-col items-center gap-3">
              <Loader2 className="size-6 animate-spin text-muted-foreground/30" />
              <p className="text-[12px] text-muted-foreground/40">
                Loading your packs...
              </p>
            </div>
          ) : packs.length === 0 ? (
            <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border/30 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted/30">
                <Package className="size-6 text-muted-foreground/30" />
              </div>
              <p className="mt-4 text-[13px] text-muted-foreground/50">
                You haven't published any packs yet.
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground/30">
                Create a repository with a registry.json manifest and submit it.
              </p>
              <Link href="/submit" className="mt-5">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-border/40"
                >
                  <Plus className="mr-1.5 size-3.5" />
                  Submit your first pack
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {packs.map((pack) => (
                <div
                  key={pack.name}
                  className={cn(
                    "group flex items-center gap-4 rounded-xl border border-border/30 bg-card/20 p-4 transition-all duration-200",
                    "hover:border-border/50 hover:bg-card/40",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/packs/${pack.name}`}
                        className="font-mono text-[13px] font-semibold transition-colors hover:text-primary"
                      >
                        {pack.name}
                      </Link>
                      <span className="font-mono text-[11px] text-muted-foreground/40">
                        v{pack.version}
                      </span>
                      <CategoryBadge category={pack.category as never} />
                    </div>
                    <p className="mt-1 truncate text-[12px] text-muted-foreground/50">
                      {pack.description}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground/40">
                      <span className="flex items-center gap-1">
                        <ArrowDownToLine className="size-3" />
                        {formatNumber(pack.downloads)}
                      </span>
                      {pack.updatedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatDate(pack.updatedAt)}
                        </span>
                      )}
                      {pack.repoUrl && (
                        <a
                          href={pack.repoUrl}
                          target="_blank"
                          rel="noopener"
                          className="flex items-center gap-1 transition-colors hover:text-muted-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Github className="size-3" />
                          Source
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Install command (compact) */}
                  <div className="hidden shrink-0 xl:block">
                    <CopyCommand
                      command={pack.installCommand || `ambrosia add ${pack.name}`}
                      className="w-64"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    <Link href={`/packs/${pack.name}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="size-8 rounded-lg p-0 text-muted-foreground/40 hover:text-foreground"
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Delete"
                      onClick={() => handleDelete(pack.name)}
                      disabled={deletingPack === pack.name}
                      className="size-8 rounded-lg p-0 text-muted-foreground/30 hover:bg-red-500/10 hover:text-red-400"
                    >
                      {deletingPack === pack.name ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
