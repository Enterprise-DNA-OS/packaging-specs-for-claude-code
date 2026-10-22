# Packaging CLI

Use node scripts/packaging.mjs COMMAND. Add --json for machine-readable output. Values with spaces must be quoted. Flags take --name=value form; --dry-run is a bare flag. Dates use YYYY-MM-DD, weights use grams, percentages use percentage points. Mutations require --actor=NAME.

| Command | Arguments |
|---|---|
| /help | Show commands |
| /suppliers | List suppliers |
| /add-supplier | --name=NAME --owner=NAME --actor=NAME |
| /specs | List current specifications |
| /show | SPEC |
| /add-spec | --code=CODE --name=NAME --supplier=NAME --owner=NAME --material=TEXT --mass=GRAMS --recycled=PERCENT --food-contact=yes / no --use=TEXT --source=TEXT --review-due=DATE --actor=NAME --reason=TEXT |
| /revise | SPEC; same revision fields as add-spec, no identity fields |
| /evidence | SPEC |
| /add-evidence | SPEC --kind=food-contact / recycled-content --reference=TEXT --until=DATE --note=TEXT --actor=NAME |
| /review | SPEC --decision=approved / changes --note=TEXT --actor=NAME |
| /spec-review | Weekly specification review queue |
| /supplier-chase | Missing or expired supplier evidence |
| /change-impact | SPEC |
| /products | List products |
| /add-product | --code=CODE --name=NAME --owner=NAME --actor=NAME |
| /link-component | PRODUCT --spec=SPEC --quantity=NUMBER --actor=NAME |
| /pack-check | PRODUCT; current readiness findings |
| /material-rollup | Nominal component mass per pack, not a regulatory return |
| /actions | List open actions |
| /add-action | SPEC --title=TEXT --owner=NAME --due=DATE --actor=NAME |
| /close-action | ACTION_ID --evidence=TEXT --actor=NAME |
| /log | SPEC --note=TEXT --actor=NAME |
| /history | SPEC |
| /compliance | Evidence checks against cited principles and house rules |
| /attention | Overdue work and missing reviews |
| /insights | Ten cross-record questions |
| /draft-supplier-request | SPEC; local HTML only |
| /weekly-review | Local HTML review from three views |
| /release | PRODUCT --actor=NAME; checked immutable internal snapshot |
| /releases | Saved internal snapshots |
| /import | specright FILE.csv --map=FILE.json --source=TEXT --actor=NAME [--dry-run] |
| /imports | Import receipts |
| /export | --out=FILE.json |

revise takes all revision fields: material, mass, recycled, food-contact, use, source, review-due, actor and reason. It does not change the stable code, name, owner or supplier. Identity-field changes are a /customise task with an audited migration.

release creates a frozen internal snapshot only. Run npm run docs to render it. The live pack-check and pack-review document use current revisions; release-record uses the saved snapshot. Neither is permission to manufacture.

export writes to a new path. Keep exports and import working files under ignored exports/ and imports/ folders.
