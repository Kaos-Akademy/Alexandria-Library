package sdksender

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
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
	payerSignMu     sync.Mutex // InMemorySigner is not safe for concurrent SignEnvelope calls
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
		contractAliases: contractAliasesForSigner(extractContractAliases(cfg, network), payer.Address),
	}
	for _, proposer := range s.proposerWorkers {
		worker := proposer
		go s.workerLoop(worker)
	}
	// #region agent log
	{
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		acct, acctErr := client.GetAccount(ctx, payer.Address)
		cancel()
		data := map[string]interface{}{
			"address": payer.Address.Hex(), "proposerCount": len(proposers), "network": network,
		}
		if acctErr != nil {
			data["accountFetchErr"] = acctErr.Error()
		} else {
			data["onChainKeyCount"] = len(acct.Keys)
		}
		agentDebugLog("H4", "sender.go:NewSender", "account snapshot at sender init", data)
	}
	// #endregion
	return s, nil
}

func (s *Sender) Close() {
	s.closeOnce.Do(func() {
		close(s.jobs)
		_ = s.client.Close()
	})
}

func (s *Sender) PayerAddress() flow.Address {
	return s.payer.Address
}

func (s *Sender) Client() *grpcclient.Client {
	return s.client
}

// SendPreparedTransaction signs a template tx as payer/proposer key 0 and waits for seal.
func (s *Sender) SendPreparedTransaction(ctx context.Context, tx *flow.Transaction) TxResult {
	proposer := s.payer
	if len(s.proposerWorkers) > 0 {
		proposer = s.proposerWorkers[0]
	}
	var cachedSeq uint64
	hasSeq := false
	txID, err := s.sendPreparedOnce(ctx, tx, proposer, &cachedSeq, &hasSeq)
	if err != nil {
		return TxResult{TxID: txID, Err: err}
	}
	return TxResult{TxID: txID}
}

func (s *Sender) sendPreparedOnce(ctx context.Context, tx *flow.Transaction, proposer accountIdentity, cachedSeq *uint64, hasSeq *bool) (flow.Identifier, error) {
	unlockProp := s.lockProposalKey(proposer.KeyIndex)
	defer unlockProp()

	if !*hasSeq {
		seq, err := s.fetchKeySequence(ctx, proposer.KeyIndex)
		if err != nil {
			return flow.Identifier{}, err
		}
		*cachedSeq = seq
		*hasSeq = true
	}
	seq := *cachedSeq

	latestBlock, err := s.client.GetLatestBlockHeader(ctx, true)
	if err != nil {
		return flow.Identifier{}, err
	}

	tx.SetComputeLimit(9999).
		SetReferenceBlockID(latestBlock.ID).
		SetProposalKey(s.payer.Address, proposer.KeyIndex, seq).
		SetPayer(s.payer.Address)

	if proposer.KeyIndex != s.payer.KeyIndex || proposer.Address != s.payer.Address {
		if err := tx.SignPayload(s.payer.Address, proposer.KeyIndex, proposer.Signer); err != nil {
			return flow.Identifier{}, err
		}
	}
	s.payerSignMu.Lock()
	err = tx.SignEnvelope(s.payer.Address, s.payer.KeyIndex, s.payer.Signer)
	s.payerSignMu.Unlock()
	if err != nil {
		return flow.Identifier{}, err
	}

	if err := s.client.SendTransaction(ctx, *tx); err != nil {
		if isProposalError(err) {
			*hasSeq = false
		}
		return flow.Identifier{}, err
	}
	*cachedSeq++
	txID := tx.ID()

	if err := waitForSeal(ctx, s.client, txID); err != nil {
		return txID, err
	}
	return txID, nil
}

// GetAccountCreatedAddress parses flow.AccountCreated from a sealed transaction.
func (s *Sender) GetAccountCreatedAddress(ctx context.Context, txID flow.Identifier) (flow.Address, error) {
	result, err := s.client.GetTransactionResult(ctx, txID)
	if err != nil {
		return flow.EmptyAddress, err
	}
	for _, ev := range result.Events {
		if ev.Type != flow.EventAccountCreated {
			continue
		}
		return flow.AccountCreatedEvent(ev).Address(), nil
	}
	return flow.EmptyAddress, fmt.Errorf("flow.AccountCreated not found in tx %s", txID)
}

