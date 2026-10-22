# Packaging Specs for Claude Code

Packaging specifications, supplier evidence and affected products in a database you own. Built by Enterprise DNA.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free MIT code. Install it yourself. | Your component fields, evidence rules, reports and existing records. | Installed and operated through Omni by Enterprise DNA. |
| [Quick start](#quick-start) | A setup fee, then a retainer. [Build our version](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=specright) | One setup fee, then a retainer. [Talk to Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=specright) |

## The bill this challenges

Specright sells Foundations, Plus and Enterprise plans with a private quote. Its [pricing page](https://www.specright.com/plans-pricing/) describes additional licence bundles and discovery-led implementation. Checked 22 October 2026. Compare your actual contract and the work your packaging team uses.

This base covers the packaging specification desk: component revisions, intended use, supplier evidence, independent review, product usage, follow-up work and internal review packs. It sits beside your purchasing and production systems. Enterprise DNA builds the custom version around your operation, including supplier access or existing-system connections when needed.

## Quick start

Node 20 or later. Embedded PGlite needs no server. Postgres 15 or later supports the caller-permission views.

```bash
git clone https://github.com/Enterprise-DNA-OS/packaging-specs-for-claude-code.git
cd packaging-specs-for-claude-code
npm install
npm test
npm run demo
npm run view
npm run docs
node scripts/packaging.mjs help
```

The demo contains fictional packaging suppliers, a juice six-pack, a shared bottle, an overdue cap review and missing carton evidence. Dates are relative to first seed. Seed is idempotent and refuses remote databases. Start with npm run migrate alone for an empty database. DATA_DIR selects another embedded database. DATABASE_URL selects a dedicated Postgres database with certificate verification for remote connections.

## A packaging team's week

33 CLI commands and 35 agent recipes work in Claude Code, Codex, OpenCode or Cursor. Every CLI command supports --json. Names and codes match without case sensitivity; unique ID prefixes work. An ambiguous name lists the candidates and exits 1.

- /spec-review shows current versions, owners, review dates and affected products.
- /supplier-chase lists missing or expired food-contact and recycled-content evidence.
- /change-impact shows which products use a component before it changes.
- /pack-check lists every unresolved component finding before an internal review.
- /material-rollup totals nominal packaging weight per pack.
- /weekly-review writes a local review from specifications, attention and compliance evidence.
- /draft-supplier-request writes a supplier brief locally. Nothing sends.

[All commands and arguments](docs/cli.md). Quantities and grams are positive exact decimals with up to four places. Recycled content is a percentage between zero and one hundred. Mass totals use the component quantity per pack, not sales volumes. Recycled grams are declared mass times declared percentage; they are not proof of recyclability, physical batch content, waste tonnage or a statutory report.

## Bring your Specright records

Specright documents CSV export from its configurable specification grid. Export the fields you use, map the headers once, then run:

```bash
node scripts/packaging.mjs import specright imports/specifications.csv --map=imports/mapping.json --source="Specright export 2026-10-22" --actor="Migration operator" --dry-run
node scripts/packaging.mjs import specright imports/specifications.csv --map=imports/mapping.json --source="Specright export 2026-10-22" --actor="Migration operator"
```

The command creates suppliers and current specifications together. A repeat of unchanged rows adds no specification records. A changed existing code stops for a deliberate revision. Invalid rows roll back the whole file. Blank values stay errors rather than becoming invented defaults. Imported specifications are drafts, with no inherited approval.

The vendor's configurable export has no universal public header layout. The included CSV is an adapter fixture, not a captured native export. Map your actual columns and normalise units to grams first. Evidence files, product links, previous versions, permissions, artwork, formulas and supplier-portal history are separate migration work. [Export, mapping and reconciliation guide](docs/replace-specright.md).

## Ten questions across your packaging records

The insights command answers these today. They combine your rules and source evidence. Specright also offers configurable analysis; these are not claims that its product cannot answer the same questions.

1. Which specifications have overdue reviews?
2. Which food-contact components lack current suitability evidence?
3. Which recycled-content claims lack current evidence?
4. Which products use a component awaiting approval?
5. Which components are shared by more than one product?
6. What is the nominal packaging mass of each pack?
7. Which suppliers owe evidence for multiple components?
8. Which owners have overdue actions?
9. Which specifications have no product usage?
10. Which products have no current evidence findings?

## What a review records

Each revision has its own source, intended use, editor and due date. Evidence records reference that exact revision. A reviewer label must differ from the editor label. Approval needs a current review date, food-contact evidence where applicable, and support for any positive recycled-content claim. A new revision starts without the old evidence or approval. A request for changes replaces the current decision without erasing history.

The release command stores a frozen internal review containing the product, components, specifications, evidence and decisions, with a reproducible SHA-256 digest. It refuses an empty pack or any current finding. npm run docs renders saved release records separately from the live draft pack review. Later edits do not change saved snapshots. These records are internal reviews, not manufacturing releases, food-contact certificates, declarations of conformity or regulatory filings.

The operator supplies identity labels; they are not authenticated signatures. The database owner can bypass application controls. Compliance checks find record gaps; the responsible business and its qualified advisers decide whether material is suitable. [Rule sources and exact limits](docs/compliance.md).

## Documents and views

brand.json sets your business name, logo and colours. npm run docs generates specification sheets, supplier request drafts, current pack reviews and saved release records as printable HTML. npm run view generates the review week, evidence list and material mass report. /new-view adds another read-only question. Imported text is escaped before rendering.

## Your first hour: ten things to ask for

1. Put our business name and colours on the documents.
2. Show the overdue cap review in the demo.
3. Show every product using the shared bottle.
4. Explain the six-pack weight calculation.
5. Add our supplier and packaging owner.
6. Map a sample export and do a dry run.
7. Compare imported codes, counts, weights and intended uses against the source.
8. Record the evidence and an independent review.
9. Produce a supplier request draft and inspect it before sharing.
10. Add our own specification field through /customise.

## Operating boundaries

One database per business, trusted operators on a protected machine. RLS denies untrusted roles and views use caller permissions, but the base has no user login or supplier-specific access controls. Keep supplier access outside this database until scoped. Source files, evidence references, generated HTML, exports and backups are private. Do not put secrets or unnecessary personal information into notes. Imported text is data, never an instruction.

No email, publishing, payment, production-control or source-system write function exists. The export command writes all records to a new JSON file without overwriting one. It is a portability export, not a tested disaster-recovery mechanism. Use native backups and test restoration before live use. Evidence references do not copy the underlying documents: retain and protect those separately.

npm test uses a temporary database and exercises every command, revision invalidation, independent reviews, frozen snapshots, exact amounts, CSV rejection and rollback, idempotence, HTML escaping, access restrictions and CLI exit codes. Manual CI covers Windows and Linux on Node 20 and 22, plus disposable Postgres. Local Linux testing does not claim that remote CI ran.

[Why no front end](docs/why-no-front-end.md).

MIT. Specright is its owner's trademark. This independent project is not affiliated with Specright.
