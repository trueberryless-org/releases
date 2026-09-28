import releases from "../data/releases.json";
import { RELEASES_LIMIT } from "./config.ts";
import type { Release } from "./releases.ts";

export function getRecentReleases(): Release[] {
  return releases.slice(0, RELEASES_LIMIT);
}

export function getLastReleaseDate(): Date | undefined {
  const [lastRelease] = getRecentReleases();
  return lastRelease ? new Date(lastRelease.publishedAt) : undefined;
}
