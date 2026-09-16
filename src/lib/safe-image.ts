const allowedHosts = ["res.cloudinary.com"];

export function isSafeImageSrc(src?: string | null): boolean {
  if (!src) return false;
  if (src.startsWith("/")) return !src.startsWith("//") && !src.includes("\\");
  try {
    const url = new URL(src);
    return url.protocol === "https:" && allowedHosts.includes(url.hostname);
  } catch {
    return false;
  }
}

export function getSafeImageSrc(
  src: string | null | undefined,
  fallback: string,
): string {
  return isSafeImageSrc(src) ? (src as string) : fallback;
}
