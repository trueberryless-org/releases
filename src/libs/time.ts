const TIME_UNITS = [
  { seconds: 31_536_000, unit: "year" },
  { seconds: 2_592_000, unit: "month" },
  { seconds: 86_400, unit: "day" },
  { seconds: 3_600, unit: "hour" },
  { seconds: 60, unit: "minute" },
] as const satisfies { seconds: number; unit: Intl.RelativeTimeFormatUnit }[];

const relativeTimeFormat = new Intl.RelativeTimeFormat("en", {
  numeric: "always",
});

export function formatTimeAgo(date: Date, now: Date = new Date()): string {
  const elapsedSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  for (const { seconds, unit } of TIME_UNITS) {
    if (elapsedSeconds >= seconds) {
      return relativeTimeFormat.format(
        -Math.floor(elapsedSeconds / seconds),
        unit
      );
    }
  }

  return "just now";
}
