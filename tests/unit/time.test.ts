import { describe, expect, test } from "vitest";

import { formatTimeAgo } from "../../src/libs/time";

const NOW = new Date("2026-09-28T12:00:00Z");

describe("formatTimeAgo", () => {
  test("formats recent dates", () => {
    expect(formatTimeAgo(new Date("2026-09-28T11:59:30Z"), NOW)).toBe("just now");
    expect(formatTimeAgo(new Date("2026-09-28T11:59:00Z"), NOW)).toBe("1 minute ago");
    expect(formatTimeAgo(new Date("2026-09-28T10:00:00Z"), NOW)).toBe("2 hours ago");
  });

  test("formats older dates", () => {
    expect(formatTimeAgo(new Date("2026-09-27T12:00:00Z"), NOW)).toBe("1 day ago");
    expect(formatTimeAgo(new Date("2026-07-28T12:00:00Z"), NOW)).toBe("2 months ago");
    expect(formatTimeAgo(new Date("2024-09-28T12:00:00Z"), NOW)).toBe("2 years ago");
  });
});
