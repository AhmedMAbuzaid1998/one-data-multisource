# One Data

A desktop test-data directory that combines Confluence tables, Excel workbooks and JSON files into one searchable workspace, with a Jira request-content builder.

**Latest working version: `1.2.0-multisource.1` (manual Confluence sign-in).** Windows x64 has been tested as a complete-folder ZIP. macOS builds are configured but require separate platform verification. This is a demo/test application, not an approved enterprise deployment.

## Start here

[Download the Windows test release](https://github.com/AhmedMAbuzaid1998/one-data-multisource/releases/tag/v1.2.0-multisource.1). Extract the entire ZIP and run `One Data Confluence Test.exe`; keep all bundled files together. No development tools are required to use it.

| You want to… | Read this |
| --- | --- |
| Use the desktop application | [User guide](one-data/desktop/CONFLUENCE-TEST-INSTRUCTIONS.txt) |
| Run or change the code | [Development setup](docs/DEVELOPMENT.md) |
| Understand the high-level design | [Architecture](docs/ARCHITECTURE.md) |
| Import data and try the features | [Data formats and samples](samples/README.md) |
| Contribute a change | [Contributing](CONTRIBUTING.md) |
| Build and distribute a version | [Release guide](docs/RELEASING.md) |
| Report a security issue | [Security guidance](SECURITY.md) |

## Features and boundaries

- Multiple simultaneous Confluence pages and JSON/XLSX/XLS uploads, including all non-empty Excel sheets.
- Matching headers and aliases form one table; missing values are actual `null`. Every row retains its source; duplicate accounts remain separate rows.
- Selectable dynamic filters, sorting, pagination, local smart search and copy feedback.
- Vodafone-inspired styling, startup animation, light/dark modes and copyable Jira request content.
- Individual Confluence sign-in, five-minute refresh and an encrypted last successful copy for unavailable pages.

Smart Search currently uses local rules, not an LLM. Direct Jira creation is not connected. Token generation is hidden and its backend is a demo stub. Uploaded files last only for the current session. Confluence links must use the configured organization host. Password columns are intentionally visible.

## Quick developer start

Install **Node.js 22**, **JDK 17**, and **Maven 3.9+**. Set `JAVA_HOME` to the JDK and ensure `node`, `npm`, `java`, and `mvn` are on PATH. From the repository root:

```sh
git clone https://github.com/AhmedMAbuzaid1998/one-data-multisource.git
cd one-data-multisource
npm ci --prefix one-data/frontend
npm ci --prefix one-data/desktop
npm --prefix one-data/desktop test
npm --prefix one-data/desktop start
```

The last command builds React, packages Spring Boot, creates a Java runtime and launches Electron. Initial dependency installation needs network access. No Confluence account is needed to test the [synthetic Excel and JSON files](samples/README.md).

For frontend-only development, run `mvn -f one-data/backend/pom.xml spring-boot:run` and, in another terminal, `npm --prefix one-data/frontend run dev`. Open `http://localhost:5173`. Browser mode uses the original sample dataset and has no Electron Confluence bridge.

## Structure and technologies

```text
one-data/frontend/   React 18, TypeScript, Vite, CSS; UI and combined-data logic
one-data/backend/    Java 17, Spring Boot, Apache POI; local API and Excel import
one-data/desktop/    Electron; startup, Confluence, cache and packaging
samples/            Synthetic input files and expected results
docs/               Developer, architecture and release documentation
.github/            CI, desktop builds, issue and pull-request templates
```

H2/JPA support the original sample backend; they are not a shared database for the combined workspace. The desktop backend binds only to localhost and uses a per-launch token. See [Architecture](docs/ARCHITECTURE.md).

## Contributing and distribution

Use a feature branch or fork, run the documented checks, and open a pull request. Do not commit real accounts, uploaded workbooks, authentication tokens, caches or personal documents. Source belongs in Git; packaged applications belong in GitHub Releases or build artifacts.

No open-source license has been selected. Maintainers must resolve ownership, licensing and branding permissions before describing this as open source or redistributing it beyond its authorized scope. See [Contributing](CONTRIBUTING.md).
