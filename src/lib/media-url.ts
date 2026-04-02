const TIGRIS_ENDPOINT = process.env.TIGRIS_ENDPOINT || "https://t3.storageapi.dev";
const TIGRIS_BUCKET = process.env.TIGRIS_BUCKET || "organized-room-aaohr-xd1x";

/**
 * Converts a Tigris direct URL to our /api/media proxy route.
 * e.g. https://t3.storageapi.dev/bucket/exercises/abc/img.jpg -> /api/media/exercises/abc/img.jpg
 */
export function proxyUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const prefix = `${TIGRIS_ENDPOINT}/${TIGRIS_BUCKET}/`;
  if (url.startsWith(prefix)) {
    const key = url.slice(prefix.length);
    return `/api/media/${key}`;
  }
  // Already a relative URL or external URL
  return url;
}
