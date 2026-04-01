package sdksender

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/onflow/cadence"
	"github.com/onflow/flow-go-sdk"
	grpcclient "github.com/onflow/flow-go-sdk/access/grpc"
)

type TxRequest struct {
	Name string
	Args []cadence.Value
}

type TxResult struct {
	TxID flow.Identifier
	Err  error
}

type Sender struct {
	repoRoot        string
	network         string
	client          *grpcclient.Client
	payer           accountIdentity
	proposerWorkers []accountIdentity
	hasBookLimiter  chan struct{}
	// proposalLocks: one mutex per proposal key index so only one in-flight tx uses that
	// key at a time (Flow scaling: one worker per key + fresh seq; this guards same key).
	proposalLocksMu sync.Mutex
	proposalLocks   map[uint32]*sync.Mutex
	jobs            chan txJob
	closeOnce       sync.Once
	scriptsMu       sync.Mutex
	scriptsCache    map[string][]byte
	contractAliases contractAliases
}

type txJob struct {
	req  TxRequest
	resp chan TxResult
}

const debugLogPath = "/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/.cursor/debug-e7c465.log"

func NewSender(repoRoot, network, signer string, proposerAliases []string) (*Sender, error) {
	cfg, err := loadFlowConfig(repoRoot)
	if err != nil {
		return nil, err
	}
	host, ok := cfg.Networks[network]
	if !ok || strings.TrimSpace(host) == "" {
		return nil, fmt.Errorf("network %q missing from flow.json", network)
	}
	client, err := grpcclient.NewClient(host)
	if err != nil {
		return nil, err
	}
	payer, err := loadAccountIdentity(repoRoot, network, cfg, signer)
	if err != nil {
		return nil, err
	}
	proposers := make([]accountIdentity, 0, len(proposerAliases))
	if len(proposerAliases) == 0 {
		proposers = append(proposers, payer)
	} else {
		for _, alias := range proposerAliases {
			id, err := loadAccountIdentity(repoRoot, network, cfg, alias)
			if err != nil {
				return nil, err
			}
			if id.Address != payer.Address {
				return nil, fmt.Errorf("proposer %s must use same address as signer %s", id.Name, payer.Name)
			}
			proposers = append(proposers, id)
		}
	}
	s := &Sender{
		repoRoot:        repoRoot,
		network:         network,
		client:          client,
		payer:           payer,
		proposerWorkers: proposers,
		hasBookLimiter:  make(chan struct{}, 4),
		proposalLocks:   map[uint32]*sync.Mutex{},
		jobs:            make(chan txJob, 1024),
		scriptsCache:    map[string][]byte{},
		contractAliases: extractContractAliases(cfg, network),
	}
	for _, proposer := range s.proposerWorkers {
		worker := proposer
		go s.workerLoop(worker)
	}
	return s, nil
}

func (s *Sender) Close() {
	s.closeOnce.Do(func() {
		close(s.jobs)
		_ = s.client.Close()
	})
}

func (s *Sender) Submit(ctx context.Context, req TxRequest) TxResult {
	resp := make(chan TxResult, 1)
	// #region agent log
	debugLogSDK("queue", "H1", "tasks/gutenberg/sdksender/sender.go:Submit", "submit queued", map[string]interface{}{
		"txName":     req.Name,
		"queueDepth": len(s.jobs),
	})
	// #endregion
	select {
	case s.jobs <- txJob{req: req, resp: resp}:
	case <-ctx.Done():
		return TxResult{Err: ctx.Err()}
	}
	select {
	case res := <-resp:
		return res
	case <-ctx.Done():
		return TxResult{Err: ctx.Err()}
	}
}

func (s *Sender) HasBook(ctx context.Context, title string) (bool, error) {
	script, err := s.loadScript("scripts/get_book.cdc")
	if err != nil {
		return false, err
	}
	select {
	case s.hasBookLimiter <- struct{}{}:
	case <-ctx.Done():
		return false, ctx.Err()
	}
	defer func() { <-s.hasBookLimiter }()
	// #region agent log
	debugLogSDK("has-book", "H4", "tasks/gutenberg/sdksender/sender.go:HasBook", "acquired hasBook limiter", map[string]interface{}{
		"title":          title,
		"inflightChecks": len(s.hasBookLimiter),
	})
	// #endregion

	const maxAttempts = 5
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		// #region agent log
		debugLogSDK("has-book", "H1", "tasks/gutenberg/sdksender/sender.go:HasBook", "execute get_book script", map[string]interface{}{
			"title":   title,
			"attempt": attempt,
		})
		// #endregion
		val, execErr := s.client.ExecuteScriptAtLatestBlock(ctx, script, []cadence.Value{cadence.String(title)})
		if execErr != nil {
			if isBookMissingError(execErr) {
				// #region agent log
				debugLogSDK("has-book", "H3", "tasks/gutenberg/sdksender/sender.go:HasBook", "book missing precondition treated as false", map[string]interface{}{
					"title": title,
					"error": execErr.Error(),
				})
				// #endregion
				return false, nil
			}
			retry := isRateLimitedError(execErr) || isTransientError(execErr)
			// #region agent log
			debugLogSDK("has-book", "H3", "tasks/gutenberg/sdksender/sender.go:HasBook", "get_book script errored", map[string]interface{}{
				"title":     title,
				"attempt":   attempt,
				"retryable": retry,
				"error":     execErr.Error(),
			})
			// #endregion
			if retry && attempt < maxAttempts {
				select {
				case <-ctx.Done():
					return false, ctx.Err()
				case <-time.After(time.Duration(attempt*200) * time.Millisecond):
				}
				continue
			}
			return false, execErr
		}
		opt, ok := val.(cadence.Optional)
		if !ok {
			return false, nil
		}
		return opt.Value != nil, nil
	}
	return false, fmt.Errorf("hasBook retries exhausted for %q", title)
}

