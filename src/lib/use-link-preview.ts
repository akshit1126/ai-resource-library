"use client";

import { useEffect, useState } from "react";

export type LinkPreview = {
  title?: string;
  description?: string;
  image?: string;
  hostname: string;
};

const cache = new Map<string, LinkPreview>();
const inflight = new Map<string, Promise<LinkPreview>>();

async function fetchPreview(url: string): Promise<LinkPreview> {
  if (cache.has(url)) return cache.get(url)!;
  if (inflight.has(url)) return inflight.get(url)!;

  const promise = fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
    .then((r) => r.json() as Promise<LinkPreview>)
    .then((data) => {
      cache.set(url, data);
      inflight.delete(url);
      return data;
    })
    .catch(() => {
      const fallback: LinkPreview = {
        hostname: (() => {
          try {
            return new URL(url).hostname.replace(/^www\./, "");
          } catch {
            return url;
          }
        })(),
      };
      cache.set(url, fallback);
      inflight.delete(url);
      return fallback;
    });

  inflight.set(url, promise);
  return promise;
}

export function useLinkPreview(url: string): LinkPreview | null {
  const [preview, setPreview] = useState<LinkPreview | null>(
    () => cache.get(url) ?? null,
  );

  useEffect(() => {
    let active = true;
    if (cache.has(url)) {
      setPreview(cache.get(url)!);
      return;
    }
    fetchPreview(url).then((data) => {
      if (active) setPreview(data);
    });
    return () => {
      active = false;
    };
  }, [url]);

  return preview;
}
