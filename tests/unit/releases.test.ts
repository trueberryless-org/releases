import { describe, expect, test } from "vitest";

import type { GitHubRelease, GitHubRepository } from "../../src/libs/github";
import {
  getReleaseSummary,
  getReleases,
  isSeparatedFromPreviousRelease,
  parseReleaseTag,
  type Release,
} from "../../src/libs/releases";

describe("parseReleaseTag", () => {
  test("parses Changesets tags", () => {
    expect(parseReleaseTag("starlight-view-modes@0.15.1")).toEqual({
      name: "starlight-view-modes",
      version: "0.15.1",
    });
    expect(parseReleaseTag("@trueberryless-org/foo@1.0.0-beta.2")).toEqual({
      name: "@trueberryless-org/foo",
      version: "1.0.0-beta.2",
    });
  });

  test("parses version tags without a package name", () => {
    expect(parseReleaseTag("v1.2.3")).toEqual({
      name: undefined,
      version: "1.2.3",
    });
    expect(parseReleaseTag("0.1.0")).toEqual({
      name: undefined,
      version: "0.1.0",
    });
  });

  test("ignores tags without a semantic version", () => {
    expect(parseReleaseTag("v1")).toBeUndefined();
    expect(parseReleaseTag("main-f8984e0b6438136993d57aaf3e81a6fca7cbd99f")).toBeUndefined();
  });
});

describe("getReleaseSummary", () => {
  test("returns the first Changesets changelog entry", () => {
    expect(
      getReleaseSummary(
        getTestRelease({
          description: [
            "## 0.10.0",
            "",
            "### Minor Changes",
            "",
            "- [#125](https://github.com/o/r/pull/125) [`2d416dd`](https://github.com/o/r/commit/2d416dd) Thanks [@trueberryless-bot](https://github.com/trueberryless-bot)! - Adds a `formatLink` prop to the [`ContributorList`](https://example.com) component.",
            "  ",
            "  See the documentation for more details.",
            "",
            "### Patch Changes",
            "",
            "- Fixes something else.",
          ].join("\r\n"),
        })
      )
    ).toBe("Adds a formatLink prop to the ContributorList component.");
  });

  test("skips dependency update entries", () => {
    expect(
      getReleaseSummary(
        getTestRelease({
          description:
            "### Patch Changes\n\n- Updated dependencies [[`abc`](https://example.com)]:\n  - foo@1.0.0\n- Fixes a **bug**.",
        })
      )
    ).toBe("Fixes a bug.");
  });

  test("falls back to the release name or the tag commit headline", () => {
    expect(
      getReleaseSummary(
        getTestRelease({ description: "", name: "The big release" })
      )
    ).toBe("The big release");
    expect(getReleaseSummary(getTestRelease({ description: null }))).toBe(
      "ci: release"
    );
  });
});

describe("getReleases", () => {
  test("returns the published releases of all repositories from newest to oldest", () => {
    const repositories: GitHubRepository[] = [
      getTestRepository("foo", [
        getTestRelease({ id: "1", publishedAt: "2026-01-01T00:00:00Z", tagName: "foo@1.0.0" }),
        getTestRelease({ id: "2", publishedAt: "2026-03-01T00:00:00Z", tagName: "v1.1.0" }),
      ]),
      getTestRepository("bar", [
        getTestRelease({ id: "3", publishedAt: "2026-02-01T00:00:00Z", tagName: "baz@0.1.0" }),
      ]),
    ];

    expect(
      getReleases(repositories, 10).map(({ id, package: name, repository, version }) => ({
        id,
        name,
        repository,
        version,
      }))
    ).toEqual([
      { id: "2", name: "foo", repository: "foo", version: "1.1.0" },
      { id: "3", name: "baz", repository: "bar", version: "0.1.0" },
      { id: "1", name: "foo", repository: "foo", version: "1.0.0" },
    ]);
  });

  test("ignores drafts, documentation releases and non-semver tags", () => {
    const repositories: GitHubRepository[] = [
      getTestRepository("foo", [
        getTestRelease({ id: "1", isDraft: true, publishedAt: null }),
        getTestRelease({ id: "2", tagName: "foo-docs@0.1.1" }),
        getTestRelease({ id: "3", tagName: "v1" }),
        getTestRelease({ id: "4", tagName: "foo@2.0.0" }),
      ]),
    ];

    expect(getReleases(repositories, 10).map(({ id }) => id)).toEqual(["4"]);
  });

  test("limits the number of releases", () => {
    const repositories: GitHubRepository[] = [
      getTestRepository("foo", [
        getTestRelease({ id: "1", publishedAt: "2026-01-01T00:00:00Z" }),
        getTestRelease({ id: "2", publishedAt: "2026-01-02T00:00:00Z" }),
      ]),
    ];

    expect(getReleases(repositories, 1).map(({ id }) => id)).toEqual(["2"]);
  });
});

describe("isSeparatedFromPreviousRelease", () => {
  test("returns whether more than 11 hours passed since the previous release", () => {
    const release = getTestReleaseInfo("2026-01-01T00:00:00Z");

    expect(isSeparatedFromPreviousRelease(release, undefined)).toBe(false);
    expect(
      isSeparatedFromPreviousRelease(release, getTestReleaseInfo("2026-01-01T11:00:00Z"))
    ).toBe(false);
    expect(
      isSeparatedFromPreviousRelease(release, getTestReleaseInfo("2026-01-01T11:00:01Z"))
    ).toBe(true);
  });
});

function getTestRepository(name: string, releases: GitHubRelease[]): GitHubRepository {
  return { name, releases: { nodes: releases } };
}

function getTestRelease(release: Partial<GitHubRelease> = {}): GitHubRelease {
  return {
    description: "",
    id: "id",
    isDraft: false,
    name: "foo@1.0.0",
    publishedAt: "2026-01-01T00:00:00Z",
    tagCommit: { messageHeadline: "ci: release" },
    tagName: "foo@1.0.0",
    url: "https://github.com/o/foo/releases/tag/foo%401.0.0",
    ...release,
  };
}

function getTestReleaseInfo(publishedAt: string): Release {
  return {
    id: publishedAt,
    package: "foo",
    publishedAt,
    repository: "foo",
    summary: "",
    url: "",
    version: "1.0.0",
  };
}