const bookExistBatchChunk = 40

// BooksExistBatch runs scripts/books_exist_batch.cdc in chunks to limit script size and RPC load.
// Order of flags matches the order of titles.
func (s *Sender) BooksExistBatch(ctx context.Context, titles []string) ([]bool, error) {
	if len(titles) == 0 {
		return nil, nil
	}
	script, err := s.loadScript("scripts/books_exist_batch.cdc")
	if err != nil {
		return nil, err
	}
	out := make([]bool, 0, len(titles))
	for start := 0; start < len(titles); start += bookExistBatchChunk {
		end := start + bookExistBatchChunk
		if end > len(titles) {
			end = len(titles)
		}
		chunk := titles[start:end]
		vals := make([]cadence.Value, len(chunk))
		for i, t := range chunk {
			vals[i] = cadence.String(t)
		}
		arg := cadence.NewArray(vals)
		const maxAttempts = 6
		var chunkVals cadence.Value
		var lastErr error
		for attempt := 1; attempt <= maxAttempts; attempt++ {
			v, execErr := s.client.ExecuteScriptAtLatestBlock(ctx, script, []cadence.Value{arg})
			if execErr != nil {
				lastErr = execErr
				if isRateLimitedError(execErr) || isTransientError(execErr) {
					select {
					case <-ctx.Done():
						return nil, ctx.Err()
					case <-time.After(time.Duration(attempt*300) * time.Millisecond):
					}
					continue
				}
				return nil, execErr
			}
			chunkVals = v
			lastErr = nil
			break
		}
		if lastErr != nil {
			return nil, lastErr
		}
		bools, err := decodeCadenceBoolArray(chunkVals)
		if err != nil {
			return nil, err
		}
		if len(bools) != len(chunk) {
			return nil, fmt.Errorf("books_exist_batch: got %d flags for %d titles", len(bools), len(chunk))
		}
		out = append(out, bools...)
	}
	return out, nil
}

func decodeCadenceBoolArray(val cadence.Value) ([]bool, error) {
	arr, ok := val.(cadence.Array)
	if !ok {
		return nil, fmt.Errorf("expected cadence.Array, got %T", val)
	}
	out := make([]bool, 0, len(arr.Values))
	for _, e := range arr.Values {
		b, ok := e.(cadence.Bool)
		if !ok {
			return nil, fmt.Errorf("expected Bool, got %T", e)
		}
		out = append(out, bool(b))
	}
	return out, nil
}

func (s *Sender) lockProposalKey(idx uint32) func() {
	s.proposalLocksMu.Lock()
	m, ok := s.proposalLocks[idx]
	if !ok {
		m = &sync.Mutex{}
		s.proposalLocks[idx] = m
	}
	s.proposalLocksMu.Unlock()
	m.Lock()
	return func() { m.Unlock() }
}

func (s *Sender) workerLoop(proposer accountIdentity) {
	for job := range s.jobs {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
		res := s.sendWithRetry(ctx, job.req, proposer)
		cancel()
		job.resp <- res
	}
}

func (s *Sender) sendWithRetry(ctx context.Context, req TxRequest, proposer accountIdentity) TxResult {
	var lastErr error
	const maxAttempts = 4
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		// #region agent log
		debugLogSDK("send", "H2", "tasks/gutenberg/sdksender/sender.go:sendWithRetry", "send attempt", map[string]interface{}{
			"txName":   req.Name,
			"attempt":  attempt,
			"proposer": proposer.Name,
			"keyIndex": proposer.KeyIndex,
		})
		// #endregion
		txID, err := s.sendOnce(ctx, req, proposer)
		if err == nil {
			return TxResult{TxID: txID}
		}
		lastErr = err
		// #region agent log
		debugLogSDK("send", "H2", "tasks/gutenberg/sdksender/sender.go:sendWithRetry", "send attempt failed", map[string]interface{}{
			"txName":    req.Name,
			"attempt":   attempt,
			"retryable": retryable(err),
			"error":     err.Error(),
			"proposer":  proposer.Name,
			"keyIndex":  proposer.KeyIndex,
		})
		// #endregion
		if !retryable(err) || attempt == maxAttempts {
			break
		}
		wait := time.Duration(attempt*250) * time.Millisecond
		select {
		case <-ctx.Done():
			return TxResult{Err: ctx.Err()}
		case <-time.After(wait):
		}
	}
	return TxResult{Err: lastErr}
}

