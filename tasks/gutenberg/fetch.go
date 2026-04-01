package gutenberg

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

var gutenbergURLs = func(id int) []string {
	s := fmt.Sprintf("%d", id)
	return []string{
		fmt.Sprintf("https://www.gutenberg.org/files/%s/%s-0.txt", s, s),
		fmt.Sprintf("https://www.gutenberg.org/cache/epub/%s/pg%s.txt", s, s),
		fmt.Sprintf("https://www.gutenberg.org/files/%s/%s.txt", s, s),
	}
}

// DownloadGutenbergPlainText tries common mirror paths and writes the first successful body to destPath.
func DownloadGutenbergPlainText(id int, destPath string) error {
	if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
		return err
	}
	client := &http.Client{Timeout: 120 * time.Second}
	var lastErr error
	for _, u := range gutenbergURLs(id) {
		resp, err := client.Get(u)
		if err != nil {
			lastErr = err
			continue
		}
		if resp.StatusCode != http.StatusOK {
			resp.Body.Close()
			lastErr = fmt.Errorf("%s: %s", u, resp.Status)
			continue
		}
		f, err := os.Create(destPath)
		if err != nil {
			resp.Body.Close()
			return err
		}
		_, copyErr := io.Copy(f, resp.Body)
		closeErr := f.Close()
		resp.Body.Close()
		if copyErr != nil {
			return copyErr
		}
		if closeErr != nil {
			return closeErr
		}
		return nil
	}
	if lastErr != nil {
		return fmt.Errorf("PG %d: tried all URLs: %w", id, lastErr)
	}
	return fmt.Errorf("PG %d: no download URLs", id)
}
