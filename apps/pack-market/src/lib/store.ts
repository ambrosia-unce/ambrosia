import { and, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/db/index";
import { packs, users, userPacks } from "@/db/schema";
import type {
  RegistryItem,
  RegistryIndex,
  RegistryIndexEntry,
} from "./registry-types";
import type { PackMeta, UserRecord, PackDisplay } from "./types";
import { packs as seedPacks } from "@/data/packs";

// ---------------------------------------------------------------------------
// Registry items
// ---------------------------------------------------------------------------

export async function readRegistryItem(
  name: string
): Promise<RegistryItem | null> {
  const row = await db
    .select()
    .from(packs)
    .where(eq(packs.name, name))
    .get();

  if (!row) return null;

  return {
    name: row.name,
    version: row.version,
    description: row.description,
    author: row.author,
    category: row.category as RegistryItem["category"],
    tags: row.tags,
    files: row.files,
    dependencies: row.dependencies,
    devDependencies: row.devDependencies,
    registryDependencies: row.registryDeps,
    ambrosiaDependencies: row.ambrosiaDeps,
  };
}

export async function writeRegistryItem(
  name: string,
  item: RegistryItem
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .insert(packs)
    .values({
      name,
      version: item.version,
      description: item.description,
      author: item.author,
      category: item.category,
      tags: item.tags,
      files: item.files,
      dependencies: item.dependencies,
      devDependencies: item.devDependencies,
      registryDeps: item.registryDependencies,
      ambrosiaDeps: item.ambrosiaDependencies,
      publishedBy: "",
      githubId: 0,
      publishedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: packs.name,
      set: {
        version: item.version,
        description: item.description,
        author: item.author,
        category: item.category,
        tags: item.tags,
        files: item.files,
        dependencies: item.dependencies,
        devDependencies: item.devDependencies,
        registryDeps: item.registryDependencies,
        ambrosiaDeps: item.ambrosiaDependencies,
      },
    });
}

export async function deleteRegistryItem(name: string): Promise<boolean> {
  const result = await db.delete(packs).where(eq(packs.name, name));
  return (result.rowsAffected ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Index (computed from DB, no separate file needed)
// ---------------------------------------------------------------------------

export async function readIndex(): Promise<RegistryIndex> {
  const rows = await db
    .select({
      name: packs.name,
      version: packs.version,
      description: packs.description,
      author: packs.author,
      category: packs.category,
      tags: packs.tags,
    })
    .from(packs);

  const entries: RegistryIndexEntry[] = rows.map((r) => ({
    name: r.name,
    version: r.version,
    description: r.description,
    author: r.author,
    category: r.category as RegistryIndexEntry["category"],
    tags: r.tags,
  }));

  return { packs: entries };
}

/** No-op — index is now computed from DB on the fly. */
export async function regenerateIndex(): Promise<void> {}

// ---------------------------------------------------------------------------
// Pack metadata
// ---------------------------------------------------------------------------

export async function readPacksMeta(): Promise<Record<string, PackMeta>> {
  const rows = await db.select().from(packs);
  const result: Record<string, PackMeta> = {};
  for (const r of rows) {
    result[r.name] = {
      name: r.name,
      publishedBy: r.publishedBy,
      githubId: r.githubId,
      repoUrl: r.repoUrl,
      publishedAt: r.publishedAt,
      updatedAt: r.updatedAt,
      downloads: r.downloads,
      featured: r.featured ? true : false,
    };
  }
  return result;
}

export async function writePackMeta(
  name: string,
  meta: PackMeta
): Promise<void> {
  await db
    .update(packs)
    .set({
      publishedBy: meta.publishedBy,
      githubId: meta.githubId,
      repoUrl: meta.repoUrl,
      downloads: meta.downloads,
      featured: meta.featured,
      publishedAt: meta.publishedAt,
      updatedAt: meta.updatedAt,
    })
    .where(eq(packs.name, name));
}

/** No-op — pack and meta are in the same table. deleteRegistryItem handles both. */
export async function deletePackMeta(_name: string): Promise<void> {}

export async function incrementDownloads(name: string): Promise<void> {
  await db
    .update(packs)
    .set({ downloads: sql`${packs.downloads} + 1` })
    .where(eq(packs.name, name));
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function getOrCreateUser(profile: {
  githubId: number;
  username: string;
  avatarUrl: string;
}): Promise<UserRecord> {
  await db
    .insert(users)
    .values({
      githubId: profile.githubId,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      createdAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: users.githubId,
      set: {
        username: profile.username,
        avatarUrl: profile.avatarUrl,
      },
    });

  const user = await db
    .select()
    .from(users)
    .where(eq(users.githubId, profile.githubId))
    .get();

  // Get user's pack names
  const packLinks = user
    ? await db
        .select({ name: packs.name })
        .from(userPacks)
        .innerJoin(packs, eq(userPacks.packId, packs.id))
        .where(eq(userPacks.userId, user.id))
    : [];

  return {
    githubId: profile.githubId,
    username: user?.username || profile.username,
    avatarUrl: user?.avatarUrl || profile.avatarUrl,
    packs: packLinks.map((p) => p.name),
    createdAt: user?.createdAt || new Date().toISOString(),
  };
}

export async function addPackToUser(
  githubId: number,
  packName: string
): Promise<void> {
  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.githubId, githubId))
    .get();
  const pack = await db
    .select({ id: packs.id })
    .from(packs)
    .where(eq(packs.name, packName))
    .get();

  if (user && pack) {
    await db
      .insert(userPacks)
      .values({ userId: user.id, packId: pack.id })
      .onConflictDoNothing();
  }
}

export async function removePackFromUser(
  githubId: number,
  packName: string
): Promise<void> {
  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.githubId, githubId))
    .get();
  const pack = await db
    .select({ id: packs.id })
    .from(packs)
    .where(eq(packs.name, packName))
    .get();

  if (user && pack) {
    await db
      .delete(userPacks)
      .where(
        sql`${userPacks.userId} = ${user.id} AND ${userPacks.packId} = ${pack.id}`
      );
  }
}

