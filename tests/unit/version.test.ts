import { describe, expect, test } from "vitest";

import { getHighlightedVersion } from "../../src/libs/version";

describe("getHighlightedVersion", () => {
  test("highlights the last non-zero part of the version", () => {
    expect(getHighlightedVersion("1.0.0")).toEqual({
      color: "rose",
      highlighted: "1.0.0",
      prefix: "",
    });
    expect(getHighlightedVersion("0.10.0")).toEqual({
      color: "green",
      highlighted: "10.0",
      prefix: "0.",
    });
    expect(getHighlightedVersion("0.15.1")).toEqual({
      color: "purple",
      highlighted: "1",
      prefix: "0.15.",
    });
  });

  test("highlights prerelease versions", () => {
    expect(getHighlightedVersion("1.0.0-beta.2")).toEqual({
      color: "teal",
      highlighted: "2",
      prefix: "1.0.0-beta.",
    });
  });
});
