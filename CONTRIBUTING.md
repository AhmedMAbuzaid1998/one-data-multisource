# Contributing

Read [Development](docs/DEVELOPMENT.md), [Architecture](docs/ARCHITECTURE.md) and [Sample formats](samples/README.md). Use invented data in all tests and screenshots. Raise an issue before substantial features so the intended behavior can be agreed.

## Workflow

1. Clone the repository, or fork it if you lack write access and policy permits.
2. Start from the maintained default branch and create a branch, e.g. `git switch -c feature/source-preview`.
3. Make a focused change, preserving unrelated work and previous releases.
4. Run from the repository root:

   ```sh
   npm --prefix one-data/frontend run build
   npm --prefix one-data/desktop test
   mvn -f one-data/backend/pom.xml -Pdesktop verify
   git diff --check
   ```

5. For desktop/import changes, run the packaged synthetic smoke check in [Development](docs/DEVELOPMENT.md).
6. Open a PR explaining the problem, resulting behavior, checks and limitations. Include synthetic before/after screenshots for visible changes.
7. Address review comments. Maintainers merge after checks/review; do not force-push the default branch.

The backend currently has no Java unit-test sources; Maven verifies compilation/packaging, not all runtime behavior. Node tests cover parsing, caching, account isolation, search, filtering and merging.

## Conventions

- Use TypeScript in the frontend and stable DOM IDs for controls. Keep new code readable with named helpers for multi-step logic.
- Treat table headers, files and Confluence HTML as untrusted input. Render text through React, not injected HTML.
- Preserve nulls, zero/false, textual leading zeroes and source attribution.
- Validate IPC arguments and callers. Keep Node access out of the renderer; preserve origin restrictions, per-user authentication and cache isolation.
- Test meaningful behavior/regressions and update documentation for format/configuration changes.
- Update lockfiles with dependency changes. Do not commit runtimes, installers, node_modules or generated outputs.
- Never commit real accounts, passwords, live workbooks/JSON, cookies, API keys, caches or personal documents. Add invented fixtures to `samples/` only.

## Access and licensing

The maintainer can grant GitHub collaborator/team access and configure required checks/reviews; those settings are separate from this source package. This repository has no open-source license. Visibility alone does not grant general reuse/redistribution rights. Until ownership and organizational/branding requirements are resolved, contributions should be from authorized collaborators under applicable arrangements. Do not assume a license or add a CLA on behalf of the owner.
