# Flow SDK Uploader Rollout

Use this staged sequence to validate `-uploader sdk` safely before larger runs.

## Preconditions

- `flow.json` contains signer and proposer aliases for the selected network.
- Books are already downloaded and split (`status=split` in manifest).
- Start with `-spike-sections` for short smoke tests, then remove it for full runs.

## Stage Commands

### Stage 1: 1 book, 1 proposer

```bash
go run ./cmd/gutenberg upload \
  -manifest tasks/gutenberg/manifests/philosophy.json \
  -network mainnet \
  -signer Prime-librarian \
  -uploader sdk \
  -book-concurrency 1 \
  -proposer-key-count 1 \
  -only-id <gutenberg_id> \
  -spike-sections 2
```

Pass criteria:
- 0 failed books
- no proposal-key mismatch loops

### Stage 2: 5 books, 5 proposers

```bash
go run ./cmd/gutenberg upload \
  -manifest tasks/gutenberg/manifests/philosophy.json \
  -network mainnet \
  -signer Prime-librarian \
  -uploader sdk \
  -book-concurrency 5 \
  -proposer-key-count 5
```

Pass criteria:
- failures are isolated by book
- successful books continue even when one fails

### Stage 3: 10 books, 10 proposers

```bash
go run ./cmd/gutenberg upload \
  -manifest tasks/gutenberg/manifests/philosophy.json \
  -network mainnet \
  -signer Prime-librarian \
  -uploader sdk \
  -book-concurrency 10 \
  -proposer-key-count 10
```

Pass criteria:
- stable completion with no repeated invalid proposal key storms
- throughput better than overflow sequential fallback

### Stage 4: 25 books, 10+ proposers

```bash
go run ./cmd/gutenberg upload \
  -manifest tasks/gutenberg/manifests/philosophy.json \
  -network mainnet \
  -signer Prime-librarian \
  -uploader sdk \
  -book-concurrency 25 \
  -proposer-key-count 10
```

Pass criteria:
- upload completes with acceptable failure rate for retries
- no global halt from one bad book

## Metrics to Record

- total books selected
- successful books
- failed books
- failed chapter index / tx name per failed book
- total runtime

## Fallback Guidance

- If failures spike from proposer sequence issues: reduce `-book-concurrency` first.
- If failures remain high: reduce proposer count and rerun.
- If network instability persists: temporarily switch to `-uploader overflow`.
