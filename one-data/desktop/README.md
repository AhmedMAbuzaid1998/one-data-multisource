# One Data desktop

The desktop app bundles the existing React interface, Spring Boot service, sample workbook, and a Java 17 runtime. Teammates do not need Java, Maven, Node.js, or a local web-server setup to run a packaged copy. It works on Windows and macOS as a local, single-user demo.

## Use a packaged app

- **Windows:** Install `One Data Setup 1.0.0.exe` or run the portable `One Data 1.0.0.exe` from the `release` folder.
- **macOS:** Use the `.dmg` for your Mac's processor (`x64` for Intel, `arm64` for Apple silicon) and copy One Data to Applications.

The app launches its own local service and closes it on exit. The sample data is bundled, while an uploaded personal workbook is active only in the current app session. Request text is copied manually for Jira. There is no shared live workbook or shared request status in this desktop build.

These builds are currently **unsigned**. Your IT team must approve distribution and supply code-signing certificates (and Apple notarization) before a broad organization rollout. Follow organization security policy rather than bypassing an OS warning.

## Build installers

On a build machine, install Node.js 22, Maven, and a full Java 17 JDK; set `JAVA_HOME` to the JDK. From the repository root:

```bash
npm ci --prefix one-data/frontend
npm ci --prefix one-data/desktop
```

On Windows run `npm --prefix one-data/desktop run dist:win`. On a Mac run `npm --prefix one-data/desktop run dist:mac`. Output is under `one-data/desktop/release`. Each platform builds a matching bundled Java runtime, so build the Mac app on macOS.

The repository also has a manual **Desktop builds** GitHub Actions workflow for Windows x64, Intel Mac, and Apple silicon Mac. After it runs, download the artifacts from that workflow run. The workflow does not sign them.
