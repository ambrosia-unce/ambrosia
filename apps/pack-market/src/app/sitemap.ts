import type { MetadataRoute } from "next";
import { getPackDisplayList, ensureDb } from "@/lib/store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await ensureDb();
  const packs = await getPackDisplayList();

  const packEntries: MetadataRoute.Sitemap = packs.map((pack) => ({
    url: `https://packs.ambrosia.dev/packs/${pack.name}`,
    lastModified: pack.updatedAt ? new Date(pack.updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    {
      url: "https://packs.ambrosia.dev",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://packs.ambrosia.dev/packs",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...packEntries,
  ];
}