func (s *Sender) Submit(ctx context.Context, req TxRequest) TxResult {
	resp := make(chan TxResult, 1)
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

	const maxAttempts = 5
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		val, execErr := s.client.ExecuteScriptAtLatestBlock(ctx, script, []cadence.Value{cadence.String(title)})
		if execErr != nil {
			if isBookMissingError(execErr) {
				return false, nil
			}
			retry := isRateLimitedError(execErr) || isTransientError(execErr)
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
	var cachedSeq uint64
	hasSeq := false
	for job := range s.jobs {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
		res := s.sendWithRetry(ctx, job.req, proposer, &cachedSeq, &hasSeq)
		cancel()
		job.resp <- res
	}
}

func (s *Sender) sendWithRetry(ctx context.Context, req TxRequest, proposer accountIdentity, cachedSeq *uint64, hasSeq *bool) TxResult {
	var lastErr error
	maxAttempts := 4
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		txID, err := s.sendOnce(ctx, req, proposer, cachedSeq, hasSeq)
		if err == nil {
			return TxResult{TxID: txID}
		}
		lastErr = err
		if isRateLimitedError(err) {
			maxAttempts = 6
		}
		if isProposalError(err) {
			*hasSeq = false
		}
		if !retryable(err) || attempt >= maxAttempts {
			break
		}
		wait := retryBackoff(attempt)
		select {
		case <-ctx.Done():
			return TxResult{Err: ctx.Err()}
		case <-time.After(wait):
		}
	}
	// #region agent log
	if lastErr != nil {
		agentDebugLog("H1-H3", "sender.go:sendWithRetry", "tx failed after retries", map[string]interface{}{
			"txName": req.Name, "keyIndex": proposer.KeyIndex, "attempts": maxAttempts,
			"errorClass": ClassifyError(lastErr), "errSnippet": truncateErr(lastErr.Error(), 280),
		})
	}
	// #endregion
	return TxResult{Err: lastErr}
}

// #region agent log
const debugLogPath = "/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/.cursor/debug-d1f762.log"

func agentDebugLog(hypothesisID, location, message string, data map[string]interface{}) {
	f, err := os.OpenFile(debugLogPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()
	payload := map[string]interface{}{
		"sessionId": "d1f762", "runId": "debug-run", "hypothesisId": hypothesisID,
		"location": location, "message": message, "data": data, "timestamp": time.Now().UnixMilli(),
	}
	b, _ := json.Marshal(payload)
	_, _ = f.Write(append(b, '\n'))
}

func DebugLog(hypothesisID, location, message string, data map[string]interface{}) {
	agentDebugLog(hypothesisID, location, message, data)
}

func truncateErr(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max] + "..."
}

// #endregion

func retryBackoff(attempt int) time.Duration {
	if attempt < 1 {
		attempt = 1
	}
	base := time.Duration(250<<(attempt-1)) * time.Millisecond
	jitter := time.Duration(float64(base) * (0.5 + rand.Float64()*0.5))
	return base/2 + jitter
}

// RetryBackoff returns exponential backoff with jitter for retryable failures.
func RetryBackoff(attempt int) time.Duration {
	return retryBackoff(attempt)
}

func (s *Sender) fetchKeySequence(ctx context.Context, keyIndex uint32) (uint64, error) {
	account, err := s.client.GetAccount(ctx, s.payer.Address)
	if err != nil {
		return 0, err
	}
	return keySequenceByIndex(account, keyIndex)
}

func (s *Sender) sendOnce(ctx context.Context, req TxRequest, proposer accountIdentity, cachedSeq *uint64, hasSeq *bool) (flow.Identifier, error) {
	unlockProp := s.lockProposalKey(proposer.KeyIndex)
	defer unlockProp()

	if !*hasSeq {
		seq, err := s.fetchKeySequence(ctx, proposer.KeyIndex)
		if err != nil {
			return flow.Identifier{}, err
		}
		*cachedSeq = seq
		*hasSeq = true
	}
	seq := *cachedSeq

	scriptPath := filepath.Join("transactions", req.Name+".cdc")
	script, err := s.loadScript(scriptPath)
	if err != nil {
		return flow.Identifier{}, err
	}
	latestBlock, err := s.client.GetLatestBlockHeader(ctx, true)
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
	}
	s.payerSignMu.Lock()
	err = tx.SignEnvelope(s.payer.Address, s.payer.KeyIndex, s.payer.Signer)
	s.payerSignMu.Unlock()
	if err != nil {
		return flow.Identifier{}, err
	}

	if err := s.client.SendTransaction(ctx, *tx); err != nil {
		if isProposalError(err) {
			*hasSeq = false
		}
		return flow.Identifier{}, err
	}
	*cachedSeq++

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

func RetryableError(err error) bool {
	return retryable(err)
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
		strings.Contains(s, "1007") ||
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

func isStorageLimitError(err error) bool {
	s := strings.ToLower(err.Error())
	return strings.Contains(s, "storage limit") ||
		strings.Contains(s, "flowstoragefees") ||
		(strings.Contains(s, "computation exceeds limit") && strings.Contains(s, "1110"))
}

// ClassifyError buckets tx failures for debug analysis.
func ClassifyError(err error) string {
	if err == nil {
		return "none"
	}
	switch {
	case isStorageLimitError(err):
		return "storage_computation"
	case isRateLimitedError(err):
		return "rate_limit"
	case isProposalError(err):
		return "proposal_sequence"
	case isTransientError(err):
		return "transient"
	default:
		return "other"
	}
}

func isBookMissingError(err error) bool {
	s := strings.ToLower(err.Error())
	return strings.Contains(s, "book doesn't exist in the library") ||
		strings.Contains(s, "book does not exist in the library")
}
