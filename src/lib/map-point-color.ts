import { MAP_POINT_COLORS } from "@/configs/consts/map.const";

export function mapPointColor(pointId: string): string {
  // Seed the color with the ID so filtering and remounting keep it stable.
  let hash = 0;
  for (let index = 0; index < pointId.length; index++) {
    hash = (Math.imul(31, hash) + pointId.charCodeAt(index)) | 0;
  }
  return MAP_POINT_COLORS[(hash >>> 0) % MAP_POINT_COLORS.length];
}
