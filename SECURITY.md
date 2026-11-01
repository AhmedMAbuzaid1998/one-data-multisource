# Security and data handling

Report vulnerabilities privately to the maintainer or through GitHub private vulnerability reporting if enabled. Do not post live accounts, passwords, tokens, internal page contents or exploitable details in public issues. Organizational deployments should also follow the organization's reporting process.

This is a test/demo app. Protections include a localhost backend with a per-launch token, sandboxed renderer, restricted IPC, isolated in-memory Confluence login, an allowed Confluence origin and encrypted per-OS-user cache. Account switches, sign-out and confirmed page access denial clear applicable downloaded copies.

Password columns are visible by design. Cached rows can include passwords and are readable offline by the same OS user; encryption does not prove current Confluence authorization. Uploaded files are session-only. The development backend profile differs from desktop and must not be exposed as production hosting.

Use only invented fixtures. Never commit real workbooks/exports, credentials, cookies, `.env` secrets, cache files or screenshots of live accounts. Do not bypass TLS validation, login policies or OS execution controls. Dependency review, signing/notarization and enterprise deployment approval remain deployment responsibilities.

No external LLM is connected. A future integration needs approved authentication and a defined decision about what prompts/metadata may leave the app. Confluence access alone does not authorize sharing its data with another service.
