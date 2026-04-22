import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import {
  resources as seedResources,
  type Category,
  type Resource,
} from "@/lib/resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES: Category[] = ["tools", "skills", "projects", "knowledge"];

type DbRow = {
  url: string;
  name: string;
  description: string;
  category: Category;
};

async function ensureSchemaAndSeed(): Promise<void> {
  await sql()`
    CREATE TABLE IF NOT EXISTS resources (
      url         TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category    TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const rows = (await sql()`SELECT COUNT(*)::int AS count FROM resources`) as {
    count: number;
  }[];
  if (rows[0]?.count === 0) {
    for (const r of seedResources) {
      await sql()`
        INSERT INTO resources (url, name, description, category)
        VALUES (${r.url}, ${r.name}, ${r.description}, ${r.category})
        ON CONFLICT (url) DO NOTHING
      `;
    }
  }
}

function deriveName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const root = host.split(".")[0] ?? host;
    return root.charAt(0).toUpperCase() + root.slice(1);
  } catch {
    return url;
  }
}

function unauthorized(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function checkAuth(req: NextRequest): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  const header = req.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  return provided.length > 0 && provided === token;
}

export async function GET() {
  try {
    await ensureSchemaAndSeed();
    const rows = (await sql()`
      SELECT url, name, description, category
      FROM resources
      ORDER BY created_at DESC
    `) as DbRow[];
    return Response.json({ resources: rows satisfies Resource[] });
  } catch (err) {
    console.error("GET /api/resources failed", err);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  let body: { url?: unknown; category?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  const category =
    typeof body.category === "string" ? (body.category as Category) : null;

  if (!url) return Response.json({ error: "Missing url" }, { status: 400 });
  try {
    new URL(url);
  } catch {
    return Response.json({ error: "Invalid url" }, { status: 400 });
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return Response.json({ error: "Invalid category" }, { status: 400 });
  }

  const name = deriveName(url);

  try {
    await ensureSchemaAndSeed();
    const inserted = (await sql()`
      INSERT INTO resources (url, name, description, category)
      VALUES (${url}, ${name}, ${""}, ${category})
      ON CONFLICT (url) DO NOTHING
      RETURNING url, name, description, category
    `) as DbRow[];

    if (inserted.length === 0) {
      return Response.json(
        { error: "Resource already exists" },
        { status: 409 },
      );
    }
    return Response.json({ resource: inserted[0] satisfies Resource });
  } catch (err) {
    console.error("POST /api/resources failed", err);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}
