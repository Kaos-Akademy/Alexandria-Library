package gutenberg

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// Manifest is the top-level philosophy (or other) queue file.
type Manifest struct {
	Version int             `json:"version"`
	Entries []ManifestEntry `json:"entries"`
}

// ManifestEntry is one Gutenberg book row.
type ManifestEntry struct {
	GutenbergID       int     `json:"gutenberg_id"`
	Title             string  `json:"title"`
	Author            string  `json:"author"`
	Genre             string  `json:"genre"`
	Edition           string  `json:"edition,omitempty"`
	Summary           string  `json:"summary,omitempty"`
	Language          string  `json:"language,omitempty"`
	Subjects          string  `json:"subjects,omitempty"`
	Source            string  `json:"source,omitempty"`
	// Status controls pipeline and bulk upload (see ShouldUploadManifestEntry).
	// Common values: "split" (ready), "needs_review" (manual QA), "deferred_repair"
	// (known bad cache/on-chain; fix + re-split + upload -repair later), "pending" or empty (not queued).
	Status            string  `json:"status,omitempty"`
	SplitProfile      string  `json:"split_profile,omitempty"`
	SplitConfidence   float64 `json:"split_confidence,omitempty"`
	Error             string  `json:"error,omitempty"`
	ResumeFromSection int     `json:"resume_from_section,omitempty"`
	SectionPrefix     string  `json:"section_prefix,omitempty"`
}

// LoadManifest reads and parses a manifest JSON file.
func LoadManifest(path string) (*Manifest, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var m Manifest
	if err := json.Unmarshal(b, &m); err != nil {
		return nil, err
	}
	return &m, nil
}

// EnsureSectionPrefix sets SectionPrefix to PG{n} when empty.
func (e *ManifestEntry) EnsureSectionPrefix() {
	if e.SectionPrefix == "" {
		e.SectionPrefix = fmt.Sprintf("PG%d", e.GutenbergID)
	}
}

// BooksDir returns the per-book cache directory under cacheRoot (e.g. books/pg-cache/59).
func (e ManifestEntry) BooksDir(cacheRoot string) string {
	return filepath.Join(cacheRoot, fmt.Sprintf("%d", e.GutenbergID))
}

// SectionFileRegex matches section files for this entry, e.g. ^PG59_Section_(\d+)\.txt$
func (e ManifestEntry) SectionFileRegex() string {
	prefix := e.SectionPrefix
	if prefix == "" {
		prefix = fmt.Sprintf("PG%d", e.GutenbergID)
	}
	return fmt.Sprintf(`^%s_Section_(\d+)\.txt$`, regexp.QuoteMeta(prefix))
}

// ShouldUploadManifestEntry is true when the entry is ready for on-chain upload.
// Entries marked needs_review, deferred_repair, pending, or anything other than split are skipped.
func ShouldUploadManifestEntry(e ManifestEntry) bool {
	return strings.EqualFold(strings.TrimSpace(e.Status), "split")
}

// IsDeferredRepair is true when the entry was marked to skip bulk processing until a manual re-split/repair.
func IsDeferredRepair(e ManifestEntry) bool {
	return strings.EqualFold(strings.TrimSpace(e.Status), "deferred_repair")
}

// SaveManifest writes manifest JSON with atomic replace.
func SaveManifest(path string, m *Manifest) error {
	b, err := json.MarshalIndent(m, "", "  ")
	if err != nil {
		return err
	}
	b = append(b, '\n')
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, b, 0644); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}
