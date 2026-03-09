// src/utils/prefetchImage.js
const cache = new Map<string, Promise<boolean>>();

export function prefetchImage(url: string): Promise<boolean> {
  if (!url) return Promise.resolve(false);
  const cached = cache.get(url);
  if (cached) return cached;

  const p: Promise<boolean> = new Promise<boolean>((resolve, reject) => {
    const img = new window.Image();

    img.onload = ():void => {
      resolve(true);
    };

    img.onerror = ():void => {
      reject(new Error(`Failed to load image: ${url}`));
    };

    img.src = url;
  });

  cache.set(url, p);
  return p;
}
