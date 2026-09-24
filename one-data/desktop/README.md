# One Data Confluence test desktop

Version `1.1.0-confluence.2` is a separate app and OS user profile on branch `codex/confluence-desktop-test`. The original `main` version and the original release ZIPs remain available.

See [CONFLUENCE-TEST-INSTRUCTIONS.txt](CONFLUENCE-TEST-INSTRUCTIONS.txt) for installation, individual sign-in, refresh, offline behavior, personal uploads, and supported table columns.

## Architecture

The existing React/Spring Boot desktop app runs locally. A narrow Electron preload bridge exposes fixed Confluence actions only. An isolated, sandboxed sign-in window opens the supplied Confluence page and its Microsoft SAML sign-in flow. It has no preload bridge and no Node access. Each app launch uses a new in-memory authentication session. Corporate proxy and certificate settings apply; certificate errors are not bypassed.

The Electron main process reads the current Confluence user and the page's rendered table through read-only REST endpoints. It verifies the account before fetching data, never reads or stores a sign-in password, and never sends Confluence data to the local sample-data backend or an external AI service. HTML is parsed into text with parse5 and displayed through React, without rendering remote HTML.

After a valid download, the table is encrypted with Electron safeStorage in this test app's OS-user profile. This cache includes any test-account passwords present in the table. Local confidentiality depends on the operating-system user account. Offline startup permits that same OS user to read their last copy; it does not prove the Confluence session remains authorized. A confirmed access denial clears the cache. Explicit sign-out clears the data and in-memory login session. Account switches clear the previous account's data before fetching a replacement. Invalid/empty tables and outages keep the last valid copy.

## Build and verify

Requirements: Node 22, Java JDK 17 with JAVA_HOME, Maven.

```sh
npm ci --prefix one-data/frontend
npm ci --prefix one-data/desktop
npm --prefix one-data/desktop test
npm --prefix one-data/desktop run pack
```

Output is `release-confluence-login/win-unpacked` on Windows. Zip this complete folder together with the instructions; do not distribute just its EXE. `dist:win` creates an installer; `dist:mac` builds DMG and ZIP on a Mac. The manual GitHub workflow on this branch builds all three platforms and creates the Windows folder ZIP.

The parser/cache tests use invented fixture values, not the screenshot's test credentials. `scripts/smoke-desktop.mjs <executable> --confluence-login` checks the packaged bridge, automatic sign-in window, hidden workspace, startup gate, and five-minute refresh configuration in a clean profile. Live end-to-end validation still requires the user's Vodafone account and network. If organization policy disallows embedded-browser SAML sign-in or cookie-authenticated REST calls, an IT-approved OAuth/SSO integration is needed; the app does not bypass that policy.

Startup now opens sign-in automatically after the splash, once per app launch. Live data opens the workspace; cached data requires an explicit Use offline copy action. Closing sign-in leaves the retry screen. Explicit sign-out locks the workspace again; session expiry after entry retains data with the existing sign-in notice.
