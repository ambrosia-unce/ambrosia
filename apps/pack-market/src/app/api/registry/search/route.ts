import { searchPackDisplays, ensureDb } from "@/lib/store";

export async function GET(req: Request) {
  await ensureDb();
  const url = new URL(req.url);
  const query = url.searchParams.get("q") || "";
  const category = url.searchParams.get("category") || undefined;
  const results = await searchPackDisplays(query, category);

  return Response.json({
    packs: results.map((p) => ({
      name: p.name,
      version: p.version,
      description: p.description,
      author: p.author,
      category: p.category,
      tags: p.tags,
      downloads: p.downloads,
    })),
  });
}
