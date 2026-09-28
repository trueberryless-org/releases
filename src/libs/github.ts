const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

const RELEASES_FIELDS = `
  releases(first: 100, after: $releasesCursor, orderBy: { field: CREATED_AT, direction: DESC }) {
    pageInfo {
      endCursor
      hasNextPage
    }
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
`;

const REPOSITORIES_QUERY = `
  query ($cursor: String, $organization: String!, $releasesCursor: String) {
    organization(login: $organization) {
      repositories(first: 50, after: $cursor, isFork: false, privacy: PUBLIC) {
        pageInfo {
          endCursor
          hasNextPage
        }
        nodes {
          name
          ${RELEASES_FIELDS}
        }
      }
    }
  }
`;

const REPOSITORY_RELEASES_QUERY = `
  query ($name: String!, $owner: String!, $releasesCursor: String) {
    repository(name: $name, owner: $owner) {
      ${RELEASES_FIELDS}
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
      { cursor, organization, releasesCursor: null },
      token
    );

    if (!data.organization) {
      throw new Error(
        `The GitHub organization \`${organization}\` could not be found.`
      );
    }

    const { nodes, pageInfo } = data.organization.repositories;

    for (const repository of nodes) {
      repositories.push({
        name: repository.name,
        releases: {
          nodes: await fetchAllRepositoryReleases(
            organization,
            repository,
            token
          ),
        },
      });
    }

    cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
  } while (cursor);

  return repositories;
}

async function fetchAllRepositoryReleases(
  owner: string,
  repository: RepositoryNode,
  token: string
): Promise<GitHubRelease[]> {
  const releases = [...repository.releases.nodes];
  let { pageInfo } = repository.releases;

  while (pageInfo.hasNextPage) {
    const data: RepositoryReleasesQueryData = await queryGitHub(
      REPOSITORY_RELEASES_QUERY,
      { name: repository.name, owner, releasesCursor: pageInfo.endCursor },
      token
    );

    if (!data.repository) {
      throw new Error(
        `The GitHub repository \`${owner}/${repository.name}\` could not be found.`
      );
    }

    releases.push(...data.repository.releases.nodes);
    pageInfo = data.repository.releases.pageInfo;
  }

  return releases;
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

interface PageInfo {
  endCursor: string | null;
  hasNextPage: boolean;
}

interface RepositoryNode {
  name: string;
  releases: ReleasesConnection;
}

interface ReleasesConnection {
  nodes: GitHubRelease[];
  pageInfo: PageInfo;
}

interface RepositoriesQueryData {
  organization: {
    repositories: {
      nodes: RepositoryNode[];
      pageInfo: PageInfo;
    };
  } | null;
}

interface RepositoryReleasesQueryData {
  repository: {
    releases: ReleasesConnection;
  } | null;
}

interface GraphQLResponse<T> {
  data?: T | null;
  errors?: { message: string }[];
}
