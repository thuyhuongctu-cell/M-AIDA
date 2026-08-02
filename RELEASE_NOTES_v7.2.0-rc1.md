# M-AIDA v7.2.0-rc1

Release date: 02 August 2026  
Status: release candidate for thesis-defense demonstration and controlled
pre-commercial evaluation  
Reviewed source boundary: `6ea81964681537d4b53ad1b4734390e608f04a94`
(PR #79)

## What this candidate is

`v7.2.0-rc1` packages M-AIDA's human-verified effect-size preparation workflow
as a resilient Defense App. It is designed to keep the verification, locking,
reset and export path usable when internet access or a live LLM is unavailable.

The release candidate contains local persistence, presenter controls,
offline-ready PWA support, launchers, smoke tests, the public academic preview,
and the provisional independent-validation package introduced in PR #79.

## Version and rights boundary

- `v7.1.1` remains the registered, DOI-archived reference release used by the
  dissertation and the intellectual-property dossier.
- `v7.2.0-rc1` is a later release candidate. It does not rewrite, replace or
  retrospectively relabel the registered `v7.1.1` record.
- `CITATION.cff`, the `v7.1.1` version DOI and registered-reference wording stay
  unchanged until a separate archive deposit and rights review authorize new
  version-specific citation metadata.
- This candidate remains research software. It is not a production SaaS,
  medical/legal/investment advice system, or an autonomous meta-analysis tool.

## Included verification evidence

- PR #79 head CI completed successfully (`workflow run 30696637831`).
- Backend/unit tests, Defense App smoke tests and independent-validation
  analysis tests passed for the reviewed PR head.
- Frontend type-check and production build passed.
- Public-site metrics guard passed across 24 pages.
- The public Defense App and its image asset returned HTTP 200 during the
  post-merge deployment check recorded in the release preparation history.

## Validation status

The independent benchmark remains pending. The 40 PRIMARY + 10 RESERVE frame is
provisional until all 40 primary full texts are available and every study is
confirmed as unused in development or prompt tuning. Synthetic fixtures test
calculations only; they are not evidence of extraction accuracy.

No accuracy, time-saving or commercial-readiness claim may be made from this
release candidate before the blinded two-coder benchmark, adjudication and
locked report are complete.

## Explicitly excluded

- PR #80 and later music-library changes on `main`.
- Open PR #74 (HeyGen audio pipeline).
- Open PR #2 (`dev/7.2` design placeholder).
- PostgreSQL multi-tenant production storage, authentication/RBAC, billing,
  tenant isolation, production audit logging and customer-PDF retention policy.
- Any new Zenodo version DOI or claim that CTU/commercial rights have been
  finalized beyond the existing documented baseline.

## Release checklist

- [x] Branch from reviewed merge commit `6ea8196`.
- [x] Preserve registered reference metadata for `v7.1.1`.
- [x] Record source, exclusions and validation limitations in a machine-readable
  manifest.
- [ ] Run the complete CI suite on the release-candidate commit.
- [ ] Confirm Windows one-click launch on the defense laptop.
- [ ] Confirm offline Verify -> Lock -> Reset -> Export rehearsal.
- [ ] Confirm the public Defense App and required assets return HTTP 200.
- [ ] Create annotated tag `v7.2.0-rc1` only after all required checks pass.
- [ ] Create a GitHub pre-release from the exact tagged commit.

## Rollback

Delete the release-candidate branch or pre-release and retain `v7.1.1` as the
registered reference. No database migration or production data rollback is
required because this release candidate introduces no production deployment or
remote data collection.
