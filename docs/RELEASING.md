# Building and releasing

Current app version: `1.2.0-multisource.1`. Keep generated runtimes/installers/ZIPs out of Git. Use GitHub Releases for durable downloads; Actions artifacts expire.

## Prepare and build

1. Start from a reviewed commit and clean checkout with both npm dependency sets installed.
2. Run [development checks](DEVELOPMENT.md), then packaged smoke tests with synthetic data. Test live Confluence separately with an authorized account, never CI credentials.
3. For a new app version, update `one-data/desktop/package.json` and its lockfile together. Keep output paths/workflow/instructions consistent.
4. Run `npm --prefix one-data/desktop run pack`.

On Windows, output is `one-data/desktop/release-multisource1/win-unpacked`. ZIP the complete folder with `CONFLUENCE-TEST-INSTRUCTIONS.txt` renamed `START HERE.txt` and `samples/` copied as `Test files`. Never distribute the EXE alone.

Use `npm --prefix one-data/desktop run dist:win` for an installer on Windows, or `run dist:mac` on the intended Mac architecture for DMG/ZIP. Java is generated from the host JDK, so cross-building Electron alone does not produce a valid cross-platform bundle. Historical `pack:variants` creates the old .3/.4 versions; do not use it for the current release.

## GitHub Actions

- **CI:** pushes/PRs run frontend build, Node regression tests and Maven verification with synthetic data.
- **Desktop builds:** manually dispatch from Actions on the intended branch/commit. It builds Windows x64, Mac Intel and Mac Apple Silicon packages. Download and verify the intended platform artifacts.
- Artifacts expire after 14 days; attach accepted builds to a GitHub Release for durable downloads.
- The workflow does not publish, sign, notarize or approve releases automatically. A successful Mac build is not a successful Mac/SSO runtime test.

## Publish

1. Merge the reviewed PR into the maintained default branch.
2. Create a GitHub Release with a version tag pointing to that reviewed commit. Do not move an existing tag.
3. Attach the complete Windows ZIP and any independently tested Mac packages. Include checksums if used by your distribution process.
4. Describe changes, platforms, setup, validation, known limitations and signing status.
5. Verify the download and run from a freshly extracted folder.

This version's notes: multiple simultaneous Confluence/JSON/Excel sources, union headers/nulls, selectable dynamic filters, copy feedback and manual sign-in. Files are session-only. LLM and direct Jira integrations are not implemented.
