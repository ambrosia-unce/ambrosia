import { auth } from "@/lib/auth";

interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  language: string | null;
  pushed_at: string;
}

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(
    "https://api.github.com/user/repos?sort=pushed&per_page=100&type=owner&direction=desc",
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (!res.ok) {
    if (res.status === 403 || res.status === 401) {
      return Response.json(
        {
          error: "GitHub API access denied. Try signing out and back in.",
          code: "REAUTH_REQUIRED",
        },
        { status: 403 },
      );
    }
    return Response.json(
      { error: `GitHub API error: ${res.status}` },
      { status: 502 },
    );
  }

  const data: GitHubRepo[] = await res.json();

  return Response.json({
    repos: data.map((r) => ({
      name: r.name,
      fullName: r.full_name,
      htmlUrl: r.html_url,
      description: r.description,
      private: r.private,
      language: r.language,
      pushedAt: r.pushed_at,
    })),
  });
}
