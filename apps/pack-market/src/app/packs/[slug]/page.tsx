import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/header";
import { CategoryBadge } from "@/components/category-badge";
import { CopyCommand } from "@/components/copy-command";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPackDisplay, readRegistryItem, ensureDb } from "@/lib/store";
import { formatDate, formatNumber } from "@/lib/format";
import {
  ArrowDownToLine,
  ArrowLeft,
  Calendar,
  ExternalLink,
  FileCode,
  Github,
  Package,
  Star,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EthicalAd } from "@/components/ethical-ad";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  await ensureDb();
  const { slug } = await params;
  const pack = await getPackDisplay(slug);

  if (!pack) {
    return { title: "Pack Not Found" };
  }

  const title = `${pack.name} — Ambrosia Pack Market`;
  const description =
    pack.description || `Install ${pack.name} pack for the Ambrosia framework.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://packs.ambrosia.dev/packs/${slug}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PackDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await ensureDb();
  const { slug } = await params;
  const pack = await getPackDisplay(slug);

  if (!pack) {
    notFound();
  }

  const registryItem = await readRegistryItem(slug);
  const deps = registryItem ? Object.entries(registryItem.dependencies) : [];
  const devDeps = registryItem
    ? Object.entries(registryItem.devDependencies || {})
    : [];
  const registryDeps = registryItem?.registryDependencies || [];
  const files = registryItem?.files || [];
  const isOfficial = pack.author === "ambrosia";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: pack.name,
    description: pack.description,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform",
    softwareVersion: pack.version,
    author: {
      "@type": pack.author === "ambrosia" ? "Organization" : "Person",
      name: pack.author === "ambrosia" ? "Ambrosia" : pack.author,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    url: `https://packs.ambrosia.dev/packs/${slug}`,
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      {/* ============ Pack header ============ */}
      <div className="border-b border-border/30">
        <div className="container mx-auto px-6 py-8">
          <Link
            href="/packs"
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
          >
            <ArrowLeft className="size-3" />
            Back to packs
          </Link>

          <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h1 className="font-mono text-2xl font-bold tracking-tight">
                  {pack.name}
                </h1>
                {isOfficial && (
                  <Star className="size-4 fill-primary/50 text-primary/50" />
                )}
                <CategoryBadge category={pack.category as never} />
              </div>
              <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground/60">
                {pack.description}
              </p>

              {/* Quick stats inline */}
              <div className="flex items-center gap-4 text-[12px] text-muted-foreground/40">
                <span className="flex items-center gap-1.5">
                  <ArrowDownToLine className="size-3" />
                  <span className="tabular-nums">
                    {formatNumber(pack.downloads)}
                  </span>{" "}
                  downloads
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3" />
                  Updated {formatDate(pack.updatedAt || "")}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="size-3" />
                  {isOfficial ? "official" : pack.author}
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <CopyCommand command={pack.installCommand} className="w-80" />
            </div>
          </div>
        </div>
      </div>

      {/* ============ Content ============ */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main */}
          <main className="min-w-0 flex-1">
            <Tabs defaultValue="readme">
              <TabsList className="rounded-xl bg-muted/30">
                <TabsTrigger value="readme" className="rounded-lg text-[12px]">
                  Readme
                </TabsTrigger>
                <TabsTrigger
                  value="dependencies"
                  className="rounded-lg text-[12px]"
                >
                  Dependencies
                  {deps.length + devDeps.length + registryDeps.length > 0 && (
                    <span className="ml-1.5 text-[10px] text-muted-foreground/40">
                      {deps.length + devDeps.length + registryDeps.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="files" className="rounded-lg text-[12px]">
                  Files
                  {files.length > 0 && (
                    <span className="ml-1.5 text-[10px] text-muted-foreground/40">
                      {files.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="versions"
                  className="rounded-lg text-[12px]"
                >
                  Versions
                </TabsTrigger>
              </TabsList>

              {/* Readme */}
              <TabsContent value="readme" className="mt-6">
                {pack.readme ? (
                  <Markdown content={pack.readme} />
                ) : (
                  <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/30 py-16 text-center">
                    <FileCode className="size-8 text-muted-foreground/20" />
                    <p className="mt-3 text-[13px] text-muted-foreground/40">
                      No readme available.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Dependencies */}
              <TabsContent value="dependencies" className="mt-6 space-y-6">
                {deps.length > 0 && (
                  <DepSection title="Dependencies">
                    {deps.map(([dep, version]) => (
                      <DepRow key={dep} name={dep} version={version as string} />
                    ))}
                  </DepSection>
                )}
                {devDeps.length > 0 && (
                  <DepSection title="Dev Dependencies">
                    {devDeps.map(([dep, version]) => (
                      <DepRow key={dep} name={dep} version={version as string} />
                    ))}
                  </DepSection>
                )}
                {registryDeps.length > 0 && (
                  <DepSection title="Pack Dependencies">
                    {registryDeps.map((dep) => (
                      <Link
                        key={dep}
                        href={`/packs/${dep}`}
                        className="flex items-center gap-2.5 rounded-lg border border-border/30 bg-card/20 px-4 py-2.5 font-mono text-[12px] transition-all hover:border-primary/20 hover:bg-card/40"
                      >
                        <Package className="size-3.5 text-primary" />
                        {dep}
                      </Link>
                    ))}
                  </DepSection>
                )}
                {deps.length === 0 &&
                  devDeps.length === 0 &&
                  registryDeps.length === 0 && (
                    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/30 py-16 text-center">
                      <Package className="size-8 text-muted-foreground/20" />
                      <p className="mt-3 text-[13px] text-muted-foreground/40">
                        No dependencies.
                      </p>
                    </div>
                  )}
              </TabsContent>

              {/* Files */}
              <TabsContent value="files" className="mt-6">
                {files.length === 0 ? (
                  <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/30 py-16 text-center">
                    <FileCode className="size-8 text-muted-foreground/20" />
                    <p className="mt-3 text-[13px] text-muted-foreground/40">
                      No files available.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div
                        key={file.path}
                        className="overflow-hidden rounded-xl border border-border/30"
                      >
                        <div className="flex items-center gap-2.5 border-b border-border/20 bg-muted/20 px-4 py-2">
                          <FileCode className="size-3.5 text-muted-foreground/50" />
                          <span className="font-mono text-[12px] font-medium">
                            {file.path}
                          </span>
                          <Badge
                            variant="outline"
                            className="ml-auto rounded-md border-border/30 text-[10px] text-muted-foreground/40"
                          >
                            {file.type}
                          </Badge>
                        </div>
                        <pre className="overflow-x-auto bg-card/10 p-4 font-mono text-[11px] leading-relaxed text-muted-foreground/70">
                          {file.content}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Versions */}
              <TabsContent value="versions" className="mt-6">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between rounded-xl border border-border/30 bg-card/20 px-4 py-3 text-[13px]">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-medium">
                        v{pack.version}
                      </span>
                      <Badge
                        variant="secondary"
                        className="rounded-md text-[10px]"
                      >
                        latest
                      </Badge>
                    </div>
                    <span className="text-[12px] text-muted-foreground/40">
                      {formatDate(pack.updatedAt || pack.publishedAt || "")}
                    </span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </main>

          {/* ============ Sidebar ============ */}
          <aside className="shrink-0 lg:w-72">
            <div className="sticky top-20 space-y-5">
              {/* Meta card */}
              <div className="rounded-xl border border-border/30 bg-card/20 p-5">
                <div className="space-y-3.5">
                  <InfoRow
                    icon={Package}
                    label="Version"
                    value={`v${pack.version}`}
                  />
                  <InfoRow
                    icon={User}
                    label="Author"
                    value={isOfficial ? "official" : pack.author}
                  />
                  <InfoRow
                    icon={ArrowDownToLine}
                    label="Downloads"
                    value={formatNumber(pack.downloads)}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Updated"
                    value={formatDate(pack.updatedAt || "")}
                  />
                </div>
              </div>

              {/* Tags */}
              {pack.tags.length > 0 && (
                <div>
                  <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {pack.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/packs?search=${tag}`}
                        className="rounded-md border border-border/30 bg-card/20 px-2 py-0.5 text-[11px] text-muted-foreground/50 transition-colors hover:border-primary/20 hover:text-primary"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Ad placement */}
              <EthicalAd type="text" />

              {/* Install */}
              <div>
                <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40">
                  Install
                </h3>
                <CopyCommand command={pack.installCommand} />
              </div>

              {/* Source */}
              {pack.repoUrl && (
                <div>
                  <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40">
                    Source
                  </h3>
                  <a
                    href={pack.repoUrl}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-2 text-[12px] text-muted-foreground/50 transition-colors hover:text-primary"
                  >
                    <Github className="size-3.5" />
                    <span className="truncate">
                      {pack.repoUrl.replace("https://github.com/", "")}
                    </span>
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <div className="flex items-center gap-2.5 text-muted-foreground/50">
        <Icon className="size-3.5" />
        {label}
      </div>
      <span className="font-mono text-[11px] font-medium">{value}</span>
    </div>
  );
}

function DepSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40">
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function DepRow({ name, version }: { name: string; version: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/30 bg-card/20 px-4 py-2.5 font-mono text-[12px]">
      <div className="flex items-center gap-2.5">
        <Package className="size-3.5 text-muted-foreground/40" />
        {name}
      </div>
      <span className="text-[11px] text-muted-foreground/40">{version}</span>
    </div>
  );
}