// ---------------------------------------------------------------------------
// Combined (for UI)
// ---------------------------------------------------------------------------

export async function getPackDisplayList(): Promise<PackDisplay[]> {
  const rows = await db.select().from(packs);
  return rows.map(rowToPackDisplay);
}

export async function getPackDisplay(
  name: string
): Promise<PackDisplay | null> {
  const row = await db
    .select()
    .from(packs)
    .where(eq(packs.name, name))
    .get();

  if (!row) return null;
  return rowToPackDisplay(row);
}

export async function searchPackDisplays(
  query: string,
  category?: string
): Promise<PackDisplay[]> {
  if (!query && !category) return getPackDisplayList();

  const searchCondition = query
    ? or(
        like(packs.name, `%${query}%`),
        like(packs.description, `%${query}%`),
        like(packs.tags, `%${query}%`)
      )
    : undefined;

  const categoryCondition = category
    ? eq(packs.category, category)
    : undefined;

  const whereClause =
    searchCondition && categoryCondition
      ? and(searchCondition, categoryCondition)
      : searchCondition || categoryCondition;

  const rows = whereClause
    ? await db.select().from(packs).where(whereClause)
    : await db.select().from(packs);

  return rows.map(rowToPackDisplay);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowToPackDisplay(row: typeof packs.$inferSelect): PackDisplay {
  return {
    name: row.name,
    version: row.version,
    description: row.description,
    author: row.author,
    tags: row.tags,
    category: row.category as PackDisplay["category"],
    publishedBy: row.publishedBy || row.author,
    repoUrl: row.repoUrl,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    downloads: row.downloads,
    featured: row.featured ? true : false,
    installCommand: `ambrosia add ${row.name}`,
    readme:
      row.files.find((f) => f.path === "README.md")?.content ||
      row.readme ||
      "",
  };
}

// ---------------------------------------------------------------------------
// Initialization / Seed
// ---------------------------------------------------------------------------

let initialized = false;

export async function ensureDb(): Promise<void> {
  if (initialized) return;

  // Check if DB has any packs, seed if empty
  const count = await db
    .select({ count: sql<number>`count(*)` })
    .from(packs)
    .get();

  if (!count || count.count === 0) {
    await seedFromHardcodedPacks();
  }

  initialized = true;
}

/** @deprecated Use ensureDb() instead */
export const ensureDataDir = ensureDb;

async function seedFromHardcodedPacks(): Promise<void> {
  for (const pack of seedPacks) {
    await db
      .insert(packs)
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
}
