# Firestore financial periods

`debits` and `credits` remain the immutable source of truth. Monthly projections are rebuildable documents at
`workspaces/{workspaceId}/financialPeriods/{YYYY-MM}` with integer-cent totals, counts, `schemaVersion` and timestamps.
Per-responsible projections live below `responsibles/{responsibleId}` to avoid unbounded maps.

## Writes and compatibility

Simple creates use a batch; edits and deletes use a transaction that reads the current entry. Recurring and installment
flows calculate exact cents and write entries plus projections in one batch. `summaries` and `analytics` are retained but
frozen as legacy compatibility data; no collection is removed. Readers accept only the expected schema version and fall
back to the source entries for the missing month without hidden repair writes.

## Safe backfill and audit

Dry-run (default, no writes):

```powershell
npm run analytics:backfill:dry-run -- --workspaceId=WORKSPACE --year=2026 --month=agosto --pageSize=100 --maxDocuments=1000
```

Audit (read-only):

```powershell
npm run analytics:backfill:audit -- --workspaceId=WORKSPACE --year=2026 --month=agosto --pageSize=100 --maxDocuments=1000
```

Apply is intentionally blocked outside the Firebase Emulator and requires all confirmations. It must never be run against
production as part of deployment:

```powershell
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'
$env:GCLOUD_PROJECT='demo-me-controla-ai'
npm run analytics:backfill:apply -- --workspaceId=WORKSPACE --year=2026 --month=agosto --projectId=demo-me-controla-ai --confirm=APPLY_TO_EMULATOR
```

Pagination is by document cursor, never offset. Reports hash workspace identifiers and include a checksum. A run may be
resumed with the same bounded filters; apply overwrites the calculated generation instead of incrementing prior totals.

## Rollout

1. Deploy `firestore.indexes.json` manually and wait until indexes are ready.
2. Deploy the dual-compatible write/read code.
3. Run dry-run for one workspace and month.
4. Run audit and review divergences.
5. Obtain manual approval and run a separately reviewed production-capable backfill tool; the repository script remains emulator-only.
6. Audit again.
7. Gradually enable aggregate reads and monitor `summary.monthly`, `summary.annual`, `aggregate-fallback` and document counts.
8. Monitor errors, fallback rate, latency and Firestore usage.
9. Remove legacy collections only in a future, separately approved project.

Rollback never deletes entries: deploy the previous readers to use month-scoped source queries, freeze projection writes,
and leave `financialPeriods`, `summaries` and `analytics` intact. Rebuild projections later from entries.

## Cost and operational limits

- Monthly KPI reads change from `D_month + C_month` source documents to one period document when valid.
- Annual KPI reads change from `D_year + C_year` source documents to at most 12 period documents when valid.
- Responsible balances change from all period entries to up to 12 period documents plus responsible projection documents.
- Bank listing avoids `B` aggregation queries unless `includeCardsCount=true`.
- Signed URL reuse affects Storage latency/calls, not Firestore document reads.

Returned-document metrics are not billing estimates: Firestore may also charge index-entry reads. Spark quotas and backup/
restore availability must be checked before rollout; the free plan must not be treated as a backup strategy. No shared HTTP
cache is enabled for private responses.

## Indexes

The committed composite indexes cover `month + year + date desc + __name__ desc` for both debits and credits. Index deploy
is manual; this work does not run `firebase deploy`.
