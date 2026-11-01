# Development setup

## Prerequisites

Install Git, Node.js 22/npm, Maven 3.9+, and a full JDK 17 containing `jlink`. Set `JAVA_HOME` to that JDK and add the tools to PATH. Verify `node --version`, `npm --version`, `java -version`, and `mvn -version`; Maven must report Java 17.

Clone the repository and enter its root (containing `.github` and `one-data`). Run:

```sh
npm ci --prefix one-data/frontend
npm ci --prefix one-data/desktop
npm --prefix one-data/desktop start
```

This builds the frontend, packages it in the Spring Boot JAR, creates a bundled Java runtime and launches Electron. Initial installation/build requires network access. Windows packages must be built on Windows; Mac packages on the intended Mac architecture so Java and Electron match.

## Desktop and browser modes

Desktop opens the workspace after the splash. Import the files in `samples/` without corporate access. For Confluence, connect to the organization network/VPN as required and sign in with your own account. The allowed host is defined in `one-data/desktop/confluence-service.cjs`; enter page links through the UI. Close other One Data releases first because they share the test profile.

For faster UI development, use two terminals:

```sh
# Terminal 1
mvn -f one-data/backend/pom.xml spring-boot:run
```

```sh
# Terminal 2
npm --prefix one-data/frontend run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to port 8080. Browser mode includes the original sample dataset and file imports, but no desktop Confluence bridge or cache. Its row counts include baseline data; use desktop mode for exact fixture counts. The development backend enables an H2 console, unlike the desktop profile. Do not expose development servers as production hosting.

## Verification

```sh
npm --prefix one-data/frontend run build
npm --prefix one-data/desktop test
mvn -f one-data/backend/pom.xml -Pdesktop verify
git diff --check
```

Install both dependency sets before tests: the Node suite loads frontend TypeScript/React dependencies. Tests need no corporate account. Maven currently has no Java unit tests; a successful Maven build alone is not an Excel end-to-end test.

For Windows packaged integration:

```sh
npm --prefix one-data/desktop run pack
node one-data/desktop/scripts/smoke-desktop.mjs "one-data/desktop/release-multisource1/win-unpacked/One Data Confluence Test.exe" --confluence --multisource
```

The smoke check launches an isolated temporary profile, uploads committed fixtures, verifies two sheets plus JSON, eight rows/thirteen columns, nulls/leading zeroes/booleans, dynamic filtering, copying and removal, then closes the app. It writes `outputs/multisource-tests/desktop-check.png` and synthetic text to the clipboard. Keep the desktop session unlocked and available. It does not verify live corporate SSO.

## Code map

Paths below are relative to `one-data/`:

| Concern | Location |
| --- | --- |
| Screen composition | `frontend/src/App.tsx` |
| File import and header union | `frontend/src/services/datasets.ts` |
| Search interpretation and matching | `frontend/src/services/tableData.ts` |
| Source controls, filters, table | `frontend/src/components/SourceManager.tsx`, `DynamicFilters.tsx`, `UserTable.tsx` |
| Excel API | `backend/src/main/java/com/onedata/controller/UserController.java` |
| Startup and local access | `desktop/main.cjs`, backend `DesktopAccessFilter.java` |
| Per-page state and coordination | `desktop/confluence-service.cjs`, `confluence-hub.cjs` |
| Sign-in, cache, IPC | `desktop/confluence.cjs`, `preload.cjs` |
| HTML table extraction | `desktop/confluence-parser.cjs` |

## Troubleshooting

- Missing `jlink`: point JAVA_HOME at a full JDK 17, not a JRE.
- Missing bundled JAR/runtime: use `npm --prefix one-data/desktop start` or `run pack`; launching Electron directly does not prepare them.
- Backend startup failure: verify Java 17 and inspect terminal output; slower machines may take up to 90 seconds.
- Confluence failure: check VPN, network and page permissions. Do not disable TLS validation. Test file uploads separately.
- Old window/data: close other releases; sign out to clear Confluence copies. Files are session-only.
- Clipboard smoke failure: keep the test window available/focused. Only local text writes are allowed; clipboard reading stays disabled.
