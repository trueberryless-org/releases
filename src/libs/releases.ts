import type { GitHubRelease, GitHubRepository } from "./github.ts";

const SEMVER_NUMBER = String.raw`(?:0|[1-9]\d*)`;
const SEMVER_PRERELEASE_IDENTIFIER = String.raw`(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)`;
const SEMVER_BUILD_IDENTIFIER = String.raw`[0-9a-zA-Z-]+`;
const SEMVER = String.raw`${SEMVER_NUMBER}\.${SEMVER_NUMBER}\.${SEMVER_NUMBER}(?:-${SEMVER_PRERELEASE_IDENTIFIER}(?:\.${SEMVER_PRERELEASE_IDENTIFIER})*)?(?:\+${SEMVER_BUILD_IDENTIFIER}(?:\.${SEMVER_BUILD_IDENTIFIER})*)?`;
const RELEASE_TAG_RE = new RegExp(
  String.raw`^(?:(?<name>.+)@)?v?(?<version>${SEMVER})$`
);
const CHANGELOG_ENTRY_RE = /^[-*] +(?:.*?Thanks .*?! - )?(?<entry>.+)$/gm;
const MARKDOWN_LINK_RE = /\[([^\]]*)\]\([^)]*\)/g;
const MARKDOWN_EMPHASIS_RE = /\*\*|`/g;
const DEPENDENCY_UPDATE_RE = /^updated dependencies/i;
const DOCUMENTATION_PACKAGE_RE = /-docs$/;

const SEPARATED_RELEASES_THRESHOLD = 11 * 60 * 60 * 1000;

export function getReleases(
  repositories: GitHubRepository[],
  limit: number
): Release[] {
  return repositories
    .flatMap(getRepositoryReleases)
    .sort(compareReleasesByNewest)
    .slice(0, limit);
}

export function parseReleaseTag(
  tagName: string
): { name: string | undefined; version: string } | undefined {
  const groups = RELEASE_TAG_RE.exec(tagName)?.groups;
  if (!groups?.["version"]) return;

  return { name: groups["name"], version: groups["version"] };
}

export function getReleaseSummary(
  release: Pick<GitHubRelease, "description" | "name" | "tagCommit" | "tagName">
): string {
  const entry = getFirstChangelogEntry(release.description ?? "");
  if (entry) return entry;

  if (release.name && release.name !== release.tagName) return release.name;

  return release.tagCommit?.messageHeadline ?? release.tagName;
}

export function isSeparatedFromPreviousRelease(
  release: Release,
  previousRelease: Release | undefined
): boolean {
  if (!previousRelease) return false;

  const timeDifference = Math.abs(
    Date.parse(previousRelease.publishedAt) - Date.parse(release.publishedAt)
  );

  return timeDifference > SEPARATED_RELEASES_THRESHOLD;
}

export function serializeReleases(releases: Release[]): string {
  return `${JSON.stringify(releases, null, 2)}\n`;
}

function getRepositoryReleases(repository: GitHubRepository): Release[] {
  return repository.releases.nodes.flatMap((release) => {
    const parsedRelease = githubReleaseToRelease(repository, release);
    return parsedRelease ? [parsedRelease] : [];
  });
}

function githubReleaseToRelease(
  repository: GitHubRepository,
  release: GitHubRelease
): Release | undefined {
  if (release.isDraft || !release.publishedAt) return;

  const tag = parseReleaseTag(release.tagName);
  if (!tag) return;

  const packageName = tag.name ?? repository.name;
  if (DOCUMENTATION_PACKAGE_RE.test(packageName)) return;

  return {
    id: release.id,
    package: packageName,
    publishedAt: release.publishedAt,
    repository: repository.name,
    summary: getReleaseSummary(release),
    url: release.url,
    version: tag.version,
  };
}

function compareReleasesByNewest(a: Release, b: Release): number {
  return (
    Date.parse(b.publishedAt) - Date.parse(a.publishedAt) ||
    a.id.localeCompare(b.id)
  );
}

function getFirstChangelogEntry(description: string): string | undefined {
  for (const match of description.matchAll(CHANGELOG_ENTRY_RE)) {
    const entry = stripMarkdown(match.groups?.["entry"] ?? "");
    if (entry && !DEPENDENCY_UPDATE_RE.test(entry)) return entry;
  }

  return;
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(MARKDOWN_LINK_RE, "$1")
    .replace(MARKDOWN_EMPHASIS_RE, "")
    .trim();
}

export interface Release {
  id: string;
  package: string;
  publishedAt: string;
  repository: string;
  summary: string;
  url: string;
  version: string;
}
