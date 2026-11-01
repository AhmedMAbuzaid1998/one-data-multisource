# Synthetic import fixtures

These files contain invented accounts/passwords, not working credentials. In desktop mode with no downloaded Confluence rows, add `multisource-test.xlsx` and `multisource-test.json` together. Expect **8 rows and 13 columns including Source**: three Mobile users plus two Business users from Excel, and three JSON rows.

Verify:

- MSISDN/Username and Market/Country combine.
- Missing fields show `null`; leading zeroes in `00070001`, Balance `0`, and Upgrade eligible `false` survive.
- `00070001` appears twice intentionally because rows are not deduplicated.
- Choose filter columns can enable Offer/Environment/Upgrade eligible. Offer = null matches six rows.
- Copy shows **Copied** and pastes the expected value.
- Removing JSON leaves five rows and removes Offer/Balance columns; re-adding restores eight.

Browser mode includes the original sample dataset and therefore different totals. Files last only for the session.

## Formats

JSON accepts an object array or `{ "rows": [...] }` / `{ "data": [...] }`. Object property names are headers. Nested values become JSON strings. Quote IDs to preserve leading zeroes.

```json
[
  {"MSISDN": "00070001", "Market": "AL", "Service": "Mobile"},
  {"Username": "demo-user", "Environment": "QA", "Offer": null}
]
```

Excel accepts XLSX/XLS and imports all non-empty worksheets. Put named headers in row 1 and data below. Store identifiers as text. Empty cells become null. Formulas use stored/cached results; the importer does not calculate Excel formulas.

Headers normalize case/spacing/punctuation and known aliases: MSISDN/Username, Country/Market, Env/Environment, Service/Service type, Pass/Password and Role/Business role. The first source label is displayed. Use distinct names for distinct attributes. Conflicting aliases within a file row are rejected.

Confluence reads all qualifying tables with a first header row of at least two named columns plus a data row. Avoid unrelated layout tables. Page links need `pageId` or `/pages/<id>/` on the configured organization host.

## Limits

- 10 MB per file; 10,000 rows per JSON file or Excel workbook.
- 200 columns per uploaded source; each Excel sheet becomes a source.
- 20 Confluence pages, up to 10,000 parsed rows per page.
- Combined: 60 sources, 50,000 rows, 300 data columns plus Source.

If combined limits are exceeded, remove a source to recover. Removing a file does not modify a page. Signing out clears Confluence copies but keeps session file sources.
