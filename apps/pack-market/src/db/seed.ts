import { db } from "./index";
import { packs as packsTable } from "./schema";
import { packs as seedPacks } from "../data/packs";

async function seed() {
  console.log("Seeding database...");

  for (const pack of seedPacks) {
    await db
      .insert(packsTable)
      .values({
        name: pack.slug,
        version: pack.version,
        description: pack.description,
        author: pack.author,
        category: pack.category,
        tags: pack.tags,
        files: [],
        dependencies: Object.fromEntries(
          pack.dependencies.map((d) => [d, "latest"])
        ),
        devDependencies: {},
        registryDeps: [],
        ambrosiaDeps: [],
        publishedBy: pack.author,
        githubId: 0,
        repoUrl: "",
        downloads: pack.downloads,
        featured: pack.featured,
        publishedAt: pack.updatedAt,
        updatedAt: pack.updatedAt,
        readme: "",
      })
      .onConflictDoNothing();
  }

  console.log(`Seeded ${seedPacks.length} packs.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
