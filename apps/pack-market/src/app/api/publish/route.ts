import { auth } from "@/lib/auth";
import { parseRepoUrl, fetchManifest, buildItemFromGitHub } from "@/lib/github";
import { validateManifest, validateFileSizes } from "@/lib/validation";
import {
  ensureDb,
  readPacksMeta,
  writeRegistryItem,
  writePackMeta,
  addPackToUser,
} from "@/lib/store";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.accessToken || !session?.user?.githubId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { repoUrl?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { repoUrl } = body;
  if (!repoUrl) {
    return Response.json({ error: "repoUrl is required" }, { status: 400 });
  }

  const parsed = parseRepoUrl(repoUrl);
  if (!parsed) {
    return Response.json({ error: "Invalid GitHub repo URL" }, { status: 400 });
  }

  // Fetch registry.json from repo
  let manifest: Awaited<ReturnType<typeof fetchManifest>>;
  try {
    manifest = await fetchManifest(parsed.owner, parsed.repo, session.accessToken);
  } catch (err) {
    return Response.json(
      { error: `Could not read registry.json: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  // Validate manifest structure
  const manifestErrors = validateManifest(manifest);
  if (manifestErrors.length > 0) {
    return Response.json(
      { error: "Validation failed", details: manifestErrors },
      { status: 400 }
    );
  }

  await ensureDb();

  // Check ownership
  const meta = await readPacksMeta();
  for (const item of manifest.items) {
    const existing = meta[item.name];
    if (existing && existing.githubId !== session.user.githubId) {
      return Response.json(
        { error: `Pack "${item.name}" is owned by @${existing.publishedBy}` },
        { status: 403 }
      );
    }
  }

  // Build each item
  const results: { name: string; version: string; status: "created" | "updated" }[] = [];

  for (const item of manifest.items) {
    let registryItem: Awaited<ReturnType<typeof buildItemFromGitHub>>;
    try {
      registryItem = await buildItemFromGitHub(
        parsed.owner,
        parsed.repo,
        item,
        session.accessToken
      );
    } catch (err) {
      return Response.json(
        { error: `Failed to fetch files for "${item.name}": ${(err as Error).message}` },
        { status: 400 }
      );
    }

    // Validate file sizes
    const sizeErrors = validateFileSizes(registryItem.files);
    if (sizeErrors.length > 0) {
      return Response.json(
        { error: `File size validation failed for "${item.name}"`, details: sizeErrors },
        { status: 400 }
      );
    }

    const isUpdate = !!meta[item.name];

    await writeRegistryItem(item.name, registryItem);
    await writePackMeta(item.name, {
      name: item.name,
      publishedBy: session.user.username,
      githubId: session.user.githubId,
      repoUrl: `https://github.com/${parsed.owner}/${parsed.repo}`,
      publishedAt: meta[item.name]?.publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: meta[item.name]?.downloads || 0,
      featured: meta[item.name]?.featured || false,
    });
    await addPackToUser(session.user.githubId, item.name);

    results.push({
      name: item.name,
      version: item.version,
      status: isUpdate ? "updated" : "created",
    });
  }

  return Response.json({ success: true, packs: results });
}
