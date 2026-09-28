import { formatTimeAgo } from "../libs/time";

export function updateRelativeTimes() {
  const now = new Date();

  for (const time of document.querySelectorAll<HTMLTimeElement>(
    "time[data-relative-time]"
  )) {
    time.textContent = formatTimeAgo(new Date(time.dateTime), now);
  }
}
