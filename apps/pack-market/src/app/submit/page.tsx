"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/category-badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileCode,
  GitBranch,
  Loader2,
  Plus,
  Search,
} from "lucide-react";

interface GithubRepo {
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  private: boolean;
  language: string | null;
  pushedAt: string;
}

interface PreviewItem {
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  fileCount: number;
  files: string[];
  dependencies: Record<string, string>;
  registryDependencies: string[];
}

interface PreviewResult {
  registry: string;
  items: PreviewItem[];
}

interface PublishResult {
  success: boolean;
  packs: { name: string; version: string; status: "created" | "updated" }[];
}

type Step = 1 | 2 | 3;

const steps = [
  { num: 1 as Step, label: "Select Repository" },
  { num: 2 as Step, label: "Preview" },
  { num: 3 as Step, label: "Published" },
];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-full text-xs font-medium transition-all duration-300",
              s.num < current
                ? "bg-primary text-primary-foreground"
                : s.num === current
                  ? "bg-primary text-primary-foreground glow-sm"
                  : "border border-border/60 text-muted-foreground",
            )}
          >
            {s.num < current ? <Check className="size-3.5" /> : s.num}
          </div>
          <span
            className={cn(
              "hidden text-sm sm:inline",
              s.num === current
                ? "font-medium text-foreground"
                : s.num < current
                  ? "text-foreground"
                  : "text-muted-foreground",
            )}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "mx-1 h-px w-8 transition-colors",
                s.num < current ? "bg-primary/50" : "bg-border/60",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

const languageColors: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  Rust: "bg-orange-500",
  Go: "bg-cyan-400",
  Python: "bg-green-500",
};

