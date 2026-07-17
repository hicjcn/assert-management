import { beforeEach, describe, expect, it, vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("next/cache", () => cacheMocks);

import {
  assetDataCacheTag,
  cacheAssetData,
  cacheGoalData,
  goalDataCacheTag,
} from "@/server/cache";

describe("user data cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds isolated cache tags for each user and data domain", () => {
    expect(assetDataCacheTag("user-1")).toBe("user:user-1:assets");
    expect(assetDataCacheTag("user-2")).toBe("user:user-2:assets");
    expect(goalDataCacheTag("user-1")).toBe("user:user-1:goals");
  });

  it("uses the minutes profile for asset data", () => {
    cacheAssetData("user-1");

    expect(cacheMocks.cacheLife).toHaveBeenCalledWith("minutes");
    expect(cacheMocks.cacheTag).toHaveBeenCalledWith("user:user-1:assets");
  });

  it("uses the minutes profile for goal data", () => {
    cacheGoalData("user-1");

    expect(cacheMocks.cacheLife).toHaveBeenCalledWith("minutes");
    expect(cacheMocks.cacheTag).toHaveBeenCalledWith("user:user-1:goals");
  });
});
