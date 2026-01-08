// src/routing/query.js
export function parseQuery(search) {
  const sp = new URLSearchParams(search || "");
  const obj = {};
  for (const [k, v] of sp.entries()) {
    // basic coercion: "0"/"1"/numbers become numbers when reasonable
    const num = Number(v);
    obj[k] = Number.isFinite(num) && String(num) === v ? num : v;
  }
  return obj;
}
