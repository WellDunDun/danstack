# Public release review

Reviewed November 14, 2026, before changing repository visibility.

## Scope and findings

- Inspected the full reachable Git history and fetched origin refs. The pre-release repository had one source commit, `112eed54dd000848643a9dfe06f6356b230cb87a`, with 345 tracked files.
- Ran official Gitleaks 8.30.1 against all reachable history. Verified the downloaded release archive against its published SHA-256 checksum.
- Reviewed all 17 Gitleaks matches: 15 are upstream Git blob SHA-1 values in recorded file maps, and two are the explicitly synthetic WorkOS test value used by the server probe. No live credential was found in those matches.
- Ran a supplemental scan of reachable text blobs and text members inside the two tracked upstream test archives. Credential-like assignments were synthetic fixtures. Personal-email matches were public upstream package metadata and license attributions.
- Inspected the three tracked application screenshots. They show local synthetic greeting/setup-required screens, not real user accounts or client data.
- Historical receipts contain Daniel's local workspace paths and synthetic sample names. These nonsecret provenance paths are retained as documented historical evidence. The public quick-start no longer includes a machine-specific canonical checkout path.
- Confirmed GitHub had zero issues/PRs, Actions runs, Actions artifacts, and releases. There were no Actions logs to expose or review. Wiki and Pages were disabled.
- Retained upstream license notices and confirmed the TanStack generator carries the upstream template LICENSE into generated projects. Added a root MIT license for Daniel's authored code.

## Release checks

- `npm ci --ignore-scripts`
- `npm run check`
- `npm test`: 47 passing tests
- `git diff --check`

npm publication remains disabled with `"private": true`. No npm publishing workflow exists and no package publication was performed.
