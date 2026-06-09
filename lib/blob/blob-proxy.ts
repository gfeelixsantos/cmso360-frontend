export function toProxyUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const base = `/api/blob/proxy?url=${encodeURIComponent(url)}`;
  return `${base}&_t=${Date.now()}`;
}
