# Recent Releases

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)
[![Netlify Status](https://api.netlify.com/api/v1/badges/b11ce18f-9b7e-4949-9f21-6df0831fe2ac/deploy-status)](https://app.netlify.com/projects/releases-felix/deploys)

A page for the recent releases of the [trueberryless-org](https://github.com/trueberryless-org) GitHub organization: [releases.felixs.dev](https://releases.felixs.dev)

Please check out the [original version](https://github.com/antfu/releases.antfu.me) by [Anthony Fu](https://github.com/antfu)!

## How it works

Unlike the original version, which reads the push events of a GitHub user, this page lists the [GitHub releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) of all public repositories of the organization. This also includes releases created by bots, e.g. by the [Changesets action](https://github.com/changesets/action).

1. The [Update releases workflow](https://github.com/trueberryless-org/releases/blob/main/.github/workflows/update-releases.yaml) runs every 30 minutes, fetches the releases using the GitHub GraphQL API and commits changes to [`src/data/releases.json`](https://github.com/trueberryless-org/releases/blob/main/src/data/releases.json).
2. Netlify rebuilds the static site for every new commit.

To show a release right away, trigger the workflow from the release workflow of another repository of the organization:

```sh
gh api repos/trueberryless-org/releases/dispatches -f event_type=release
```

## Development

```sh
pnpm install
GITHUB_TOKEN=$(gh auth token) pnpm update-releases
pnpm dev
```

## Variants / Inspiration

- [Original](https://github.com/antfu/releases.antfu.me)
- [Sébastien Chopin's contributions](https://prs.atinux.com/)
- [Leon Fong's contributions](https://pr.leonfong.me/)

## License

Licensed under the MIT license, Copyright © trueberryless.

See [LICENSE](https://github.com/trueberryless-org/releases/blob/main/LICENSE) for more information.
