// src/utils/prefetchImage.js
const cache = new Map();

export function prefetchImage(url:string) {
  if (!url) return Promise.resolve(false);
  if (cache.has(url)) return cache.get(url);

  const p = new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(true);
    img.onerror = reject;
    img.src = url;
  });

  cache.set(url, p);
  return p;
}
