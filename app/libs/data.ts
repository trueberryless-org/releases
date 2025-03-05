import type { ReleaseInfo } from "../types";
import { Octokit } from "octokit";

const RELEASES_FILE_PATH = "app/.data/releases.json";

const config = useRuntimeConfig();
const octokit = new Octokit({
  auth: process.env.PAT_GITHUB_TOKEN_WRITE_DATA,
});

export async function get(): Promise<ReleaseInfo[]> {
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
}

export async function set(infos: ReleaseInfo[]) {
  console.log(JSON.stringify(infos));
  const content = Buffer.from(JSON.stringify(infos)).toString("base64");
  const sha = await getFileSHA(RELEASES_FILE_PATH);

  try {
    const response = await octokit.request(
      "PUT /repos/{owner}/{repo}/contents/{path}",
      {
        owner: "trueberryless-org",
        repo: "releases",
        path: RELEASES_FILE_PATH,
        message: "data: update releases.json file",
        content,
        sha: sha || undefined,
      }
    );

    if (response.status === 201 || response.status === 200) {
      console.log(
        "File created/updated successfully:",
        response.data.commit.sha
      );
    } else {
      console.error("Failed to create/update file:", response.status);
    }
  } catch (error) {
    console.error("Error creating/updating file:", error);
  }
}

async function getFileSHA(
  filePath: string,
  owner: string = "trueberryless-org",
  repo: string = "releases"
): Promise<string | null> {
  try {
    const response = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo,
        path: filePath,
      }
    );

    if (response.status === 200 && response.data && "sha" in response.data) {
      return response.data.sha;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching file SHA:", error);
    return null;
  }
}
