import { NextRequest } from "next/server";

export const runtime = "edge";

type Preview = {
  title?: string;
  description?: string;
  image?: string;
  hostname: string;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function metaContent(html: string, key: string, attr: "property" | "name"): string | undefined {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  const m1 = html.match(re);
  if (m1?.[1]) return decodeEntities(m1[1]);
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*${attr}=["']${key}["']`,
    "i",
  );
  const m2 = html.match(re2);
  return m2?.[1] ? decodeEntities(m2[1]) : undefined;
}

function resolveUrl(base: string, maybeRelative?: string): string | undefined {
  if (!maybeRelative) return undefined;
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return undefined;
  }
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  if (!target) {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return Response.json({ error: "Invalid url" }, { status: 400 });
  }

  const hostname = parsed.hostname.replace(/^www\./, "");

  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      cache: "force-cache",
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!res.ok) {
      const preview: Preview = { hostname };
      return Response.json(preview, {
        headers: { "Cache-Control": "public, s-maxage=3600" },
      });
    }

    const html = (await res.text()).slice(0, 500_000);

    const title =
      metaContent(html, "og:title", "property") ??
      metaContent(html, "twitter:title", "name") ??
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();

    const description =
      metaContent(html, "og:description", "property") ??
      metaContent(html, "twitter:description", "name") ??
      metaContent(html, "description", "name");

    const rawImage =
      metaContent(html, "og:image", "property") ??
      metaContent(html, "og:image:url", "property") ??
      metaContent(html, "twitter:image", "name") ??
      metaContent(html, "twitter:image:src", "name");

    const image = resolveUrl(target, rawImage);

    const preview: Preview = {
      title: title ? decodeEntities(title).trim() : undefined,
      description: description?.trim(),
      image,
      hostname,
    };

    return Response.json(preview, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
  } catch {
    return Response.json({ hostname } satisfies Preview, {
      headers: { "Cache-Control": "public, s-maxage=3600" },
    });
  }
}
