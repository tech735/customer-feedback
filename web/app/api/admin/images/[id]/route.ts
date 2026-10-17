import fs from "node:fs/promises";
import { isAdmin } from "@/lib/server/auth";
import { getImageFile } from "@/lib/server/db";

// Uploaded photos are private: only a signed-in admin can load them.
export async function GET(_request: Request, ctx: RouteContext<"/api/admin/images/[id]">) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const image = /^[0-9a-f-]{36}$/.test(id) ? getImageFile(id) : null;
  if (!image) return new Response("Not found", { status: 404 });

  let bytes: Buffer;
  try {
    bytes = await fs.readFile(image.filePath);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
