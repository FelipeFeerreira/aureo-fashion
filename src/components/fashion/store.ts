"use client";
import { useSyncExternalStore } from "react";
import { z } from "zod/mini";
const schema = z
  .array(
    z.object({
      productId: z.string(),
      variantId: z.string(),
      size: z.string(),
      color: z.string(),
      quantity: z.int().check(z.gte(1), z.lte(10)),
      name: z.string(),
      image: z.string(),
      slug: z.string(),
    }),
  )
  .check(z.maxLength(30));
export type BagItem = z.infer<typeof schema>[number];
const empty: BagItem[] = [];
let cache: BagItem[] = empty,
  raw: string | null = null;
const listeners = new Set<() => void>();
function read() {
  try {
    const next = localStorage.getItem("aureo-bag-v1");
    if (next !== raw) {
      raw = next;
      const p = schema.safeParse(JSON.parse(next ?? "[]"));
      cache = p.success ? p.data : empty;
    }
  } catch {}
  return cache;
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
}
export function saveBag(items: BagItem[]) {
  cache = items;
  raw = JSON.stringify(items);
  try {
    localStorage.setItem("aureo-bag-v1", raw);
  } catch {}
  listeners.forEach((f) => f());
}
export function addBag(item: BagItem) {
  const items = read();
  const found = items.find((x) => x.variantId === item.variantId);
  saveBag(
    found
      ? items.map((x) =>
          x.variantId === item.variantId
            ? { ...x, quantity: Math.min(10, x.quantity + 1) }
            : x,
        )
      : [...items, item].slice(0, 30),
  );
}
export function useFashionCart() {
  return useSyncExternalStore(subscribe, read, () => empty);
}
