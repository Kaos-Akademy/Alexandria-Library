package sdksender

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/onflow/flow-go-sdk"
	"github.com/onflow/flow-go-sdk/crypto"
)

type accountIdentity struct {
	Name     string
	Address  flow.Address
	KeyIndex uint32
	Signer   crypto.Signer
}

type contractAliases map[string]string

type flowJSON struct {
	Networks  map[string]string          `json:"networks"`
	Accounts  map[string]flowAccountJSON `json:"accounts"`
	Contracts map[string]json.RawMessage `json:"contracts"`
}

type flowAccountJSON struct {
	Address string          `json:"address"`
	Key     json.RawMessage `json:"key"`
}

type flowKeyJSON struct {
	Type               string `json:"type"`
	Location           string `json:"location"`
	Index              uint32 `json:"index"`
	SignatureAlgorithm string `json:"signatureAlgorithm"`
	HashAlgorithm      string `json:"hashAlgorithm"`
	PrivateKey         string `json:"privateKey"`
}

func loadFlowConfig(repoRoot string) (*flowJSON, error) {
	b, err := os.ReadFile(filepath.Join(repoRoot, "flow.json"))
	if err != nil {
		return nil, err
	}
	var cfg flowJSON
	if err := json.Unmarshal(b, &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}

func qualifyAlias(network, alias string) string {
	trimmed := strings.TrimSpace(alias)
	if trimmed == "" {
		return ""
	}
	prefix := network + "-"
	if strings.HasPrefix(trimmed, prefix) {
		return trimmed
	}
	return prefix + trimmed
}

func loadAccountIdentity(repoRoot, network string, cfg *flowJSON, alias string) (accountIdentity, error) {
	qualified := qualifyAlias(network, alias)
	account, ok := cfg.Accounts[qualified]
	if !ok {
		return accountIdentity{}, fmt.Errorf("account alias not found in flow.json: %s", qualified)
	}

	keyCfg, err := parseFlowKey(account.Key)
	if err != nil {
		return accountIdentity{}, fmt.Errorf("parse key for %s: %w", qualified, err)
	}

	privateKey, sigAlgo, hashAlgo, err := resolvePrivateKey(repoRoot, keyCfg)
	if err != nil {
		return accountIdentity{}, fmt.Errorf("resolve private key for %s: %w", qualified, err)
	}
	signer, err := crypto.NewInMemorySigner(privateKey, hashAlgo)
	if err != nil {
		return accountIdentity{}, fmt.Errorf("create signer for %s (%s/%s): %w", qualified, sigAlgo, hashAlgo, err)
	}

	return accountIdentity{
		Name:     qualified,
		Address:  flow.HexToAddress(account.Address),
		KeyIndex: keyCfg.Index,
		Signer:   signer,
	}, nil
}

func parseFlowKey(raw json.RawMessage) (flowKeyJSON, error) {
	var key flowKeyJSON
	if len(raw) == 0 {
		return key, fmt.Errorf("missing key configuration")
	}
	if raw[0] == '"' {
		var hexKey string
		if err := json.Unmarshal(raw, &hexKey); err != nil {
			return key, err
		}
		key.Type = "hex"
		key.PrivateKey = hexKey
		key.Index = 0
		return key, nil
	}
	if err := json.Unmarshal(raw, &key); err != nil {
		return key, err
	}
	return key, nil
}

func resolvePrivateKey(repoRoot string, key flowKeyJSON) (crypto.PrivateKey, crypto.SignatureAlgorithm, crypto.HashAlgorithm, error) {
	sigAlgo, err := parseSigAlgo(key.SignatureAlgorithm)
	if err != nil {
		return nil, crypto.UnknownSignatureAlgorithm, crypto.UnknownHashAlgorithm, err
	}
	hashAlgo, err := parseHashAlgo(key.HashAlgorithm)
	if err != nil {
		return nil, crypto.UnknownSignatureAlgorithm, crypto.UnknownHashAlgorithm, err
	}

	var privateHex string
	switch strings.ToLower(strings.TrimSpace(key.Type)) {
	case "", "file":
		if strings.TrimSpace(key.Location) == "" {
			return nil, crypto.UnknownSignatureAlgorithm, crypto.UnknownHashAlgorithm, fmt.Errorf("key location is empty")
		}
		path := filepath.Join(repoRoot, key.Location)
		b, err := os.ReadFile(path)
		if err != nil {
			return nil, crypto.UnknownSignatureAlgorithm, crypto.UnknownHashAlgorithm, err
		}
		privateHex = strings.TrimSpace(string(b))
	case "hex":
		privateHex = strings.TrimSpace(key.PrivateKey)
	default:
		return nil, crypto.UnknownSignatureAlgorithm, crypto.UnknownHashAlgorithm, fmt.Errorf("unsupported key type: %s", key.Type)
	}

	privateHex = strings.TrimPrefix(privateHex, "0x")
	privateKey, err := crypto.DecodePrivateKeyHex(sigAlgo, privateHex)
	if err != nil {
		return nil, crypto.UnknownSignatureAlgorithm, crypto.UnknownHashAlgorithm, err
	}
	return privateKey, sigAlgo, hashAlgo, nil
}

func parseSigAlgo(raw string) (crypto.SignatureAlgorithm, error) {
	switch strings.ToUpper(strings.TrimSpace(raw)) {
	case "", "ECDSA_P256", "P256":
		return crypto.ECDSA_P256, nil
	case "ECDSA_SECP256K1", "SECP256K1":
		return crypto.ECDSA_secp256k1, nil
	default:
		return crypto.UnknownSignatureAlgorithm, fmt.Errorf("unsupported signature algorithm: %s", raw)
	}
}

func parseHashAlgo(raw string) (crypto.HashAlgorithm, error) {
	switch strings.ToUpper(strings.TrimSpace(raw)) {
	case "", "SHA3_256":
		return crypto.SHA3_256, nil
	case "SHA2_256":
		return crypto.SHA2_256, nil
	default:
		return crypto.UnknownHashAlgorithm, fmt.Errorf("unsupported hash algorithm: %s", raw)
	}
}

func extractContractAliases(cfg *flowJSON, network string) contractAliases {
	aliases := contractAliases{}
	for contractName, raw := range cfg.Contracts {
		var obj struct {
			Aliases map[string]string `json:"aliases"`
		}
		if err := json.Unmarshal(raw, &obj); err == nil {
			if addr := strings.TrimSpace(obj.Aliases[network]); addr != "" {
				aliases[contractName] = withHexPrefix(addr)
			}
		}
	}
	return aliases
}

func withHexPrefix(addr string) string {
	if strings.HasPrefix(addr, "0x") {
		return addr
	}
	return "0x" + addr
}

var (
	importQuotedPattern   = regexp.MustCompile(`(?m)^\s*import\s+"([A-Za-z0-9_]+)"\s*$`)
	importPathNamePattern = regexp.MustCompile(`(?m)^\s*import\s+([A-Za-z0-9_]+)\s+from\s+"[^"]+"\s*$`)
)

func resolveCadenceImports(source string, aliases contractAliases) string {
	out := importQuotedPattern.ReplaceAllStringFunc(source, func(line string) string {
		m := importQuotedPattern.FindStringSubmatch(line)
		if len(m) != 2 {
			return line
		}
		name := m[1]
		addr, ok := aliases[name]
		if !ok {
			return line
		}
		return fmt.Sprintf("import %s from %s", name, addr)
	})
	out = importPathNamePattern.ReplaceAllStringFunc(out, func(line string) string {
		m := importPathNamePattern.FindStringSubmatch(line)
		if len(m) != 2 {
			return line
		}
		name := m[1]
		addr, ok := aliases[name]
		if !ok {
			return line
		}
		return fmt.Sprintf("import %s from %s", name, addr)
	})
	return out
}
