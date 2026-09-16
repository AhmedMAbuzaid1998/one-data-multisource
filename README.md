# One Data demo

One Data is a test user directory and Jira request builder. This demo starts with sample users from `one-data/backend/src/main/resources/testdata.xlsx`. Team members can also upload their own Excel workbook for filtering and search in the current browser session.

## Run locally

Install Java 17, Maven, and Node.js 18 or newer.

1. In `one-data/backend`, run `mvn spring-boot:run`.
2. In `one-data/frontend`, run `npm ci` and then `npm run dev`.
3. Open `http://localhost:5173` or `http://127.0.0.1:5173`.

The backend runs on port 8080. The frontend development server proxies `/api` requests to it. The Windows `start-backend.bat` and `start-frontend.bat` scripts run the same commands.

## Demo features

- Browse sample test users, filter by attributes, search, sort, and paginate.
- Describe test data in plain language to fill the search filters.
- Upload a personal `.xlsx` or `.xls` file with these first-sheet columns: `Username`, `Market`, `Environment`, `User Type`, `Role`, `Payment Type`, `Account ID`, `Service ID`.
- Draft a Jira-ready test data request and edit its scenario before copying it.
- Switch between light and dark mode.

Personal uploads are parsed in memory for the response and are not saved to the shared dataset. The token UI is currently hidden for the demo, while its code remains in the project.
