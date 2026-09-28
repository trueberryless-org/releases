import { writeFile } from "node:fs/promises";

import { GITHUB_ORGANIZATION, RELEASES_LIMIT } from "../src/libs/config.ts";
import { fetchOrganizationRepositories } from "../src/libs/github.ts";
import { getReleases, serializeReleases } from "../src/libs/releases.ts";

const RELEASES_DATA_URL = new URL("../src/data/releases.json", import.meta.url);

const token = process.env["GITHUB_TOKEN"];

if (!token) {
  throw new Error(
    "The `GITHUB_TOKEN` environment variable is required to fetch the releases from GitHub, e.g. `GITHUB_TOKEN=$(gh auth token) pnpm update-releases`."
  );
}

const repositories = await fetchOrganizationRepositories(
  GITHUB_ORGANIZATION,
  token
);
const releases = getReleases(repositories, RELEASES_LIMIT);

await writeFile(RELEASES_DATA_URL, serializeReleases(releases));

console.info(
  `[recent-releases] Saved ${releases.length} releases from ${repositories.length} repositories of the \`${GITHUB_ORGANIZATION}\` GitHub organization.`
);
