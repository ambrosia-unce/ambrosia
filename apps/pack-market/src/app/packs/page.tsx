import { getPackDisplayList, ensureDb } from "@/lib/store";
import type { PackCategory, Pack } from "@/data/packs";
import { BrowseClient } from "./browse-client";

export const dynamic = "force-dynamic";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  await ensureDb();
  const allPacks = await getPackDisplayList();
  const { category, q } = await searchParams;

  const packs: Pack[] = allPacks.map((p) => ({
    slug: p.name,
    name: p.name,
    description: p.description,
    version: p.version,
    author: p.author,
    category: p.category as PackCategory,
    tags: p.tags,
    downloads: p.downloads,
    updatedAt: p.updatedAt,
    dependencies: [],
    installCommand: p.installCommand,
    featured: p.featured,
    readme: "",
  }));

  return <BrowseClient packs={packs} initialCategory={category || null} initialSearch={q || ""} />;
}