export default function SubmitPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [repoUrl, setRepoUrl] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);

  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [reposError, setReposError] = useState<string | null>(null);
  const [repoSearch, setRepoSearch] = useState("");

  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [publishing, setPublishing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/github/repos");
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setReposError(data.error || "Failed to load repositories");
          return;
        }
        setRepos(data.repos);
      } catch {
        if (!cancelled) setReposError("Network error loading repositories");
      } finally {
        if (!cancelled) setReposLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "loading") return null;
  if (!session) {
    router.push("/login");
    return null;
  }

  const doPreview = async (url: string) => {
    setError(null);
    setPreview(null);
    setPreviewLoading(true);

    try {
      const res = await fetch("/api/publish/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) {
        let msg = data.error || "Preview failed";
        if (data.details) {
          msg += `: ${data.details.map((d: { message: string }) => d.message).join(", ")}`;
        }
        setError(msg);
        return;
      }
      setPreview(data);
      setStep(2);
    } catch {
      setError("Network error");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRepoClick = (repo: GithubRepo) => {
    setSelectedRepo(repo);
    setRepoUrl(repo.htmlUrl);
    doPreview(repo.htmlUrl);
  };

  const handleManualPreview = () => {
    if (!repoUrl) return;
    setSelectedRepo(null);
    doPreview(repoUrl);
  };

  const handlePublish = async () => {
    setError(null);
    setPublishing(true);

    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Publish failed");
        return;
      }
      setPublishResult(data);
      setStep(3);
    } catch {
      setError("Network error");
    } finally {
      setPublishing(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setRepoUrl("");
    setSelectedRepo(null);
    setPreview(null);
    setPublishResult(null);
    setError(null);
  };

  const handleBack = () => {
    setError(null);
    setPreview(null);
    setStep(1);
  };

  const filteredRepos = repos.filter((r) => {
    if (!repoSearch) return true;
    const q = repoSearch.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.description?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Submit Pack</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Publish a pack from your GitHub repository.
            </p>
          </div>
          <StepIndicator current={step} />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Preview loader */}
        {previewLoading && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/30 p-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Fetching registry.json and validating...
          </div>
        )}

        {/* Step 1: Select Repository */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-sm font-semibold">Your Repositories</h2>
                {!reposLoading && repos.length > 0 && (
                  <div className="relative max-w-xs flex-1">
                    <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
                    <Input
                      placeholder="Filter repos..."
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      className="h-9 rounded-xl border-border/60 bg-muted/30 pl-9 text-sm"
                    />
                  </div>
                )}
              </div>

              {reposLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={`skel-${i}`}
                      className="animate-pulse rounded-xl border border-border/40 p-4"
                    >
                      <div className="h-4 w-2/3 rounded-lg bg-muted/50" />
                      <div className="mt-3 h-3 w-full rounded-lg bg-muted/50" />
                      <div className="mt-2 h-3 w-1/3 rounded-lg bg-muted/50" />
                    </div>
                  ))}
                </div>
              ) : reposError ? (
                <div className="rounded-2xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">
                  {reposError}
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">
                  {repoSearch
                    ? "No repos match your search."
                    : "No repositories found."}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredRepos.map((repo) => (
                    <button
                      key={repo.fullName}
                      type="button"
                      onClick={() => handleRepoClick(repo)}
                      disabled={previewLoading}
                      className={cn(
                        "group flex flex-col items-start rounded-xl border border-border/60 bg-card/30 p-4 text-left transition-all duration-200 hover:border-primary/30 hover:bg-card/60",
                        previewLoading && "pointer-events-none opacity-50",
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-mono text-sm font-medium">
                          {repo.name}
                        </span>
                        <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </div>
                      {repo.description && (
                        <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">
                          {repo.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        {repo.language && (
                          <span className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "size-2 rounded-full",
                                languageColors[repo.language] || "bg-gray-400",
                              )}
                            />
                            {repo.language}
                          </span>
                        )}
                        <span>{formatDate(repo.pushedAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Manual URL divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-xs text-muted-foreground">
                  or enter URL manually
                </span>
              </div>
            </div>

            {/* Manual URL input */}
            <div className="flex gap-3">
              <Input
                placeholder="https://github.com/username/my-pack"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="max-w-md rounded-xl border-border/60 bg-muted/30"
              />
              <Button
                onClick={handleManualPreview}
                disabled={!repoUrl || previewLoading}
                className="rounded-xl"
              >
                {previewLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Preview
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Your repository must contain a{" "}
              <code className="rounded-md bg-muted/50 px-1.5 py-0.5">registry.json</code>{" "}
              manifest at the root.
            </p>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && preview && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/30 px-5 py-4">
              <GitBranch className="size-4 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm font-medium">
                  {selectedRepo?.fullName || repoUrl}
                </p>
                {selectedRepo?.description && (
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedRepo.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {preview.items.length}{" "}
                {preview.items.length === 1 ? "pack" : "packs"} found
              </h2>
            </div>

            {preview.items.map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-border/60 bg-card/50 p-5"
              >
                <div className="flex items-center gap-3">
                  <h3 className="font-mono font-semibold">{item.name}</h3>
                  <Badge variant="secondary" className="rounded-lg">
                    v{item.version}
                  </Badge>
                  <CategoryBadge category={item.category as never} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="rounded-lg text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    <FileCode className="mr-1.5 inline size-3" />
                    {item.fileCount} files
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.files.map((f) => (
                      <code
                        key={f}
                        className="rounded-md bg-muted/40 px-2 py-0.5 text-xs"
                      >
                        {f}
                      </code>
                    ))}
                  </div>
                </div>

                {Object.keys(item.dependencies).length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Dependencies
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {Object.entries(item.dependencies).map(([dep, ver]) => (
                        <code
                          key={dep}
                          className="rounded-md bg-muted/40 px-2 py-0.5 text-xs"
                        >
                          {dep}@{ver}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="flex items-center justify-between pt-3">
              <Button variant="outline" onClick={handleBack} className="rounded-xl">
                <ArrowLeft className="mr-2 size-4" />
                Back
              </Button>
              <Button onClick={handlePublish} disabled={publishing} className="rounded-xl">
                {publishing ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Publish {preview.items.length}{" "}
                {preview.items.length === 1 ? "pack" : "packs"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Published */}
        {step === 3 && publishResult && (
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 text-green-400">
              <CheckCircle2 className="size-6" />
              <h2 className="text-lg font-semibold">Published!</h2>
            </div>

            {publishResult.packs.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-4"
              >
                <span className="font-mono font-medium">{p.name}</span>
                <Badge variant="secondary" className="rounded-lg">
                  v{p.version}
                </Badge>
                <Badge
                  variant={p.status === "created" ? "default" : "secondary"}
                  className="rounded-lg"
                >
                  {p.status}
                </Badge>
              </div>
            ))}

            <p className="text-sm text-muted-foreground">
              Your packs are now available via{" "}
              <code className="rounded-md bg-muted/40 px-1.5 py-0.5">ambrosia add</code>.
            </p>

            <Button variant="outline" onClick={handleReset} className="rounded-xl">
              <Plus className="mr-2 size-4" />
              Submit another pack
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
