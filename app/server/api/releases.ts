import { Octokit } from "octokit";

import type { ReleaseInfo } from "../../types";

const LIMIT = 300;

const refs = [
  "refs/heads/main",
  "refs/heads/master",
  "refs/heads/latest",
  "refs/heads/stable",
  "refs/heads/release",
  "refs/heads/dev",
];

export interface ReturnData {
  infos: ReleaseInfo[];
  lastUpdated: number;
  lastFetched: number;
}

export default defineLazyEventHandler(async () => {
  const config = useRuntimeConfig();
  const octokit = new Octokit({
    auth: config.githubToken,
  });

  // The GitHub `/events` API only returns the latest 300 events (3 pages)
  // Thus here we use Github to store the previous data to persist the history for a longer time
  let infos: ReleaseInfo[] = (await $fetch("/api/data")) || [];
  let oldInfos: ReleaseInfo[] = JSON.parse(JSON.stringify(infos));

  infos.forEach((item) => {
    if (typeof item.created_at === "string")
      item.created_at = +new Date(item.created_at);
  });

  oldInfos.forEach((item) => {
    if (typeof item.created_at === "string")
      item.created_at = +new Date(item.created_at);
  });

  let lastUpdated = 0;

  async function getDataAtPage(page = 1): Promise<ReleaseInfo[]> {
    const { data } = await octokit.request("GET /users/{username}/events", {
      username: config.public.login,
      per_page: 100,
      page,
    });

    return (
      data
        .map((i) => {
          // Normalize the date to number
          const created_at = +new Date(i.created_at || 0);
          // Record the latest update time
          if (lastUpdated < created_at) lastUpdated = created_at;
          return {
            ...i,
            created_at,
          };
        })
        // For releases, we only care about the push events
        .filter((item) => item.type === "PushEvent" && item.public)
        // Sometimes GitHub API might return activities from other forks (when syncing PRs)
        // We filter then out by checking the ref
        .filter((item) => refs.includes((item.payload as any)?.ref))
        // Normalize the the releases. An even can have multiple commits, we flatten them
        .flatMap((item): ReleaseInfo => {
          const payload: any = item.payload || {};
          return (payload.commits || []).map((commit: any) => {
            const title = (commit?.message || "").split("\n")[0];
            const version =
              title.match(/v?(\d+\.\d+\.\d+(?:-[\w.]+)?)(?:\s|$)/)?.[1] || "";
            const packageName =
              title.match(/(?<=release\s)([\w-]+)(?=\sv\d+\.\d+\.\d+)/)?.[1] ||
              "";
            return {
              id: item.id,
              type: item.type!,
              repo: item.repo.name,
              isOrg: item.org !== undefined,
              title,
              sha: commit?.sha || "",
              commit: `https://github.com/${item.repo.name}/commit/${commit?.sha}`,
              created_at: item.created_at,
              version,
              package: packageName,
              // payload: item.payload,
            };
          });
        })
        .filter((item) => item.title.includes("release") && item.version)
    );
  }

  return defineCachedEventHandler(
    async () => {
      const lastFetched = +new Date();

      let goNextPage = true;
      for (let page = 1; page <= 3; page++) {
        if (!goNextPage) break;
        try {
          const items = await getDataAtPage(page);
          for (let index = items.length - 1; index >= 0; index--) {
            const current = items[index]!;
            const found = infos.find((item) => item.id === current.id);
            if (found) {
              goNextPage = false;
              continue;
            }
            infos.push(current);
          }
        } catch (error) {
          console.error(error);
          goNextPage = false;
          break;
        }
      }

      // Sort from newest to oldest
      infos.sort((a, b) => b.created_at - a.created_at);
      oldInfos.sort((a, b) => b.created_at - a.created_at);

      if (infos.length > LIMIT) infos.slice(0, LIMIT);

      if (JSON.stringify(oldInfos) !== JSON.stringify(infos)) {
        await $fetch("/api/data", {
          method: "POST",
          body: { infos },
        });
      }

      return {
        infos,
        lastUpdated,
        lastFetched,
      };
    },
    {
      maxAge: 60 * 5 /* 5 minutes */,
      swr: true,
    }
  );
});
