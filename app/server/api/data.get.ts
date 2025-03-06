import { Octokit } from "octokit";
import { RELEASES_FILE_PATH } from "~~/shared/constants";

import type { ReleaseInfo } from "../../types";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const octokit = new Octokit({
    auth: config.writeDataGithubToken,
  });

  try {
    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner: "trueberryless-org",
        repo: "releases",
        path: RELEASES_FILE_PATH,
      }
    );

    if (
      response.status === 200 &&
      response.data &&
      "content" in response.data
    ) {
      const decodedContent = Buffer.from(
        response.data.content,
        "base64"
      ).toString("utf-8");
      return JSON.parse(decodedContent) as ReleaseInfo[];
    } else {
      console.error("File not found or content not available");
      return [];
    }
  } catch (error) {
    console.error("Error fetching release info:", error);
    return [];
  }
});
