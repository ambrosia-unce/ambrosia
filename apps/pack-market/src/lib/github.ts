import type {
  RegistryItem,
  RegistryFile,
  RegistryManifest,
  ManifestItem,
} from "./registry-types";

const GITHUB_API = "https://api.github.com";

export function parseRepoUrl(
  url: string
): { owner: string; repo: string } | null {
  const match = url.match(
    /(?:https?:\/\/)?(?:github\.com\/)?([^/\s]+)\/([^/\s#?.]+)/
  );
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

export async function fetchRepoFile(
  owner: string,
  repo: string,
  path: string,
  accessToken: string
): Promise<string> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3.raw",
    },
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error(`File not found: ${path}`);
    throw new Error(`GitHub API error: ${res.status} for ${path}`);
  }
  return res.text();
}

export async function fetchManifest(
  owner: string,
  repo: string,
  accessToken: string
): Promise<RegistryManifest> {
  const content = await fetchRepoFile(owner, repo, "registry.json", accessToken);
  return JSON.parse(content) as RegistryManifest;
}

export async function buildItemFromGitHub(
  owner: string,
  repo: string,
  item: ManifestItem,
  accessToken: string
): Promise<RegistryItem> {
  const files: RegistryFile[] = [];

  for (const fileRef of item.files) {
    const content = await fetchRepoFile(owner, repo, fileRef.path, accessToken);

    // Normalize path: strip leading directory segments like "packs/name/"
    const segments = fileRef.path.split("/");
    const normalizedPath =
      segments.length > 1 ? segments[segments.length - 1] : fileRef.path;

    files.push({ path: normalizedPath, content, type: fileRef.type });
  }

  return {
    name: item.name,
    version: item.version,
    description: item.description,
    author: item.author,
    tags: item.tags,
    category: item.category,
    files,
    dependencies: item.dependencies || {},
    devDependencies: item.devDependencies || {},
    registryDependencies: item.registryDependencies || [],
    ambrosiaDependencies: item.ambrosiaDependencies || [],
  };
}