func (s *Sender) sendOnce(ctx context.Context, req TxRequest, proposer accountIdentity) (flow.Identifier, error) {
	unlockProp := s.lockProposalKey(proposer.KeyIndex)
	defer unlockProp()

	scriptPath := filepath.Join("transactions", req.Name+".cdc")
	script, err := s.loadScript(scriptPath)
	if err != nil {
		return flow.Identifier{}, err
	}
	latestBlock, err := s.client.GetLatestBlockHeader(ctx, true)
	if err != nil {
		return flow.Identifier{}, err
	}
	account, err := s.client.GetAccount(ctx, s.payer.Address)
	if err != nil {
		return flow.Identifier{}, err
	}
	seq, err := keySequenceByIndex(account, proposer.KeyIndex)
	if err != nil {
		return flow.Identifier{}, err
	}

	tx := flow.NewTransaction().
		SetScript(script).
		SetComputeLimit(9999).
		SetReferenceBlockID(latestBlock.ID).
		SetProposalKey(s.payer.Address, proposer.KeyIndex, seq).
		SetPayer(s.payer.Address).
		AddAuthorizer(s.payer.Address)

	for _, arg := range req.Args {
		if err := tx.AddArgument(arg); err != nil {
			return flow.Identifier{}, err
		}
	}

	if proposer.KeyIndex != s.payer.KeyIndex || proposer.Address != s.payer.Address {
		if err := tx.SignPayload(s.payer.Address, proposer.KeyIndex, proposer.Signer); err != nil {
			return flow.Identifier{}, err
		}
	} else {
		// #region agent log
		debugLogSDK("send", "H6", "tasks/gutenberg/sdksender/sender.go:sendOnce", "skip duplicate payload signature for payer/proposer same key", map[string]interface{}{
			"proposer": proposer.Name,
			"keyIndex": proposer.KeyIndex,
			"txName":   req.Name,
		})
		// #endregion
	}
	if err := tx.SignEnvelope(s.payer.Address, s.payer.KeyIndex, s.payer.Signer); err != nil {
		return flow.Identifier{}, err
	}

	if err := s.client.SendTransaction(ctx, *tx); err != nil {
		return flow.Identifier{}, err
	}
	if err := waitForSeal(ctx, s.client, tx.ID()); err != nil {
		return tx.ID(), err
	}
	return tx.ID(), nil
}

func (s *Sender) loadScript(relPath string) ([]byte, error) {
	s.scriptsMu.Lock()
	defer s.scriptsMu.Unlock()
	if script, ok := s.scriptsCache[relPath]; ok {
		return script, nil
	}
	fullPath := filepath.Join(s.repoRoot, relPath)
	b, err := os.ReadFile(fullPath)
	if err != nil {
		return nil, err
	}
	resolved := resolveCadenceImports(string(b), s.contractAliases)
	script := []byte(resolved)
	s.scriptsCache[relPath] = script
	return script, nil
}

func keySequenceByIndex(account *flow.Account, idx uint32) (uint64, error) {
	for _, key := range account.Keys {
		if key.Index == idx {
			return key.SequenceNumber, nil
		}
	}
	return 0, fmt.Errorf("key index %d not found on account %s", idx, account.Address)
}

func waitForSeal(ctx context.Context, client *grpcclient.Client, txID flow.Identifier) error {
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()
	for {
		res, err := client.GetTransactionResult(ctx, txID)
		if err != nil {
			return err
		}
		if res.Error != nil {
			return res.Error
		}
		if res.Status == flow.TransactionStatusSealed {
			return nil
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
	}
}

func retryable(err error) bool {
	if err == nil {
		return false
	}
	return isRateLimitedError(err) || isTransientError(err) || isProposalError(err)
}

func isProposalError(err error) bool {
	s := strings.ToLower(err.Error())
	return strings.Contains(s, "invalid proposal key") ||
		strings.Contains(s, "transaction expired")
}

func isTransientError(err error) bool {
	s := strings.ToLower(err.Error())
	return strings.Contains(s, "timeout") ||
		strings.Contains(s, "tempor") ||
		strings.Contains(s, "unavailable")
}

func isRateLimitedError(err error) bool {
	s := strings.ToLower(err.Error())
	return strings.Contains(s, "resourceexhausted") || strings.Contains(s, "rate limited")
}

func isBookMissingError(err error) bool {
	s := strings.ToLower(err.Error())
	return strings.Contains(s, "book doesn't exist in the library") ||
		strings.Contains(s, "book does not exist in the library")
}

func debugLogSDK(runID, hypothesisID, location, message string, data map[string]interface{}) {
	f, err := os.OpenFile(debugLogPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()
	payload := map[string]interface{}{
		"sessionId":    "e7c465",
		"runId":        runID,
		"hypothesisId": hypothesisID,
		"location":     location,
		"message":      message,
		"data":         data,
		"timestamp":    time.Now().UnixMilli(),
	}
	b, err := json.Marshal(payload)
	if err != nil {
		return
	}
	_, _ = f.Write(append(b, '\n'))
}
