import { pages } from "@/configs/paths/pages.path";

export const OFFLINE = {
  worker: "/sw.js",
  routes: Object.values(pages),
  cacheTiles: process.env.NEXT_PUBLIC_MAP_OFFLINE_CACHE === "true",
} as const;
