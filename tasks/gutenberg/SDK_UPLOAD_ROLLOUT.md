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

### Stage 5: 250 books, 250 proposers (fiction)

```bash
go run ./cmd/gutenberg upload \
  -manifest tasks/gutenberg/manifests/fiction_next250_batchN.json \
  -network mainnet \
  -signer Prime-librarian \
  -uploader sdk \
  -book-concurrency 250 \
  -proposer-key-count 250
```

Pass criteria:
- all 250 proposer aliases load from `flow.json`
- stable completion with no repeated invalid proposal key storms
- if failures spike from sequence issues, reduce `-book-concurrency` first

### Stage 6: 500 books, 500 proposers (fiction)

Use **500 proposer keys** but **150 book concurrency** to avoid Flow access-node rate limits:

```bash
go run ./cmd/gutenberg upload \
  -manifest tasks/gutenberg/manifests/fiction_next500_batchN.json \
  -network mainnet \
  -signer Prime-librarian \
  -uploader sdk \
  -book-concurrency 150 \
  -proposer-key-count 500 \
  -launch-stagger-ms 25
```

Pass criteria:
- all 500 proposer aliases load from `flow.json`
- stable completion with no `ResourceExhausted` / rate limit storms
- if failures spike from rate limits, reduce `-book-concurrency` further (keys can stay at 500)

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
