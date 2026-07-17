import "server-only";

import { cacheLife, cacheTag } from "next/cache";

export function assetDataCacheTag(userId: string) {
  return `user:${userId}:assets`;
}

export function goalDataCacheTag(userId: string) {
  return `user:${userId}:goals`;
}

export function cacheAssetData(userId: string) {
  cacheLife("minutes");
  cacheTag(assetDataCacheTag(userId));
}

export function cacheGoalData(userId: string) {
  cacheLife("minutes");
  cacheTag(goalDataCacheTag(userId));
}
