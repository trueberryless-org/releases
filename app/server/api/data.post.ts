import crypto from "crypto";
import * as jose from "jose";
import { App, Octokit } from "octokit";
import { RELEASES_FILE_PATH } from "~~/shared/constants";

import type { ReleaseInfo } from "../../types";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const app = new App({
    appId: config.botAppId,
    privateKey: config.botPrivateKey,
  });
  const installationId = await getInstallationId();
  if (!installationId)
    return { success: false, message: "Failed to get installation id" };
  const octokit = await app.getInstallationOctokit(installationId);

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
        message: "[bot] data: update releases.json file",
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

async function getInstallationId(): Promise<number | null> {
  const config = useRuntimeConfig();
  const alg = "RS256";

  const secret = crypto.createPrivateKey(config.botPrivateKey);

  const jwt = await new jose.SignJWT()
    .setProtectedHeader({ alg })
    .setIssuedAt("-1min")
    .setIssuer(config.botAppId)
    .setExpirationTime("10min")
    .sign(secret);

  const octokit = new Octokit({
    auth: jwt,
  });

  try {
    const response = await octokit.request("GET /app/installations", {
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (response.status === 200) {
      return response.data[0].id;
    } else {
      console.error("Failed to get installation id:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error getting installation id:", error);
    return null;
  }
}

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
