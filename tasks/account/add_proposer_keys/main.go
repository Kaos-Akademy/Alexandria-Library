package main

import (
	"flag"
	"os"

	. "github.com/bjartek/overflow/v2"
	"github.com/fatih/color"
)

func main() {
	fs := flag.NewFlagSet("add-proposer-keys", flag.ExitOnError)
	network := fs.String("network", "mainnet", "Flow network")
	signer := fs.String("signer", "Prime-librarian", "Overflow signer account name")
	numKeys := fs.Int("num-keys", 9, "number of additional proposer keys to add")
	fs.Parse(os.Args[1:])

	if *numKeys <= 0 {
		color.Red("num-keys must be > 0")
		os.Exit(1)
	}

	o := Overflow(
		WithGlobalPrintOptions(),
		WithNetwork(*network),
	)

	color.Cyan("Adding %d proposer keys on %s as %s", *numKeys, *network, *signer)
	res := o.Tx("account/add_proposer_keys",
		WithSigner(*signer),
		WithArg("numKeys", *numKeys),
	)
	res.Print()
	if res.Err != nil {
		color.Red("Failed: %v", res.Err)
		os.Exit(1)
	}
	color.Green("Success: added %d proposer keys", *numKeys)
}
