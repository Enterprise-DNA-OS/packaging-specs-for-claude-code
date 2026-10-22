# Move a packaging specification register from Specright

Vendor sources checked 22 October 2026: [Packaging Management, Spec Grid CSV export](https://www.specright.com/modules/packaging-management-software/) and the vendor's [export overview](https://www.specright.com/blog/10-questions-about-specright-that-will-make-you-want-a-demo/). The latter is an older article; the current module page also documents CSV export. Columns depend on your configured grid, so no universal native layout is claimed.

## Export

Use your authorised Specright specification grid to export the packaging records and fields needed below as CSV. Have the account administrator check that the export includes every intended record, with filters and permissions accounted for. Keep the original unedited file privately. If using an Excel report, save a working copy as CSV UTF-8. Do not include report headings or totals as records.

## Map once

Copy examples/specright-mapping.json to imports/mapping.json. Its keys are fixed; each value is the exact heading in your own export. examples/specifications.csv is a fictional adapter fixture, not a promise that Specright uses these headings.

| Key | Meaning and normalisation |
|---|---|
| code | Stable specification code, unique ignoring case. Never use row numbers. |
| name | Specification name. Duplicate names are allowed but require code or ID matching. |
| supplier | Supplier name. New suppliers are created; ambiguous existing names stop the import. |
| owner | Internal packaging owner. Used for new supplier records too. |
| material | Material description, not an inferred resin classification. |
| mass | Grams per component, positive decimal, at most four places. Convert units before import. |
| recycled | Declared percentage from zero to one hundred. Do not infer missing data. |
| food-contact | Explicit yes or no. Map exported values deliberately before importing. |
| use | Intended food and operating conditions, or non-food purpose. |
| review-due | Valid YYYY-MM-DD date chosen by the business. No invented expiry. |

All fields are required. Unknown values stay unresolved until the owner supplies them. The command-level source label records which export this came from. Keep the original evidence documents separately and attach references with add-evidence after import.

```bash
node scripts/packaging.mjs import specright imports/specifications.csv --map=imports/mapping.json --source="Specright export 2026-10-22" --actor="Migration operator" --dry-run
node scripts/packaging.mjs import specright imports/specifications.csv --map=imports/mapping.json --source="Specright export 2026-10-22" --actor="Migration operator"
```

Dry run rolls back all writes, including newly created suppliers. A live import is one transaction. Malformed CSV, duplicate codes, invalid values, ambiguous suppliers and conflicts abort the whole file. Unchanged repeats do not duplicate specifications; each live attempt still records an import receipt. Changed existing specifications need revise and a fresh review. Import never approves.

## Reconcile and continue

Compare source codes and record counts, material weights, percentages and intended use against specs and show. Check imports for counts. Add product records and their component quantities with add-product and link-component. Attach current source evidence, then have a different reviewer approve each specification. Run spec-review, supplier-chase, pack-check and the generated documents before relying on the records.

Historical versions, evidence attachments, formulas, artwork, previous approvals, product hierarchies, supplier portal access, permissions, conversations and integrations do not transfer through this current-specification adapter. Enterprise DNA scopes and maps these separately. Keep access to your original archive until the business has verified the migration and retention arrangements. A complete migration depends on the export's completeness and agreed scope; it is not guaranteed to finish in a day.
