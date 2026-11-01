# One Data multi-source desktop

Current manual-sign-in release: **1.2.0-multisource.1**. `npm run pack` outputs `release-multisource1/win-unpacked`. See [CONFLUENCE-TEST-INSTRUCTIONS.txt](CONFLUENCE-TEST-INSTRUCTIONS.txt) for running and testing it. Earlier ZIPs remain unchanged.

The app combines up to 20 Confluence pages on the configured organization host with JSON and all nonempty Excel sheets. Header aliases form a union schema with actual nulls for missing values. Uploaded sources stay in memory for the session. Each page has an independent encrypted cache and refresh status; sign-out retains links but clears downloaded copies. Filters follow chosen schema headers. Text selection and cell copy buttons show feedback; the local app may write, but not read, the clipboard.

See the current [development guide](../../docs/DEVELOPMENT.md), [architecture](../../docs/ARCHITECTURE.md) and [release guide](../../docs/RELEASING.md). The sections below document older releases; their output paths and startup behavior do not describe the current version. Test the packaged version with `node scripts/smoke-desktop.mjs <executable> --confluence --multisource` from this directory. Synthetic fixtures are in `../../samples`. The test checks both Excel sheets plus JSON, nulls/leading zeroes/booleans, dynamic filtering, copying and source removal. Live SSO requires an authorized organization account.

## Earlier releases and architecture history
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


## Flexible table releases

Run `npm run pack:variants` from the desktop directory to build both Windows folders from one frontend/backend build:

- `release-flexible-manual`: 1.1.0-confluence.3, main screen then manual sign-in.
- `release-flexible-auto`: 1.1.0-confluence.4, automatic sign-in after splash.

Each output includes START HERE.txt. Zip the complete unpacked app folder and the guide together. Both use the existing Confluence test profile; close one before running the other. Earlier release ZIPs are retained.

The importer preserves all named columns using header metadata alongside each row. Username/MSISDN remains the table anchor. The frontend uses metadata for table columns, filters and local keyword/quoted-phrase/header-scoped search. Sensitive fields are searchable but masked in the table and filter chips, with no datalist suggestions. Search state stays in memory. Personal Excel imports retain their existing backend format. Page URL configuration remains unchanged.


## Manual release 1.1.0-confluence.5

`npm run pack` now creates the manual sign-in release in `release-manual5`. Package the full `win-unpacked` directory with CONFLUENCE-TEST-INSTRUCTIONS.txt. The old `pack:variants` helper describes earlier .3/.4 builds; do not use it for this release.

This version uses five curated chip filter groups plus Account ID/Service ID text inputs, embeds search within the results card, interprets common request wording locally with visible feedback, and renders password reveal buttons as eye icons with non-wrapping values. Explicit quoted/scoped searches stay unchanged. No LLM credentials or service are required.


## Manual release 1.1.0-confluence.6
`npm run pack` builds `release-manual6`. Filters are a left sidebar on desktop, stacking at narrow widths. Empty messages no longer inherit negative helper margins. Password columns are always visible without toggles; other sensitive columns remain masked.
