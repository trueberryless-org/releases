import { Octokit } from "octokit";
import type { ReleaseInfo } from "../../types";
import { RELEASES_FILE_PATH } from "~~/shared/constants";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const octokit = new Octokit({
    auth: config.writeDataGithubToken,
  });

  const { infos } = await readBody(event);
  const content = Buffer.from(JSON.stringify(infos)).toString("base64");
  const sha = await getFileSHA(octokit, RELEASES_FILE_PATH);

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
      return { success: true, message: "File updated successfully" };
    } else {
      console.error("Failed to create/update file:", response.status);
      return { success: false, message: "Failed to update file" };
    }
  } catch (error) {
    console.error("Error creating/updating file:", error);
    return { success: false, message: "Error creating/updating file" };
  }
});

async function getFileSHA(
  octokit: Octokit,
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
