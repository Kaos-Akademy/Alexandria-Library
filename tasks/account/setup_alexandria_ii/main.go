package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/fatih/color"
	"github.com/onflow/flow-go-sdk"
	"github.com/onflow/flow-go-sdk/crypto"
	"github.com/onflow/flow-go-sdk/templates"

	"alexandria/overflow/tasks/gutenberg/sdksender"
)

func main() {
	network := flag.String("network", "mainnet", "Flow network")
	payerSigner := flag.String("payer", "Prime-librarian", "Signer that creates and funds the new account")
	fundAmount := flag.String("fund-flow", "2000.0", "FLOW to send to the new account")
	keyFile := flag.String("key-file", "Alexandria-II.pkey", "path to write new account private key")
	proposerAliases := flag.Int("proposer-aliases", 100, "proposer aliases to register in flow.json")
	skipDeploy := flag.Bool("skip-deploy", false, "skip contract deploy and proposer keys")
	skipCreate := flag.Bool("skip-create", false, "skip account creation (deploy only)")
	flag.Parse()

	repoRoot, err := os.Getwd()
	if err != nil {
		color.Red("cwd: %v", err)
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	if !*skipCreate {
		if err := createAndRegisterAccount(ctx, repoRoot, *network, *payerSigner, *fundAmount, *keyFile, *proposerAliases); err != nil {
			color.Red("%v", err)
			os.Exit(1)
		}
	}

	if *skipDeploy {
		return
	}

	color.Cyan("Deploying Alexandria contract to Alexandria-II (temporary flow.json deployment override)...")
	if err := deployAlexandriaOnly(repoRoot, *network); err != nil {
		color.Red("deploy failed: %v", err)
		os.Exit(1)
	}

	keysToAdd := *proposerAliases - 1
	if keysToAdd > 0 {
		color.Cyan("Adding %d proposer keys to Alexandria-II...", keysToAdd)
		addKeys := exec.Command("go", "run", "./tasks/account/add_proposer_keys",
			"-network", *network, "-signer", "Alexandria-II", "-num-keys", fmt.Sprintf("%d", keysToAdd))
		addKeys.Dir = repoRoot
		addKeys.Stdout = os.Stdout
		addKeys.Stderr = os.Stderr
		if err := addKeys.Run(); err != nil {
			color.Red("add proposer keys failed: %v", err)
			os.Exit(1)
		}
	}

	color.Green("Alexandria-II ready. Set UPLOAD_SIGNER=Alexandria-II for uploads.")
}

func deployAlexandriaOnly(repoRoot, network string) error {
	patch := exec.Command("python3", "-c", `
import json, sys
path = "flow.json"
with open(path, encoding="utf-8") as f:
    cfg = json.load(f)
backup = cfg["deployments"][sys.argv[1]].copy()
cfg["deployments"][sys.argv[1]] = {"mainnet-Alexandria-II": ["Alexandria"]}
with open(path, "w", encoding="utf-8") as f:
    json.dump(cfg, f, indent="\t")
    f.write("\n")
with open(".flow.deployments.backup.json", "w", encoding="utf-8") as f:
    json.dump({sys.argv[1]: backup}, f)
`, network)
	patch.Dir = repoRoot
	if out, err := patch.CombinedOutput(); err != nil {
		return fmt.Errorf("patch deployments: %w: %s", err, out)
	}

	deploy := exec.Command("flow", "--config-path", "flow.json", "project", "deploy",
		"--network", network, "--update", "-y")
	deploy.Dir = repoRoot
	deploy.Stdout = os.Stdout
	deploy.Stderr = os.Stderr
	deployErr := deploy.Run()

	restore := exec.Command("python3", "-c", `
import json, sys
path = "flow.json"
with open(path, encoding="utf-8") as f:
    cfg = json.load(f)
with open(".flow.deployments.backup.json", encoding="utf-8") as f:
    backup = json.load(f)
cfg["deployments"][sys.argv[1]] = backup[sys.argv[1]]
with open(path, "w", encoding="utf-8") as f:
    json.dump(cfg, f, indent="\t")
    f.write("\n")
`, network)
	restore.Dir = repoRoot
	if out, err := restore.CombinedOutput(); err != nil {
		return fmt.Errorf("restore deployments: %w: %s", err, out)
	}
	return deployErr
}

func createAndRegisterAccount(ctx context.Context, repoRoot, network, payerSigner, fundAmount, keyFile string, proposerAliases int) error {
	payerSender, err := sdksender.NewSender(repoRoot, network, payerSigner, nil)
	if err != nil {
		return err
	}
	defer payerSender.Close()

	seed := make([]byte, crypto.MinSeedLength)
	if _, err := rand.Read(seed); err != nil {
		return err
	}
	privateKey, err := crypto.GeneratePrivateKey(crypto.ECDSA_P256, seed)
	if err != nil {
		return err
	}
	publicKey := privateKey.PublicKey()
	accountKey := flow.NewAccountKey().
		SetPublicKey(publicKey).
		SetSigAlgo(crypto.ECDSA_P256).
		SetHashAlgo(crypto.SHA3_256).
		SetWeight(flow.AccountKeyWeightThreshold)

	payerAddr := payerSender.PayerAddress()
	color.Cyan("Creating Alexandria-II account on %s (payer %s @ %s, fund %s FLOW)...",
		network, payerSigner, payerAddr.Hex(), fundAmount)

	tx, err := templates.CreateAccountAndFund(
		[]*flow.AccountKey{accountKey},
		nil,
		payerAddr,
		fundAmount,
		flow.Mainnet,
	)
	if err != nil {
		return err
	}

	res := payerSender.SendPreparedTransaction(ctx, tx)
	if res.Err != nil {
		return fmt.Errorf("create account failed: %w", res.Err)
	}
	color.Green("Create-account tx sealed: %s", res.TxID)

	newAddr, err := payerSender.GetAccountCreatedAddress(ctx, res.TxID)
	if err != nil {
		return err
	}
	color.Green("New account address: %s", newAddr.Hex())

	keyPath := filepath.Join(repoRoot, keyFile)
	if err := os.WriteFile(keyPath, []byte(hex.EncodeToString(privateKey.Encode())), 0600); err != nil {
		return err
	}
	color.Green("Wrote private key to %s", keyPath)

	setup := exec.Command("python3", "tasks/gutenberg/scripts/setup_alexandria_ii.py",
		newAddr.Hex(), keyFile, fmt.Sprintf("%d", proposerAliases))
	setup.Dir = repoRoot
	setup.Stdout = os.Stdout
	setup.Stderr = os.Stderr
	return setup.Run()
}
