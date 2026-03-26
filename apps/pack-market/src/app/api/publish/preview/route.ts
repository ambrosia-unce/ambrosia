import { auth } from "@/lib/auth";
import { parseRepoUrl, fetchManifest } from "@/lib/github";
import { validateManifest } from "@/lib/validation";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
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

  let manifest: Awaited<ReturnType<typeof fetchManifest>>;
  try {
    manifest = await fetchManifest(parsed.owner, parsed.repo, session.accessToken);
  } catch (err) {
    return Response.json(
      { error: `Could not read registry.json: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    return Response.json(
      { error: "Validation failed", details: errors },
      { status: 400 }
    );
  }

  return Response.json({
    registry: manifest.name,
    items: manifest.items.map((item) => ({
      name: item.name,
      version: item.version,
      description: item.description,
      author: item.author,
      category: item.category,
      tags: item.tags,
      fileCount: item.files.length,
      files: item.files.map((f) => f.path),
      dependencies: item.dependencies || {},
      registryDependencies: item.registryDependencies || [],
    })),
  });
}
