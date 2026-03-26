import { auth } from "@/lib/auth";
import {
  readIndex,
  readRegistryItem,
  incrementDownloads,
  deleteRegistryItem,
  removePackFromUser,
  readPacksMeta,
  ensureDb,
} from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  await ensureDb();
  const { name } = await params;

  if (name === "index.json") {
    const index = await readIndex();
    return Response.json(index);
  }

  const packName = name.endsWith(".json") ? name.slice(0, -5) : name;
  const item = await readRegistryItem(packName);
  if (!item) {
    return Response.json({ error: "Pack not found" }, { status: 404 });
  }

  // Fire-and-forget download counter
  incrementDownloads(packName).catch(() => {});

  return Response.json(item);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const session = await auth();
  if (!session?.user?.githubId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureDb();
  const { name } = await params;
  const packName = name.endsWith(".json") ? name.slice(0, -5) : name;

  const meta = await readPacksMeta();
  const packMeta = meta[packName];
  if (!packMeta) {
    return Response.json({ error: "Pack not found" }, { status: 404 });
  }
  if (packMeta.githubId !== session.user.githubId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await removePackFromUser(session.user.githubId, packName);
  await deleteRegistryItem(packName);

  return Response.json({ success: true });
}
