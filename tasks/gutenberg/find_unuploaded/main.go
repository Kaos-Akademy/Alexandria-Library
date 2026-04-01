package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	. "github.com/bjartek/overflow/v2"
	"github.com/fatih/color"

	"alexandria/overflow/tasks/gutenberg"
)

func main() {
	fs := flag.NewFlagSet("find-unuploaded", flag.ExitOnError)
	manifestPath := fs.String("manifest", "tasks/gutenberg/manifests/philosophy_next25_part2_batch3.json", "manifest json path")
	cacheDir := fs.String("cache", "books/pg-cache", "cache root")
	network := fs.String("network", "mainnet", "Flow network")
	limit := fs.Int("limit", 10, "max missing books to print")
	fs.Parse(os.Args[1:])

	m, err := gutenberg.LoadManifest(*manifestPath)
	if err != nil {
		color.Red("manifest: %v", err)
		os.Exit(1)
	}

	o := Overflow(
		WithGlobalPrintOptions(),
		WithNetwork(*network),
	)

	printed := 0
	for _, e := range m.Entries {
		if !gutenberg.ShouldUploadManifestEntry(e) {
			continue
		}
		e.EnsureSectionPrefix()
		titleArg := gutenberg.EscapeForCadence(e.Title)
		bookRes := o.Script("get_book", WithArg("bookTitle", titleArg))
		if bookRes != nil && bookRes.Err == nil {
			continue
		}
		cachePath := filepath.Join(*cacheDir, fmt.Sprintf("%d", e.GutenbergID))
		_, statErr := os.Stat(cachePath)
		if statErr != nil {
			continue
		}
		fmt.Printf("%d | %d | %s\n", printed+1, e.GutenbergID, strings.ReplaceAll(e.Title, "\n", " "))
		printed++
		if printed >= *limit {
			break
		}
	}

	if printed == 0 {
		color.Yellow("No missing books found in manifest %s", *manifestPath)
		return
	}
	color.Green("Found %d not-uploaded books (limit=%d)", printed, *limit)
}
