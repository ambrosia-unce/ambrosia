import { auth } from "@/lib/auth";
import { ensureDb } from "@/lib/store";
import { db } from "@/db/index";
import { packs, users, userPacks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.githubId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureDb();

  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.githubId, session.user.githubId))
    .get();

  if (!user) {
    return Response.json({ packs: [] });
  }

  const rows = await db
    .select({
      name: packs.name,
      version: packs.version,
      description: packs.description,
      author: packs.author,
      category: packs.category,
      tags: packs.tags,
      downloads: packs.downloads,
      featured: packs.featured,
      publishedAt: packs.publishedAt,
      updatedAt: packs.updatedAt,
      repoUrl: packs.repoUrl,
    })
    .from(userPacks)
    .innerJoin(packs, eq(userPacks.packId, packs.id))
    .where(eq(userPacks.userId, user.id));

  return Response.json({
    packs: rows.map((r) => ({
      ...r,
      featured: !!r.featured,
      installCommand: `ambrosia add ${r.name}`,
    })),
  });
}
