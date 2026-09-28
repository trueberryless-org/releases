const VERSION_SEPARATOR_RE = /(\.)/g;

const HIGHLIGHT_COLORS = ["rose", "green", "purple", "teal"] as const;

export function getHighlightedVersion(version: string): HighlightedVersion {
  const parts = version.split(VERSION_SEPARATOR_RE);
  const highlightedIndex = getLastNonZeroPartIndex(parts);

  return {
    color: getHighlightColor(highlightedIndex),
    highlighted: parts.slice(highlightedIndex).join(""),
    prefix: parts.slice(0, highlightedIndex).join(""),
  };
}

function getLastNonZeroPartIndex(parts: string[]): number {
  return parts.findLastIndex((part) => {
    if (part === ".") return false;

    const number = Number(part);
    return !Number.isNaN(number) && number > 0;
  });
}

function getHighlightColor(highlightedIndex: number): HighlightColor {
  const lastColorIndex = HIGHLIGHT_COLORS.length - 1;
  const colorIndex =
    highlightedIndex >= 0
      ? Math.min(Math.floor(highlightedIndex / 2), lastColorIndex)
      : lastColorIndex;

  return HIGHLIGHT_COLORS[colorIndex] ?? "teal";
}

type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

export interface HighlightedVersion {
  color: HighlightColor;
  highlighted: string;
  prefix: string;
}
