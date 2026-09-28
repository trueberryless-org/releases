const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

const RELEASES_PER_REPOSITORY = 30;

const REPOSITORIES_QUERY = `
  query ($cursor: String, $organization: String!, $releases: Int!) {
    organization(login: $organization) {
      repositories(first: 100, after: $cursor, isFork: false, privacy: PUBLIC) {
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          name
          releases(first: $releases, orderBy: { field: CREATED_AT, direction: DESC }) {
            nodes {
              description
              id
              isDraft
              name
              publishedAt
              tagCommit {
                messageHeadline
              }
              tagName
              url
            }
          }
        }
      }
    }
  }
`;

export async function fetchOrganizationRepositories(
  organization: string,
  token: string
): Promise<GitHubRepository[]> {
  const repositories: GitHubRepository[] = [];
  let cursor: string | null = null;

  do {
    const data: RepositoriesQueryData = await queryGitHub(
      REPOSITORIES_QUERY,
      { cursor, organization, releases: RELEASES_PER_REPOSITORY },
      token
    );

    if (!data.organization) {
      throw new Error(
        `The GitHub organization \`${organization}\` could not be found.`
      );
    }

    const { nodes, pageInfo } = data.organization.repositories;
    repositories.push(...nodes);
    cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
  } while (cursor);

  return repositories;
}

async function queryGitHub<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string
): Promise<T> {
  const response = await fetch(GITHUB_GRAPHQL_URL, {
    body: JSON.stringify({ query, variables }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to query the GitHub GraphQL API: ${response.status} ${response.statusText}.`
    );
  }

  const { data, errors } = (await response.json()) as GraphQLResponse<T>;

  if (errors?.length || !data) {
    const messages = errors?.map((error) => error.message).join("\n") ?? "";
    throw new Error(`The GitHub GraphQL API returned errors:\n${messages}`);
  }

  return data;
}

export interface GitHubRepository {
  name: string;
  releases: {
    nodes: GitHubRelease[];
  };
}

export interface GitHubRelease {
  description: string | null;
  id: string;
  isDraft: boolean;
  name: string | null;
  publishedAt: string | null;
  tagCommit: {
    messageHeadline: string;
  } | null;
  tagName: string;
  url: string;
}

interface RepositoriesQueryData {
  organization: {
    repositories: {
      nodes: GitHubRepository[];
      pageInfo: {
        endCursor: string | null;
        hasNextPage: boolean;
      };
    };
  } | null;
}

interface GraphQLResponse<T> {
  data?: T | null;
  errors?: { message: string }[];
}
