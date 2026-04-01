package main

import (
	"fmt"
	"sync"
	"time"

	. "github.com/bjartek/overflow/v2"
	"github.com/fatih/color"
)

func uploadImagesConcurrent(
	o *OverflowState,
	files []imageFileWithPage,
	bookTitle string,
	chapterTitle string,
	signer string,
	proposers []string,
) error {
	start := time.Now()
	jobs := make(chan imageFileWithPage, len(files))
	errCh := make(chan error, len(files))
	var wg sync.WaitGroup

	for _, proposer := range proposers {
		alias := proposer
		wg.Add(1)
		go func() {
			defer wg.Done()
			workerOverflow := Overflow(WithNetwork(o.GetNetwork()))
			for fileInfo := range jobs {
				color.Cyan("Processing %s on proposer %s", fileInfo.filename, alias)
				imageBase64, err := EncodeImageToBase64(fileInfo.path)
				if err != nil {
					errCh <- fmt.Errorf("encode %s: %w", fileInfo.filename, err)
					return
				}

				result := workerOverflow.Tx("Librerian/add_paragraph_to_chapter",
					WithSigner(signer),
					WithProposer(alias),
					WithArg("bookTitle", bookTitle),
					WithArg("chapterTitle", chapterTitle),
					WithArg("paragraph", imageBase64),
				)
				if result.Err != nil {
					errCh <- fmt.Errorf("upload %s (proposer %s): %w", fileInfo.filename, alias, result.Err)
					return
				}
			}
		}()
	}

	for _, f := range files {
		jobs <- f
	}
	close(jobs)
	wg.Wait()
	close(errCh)

	if err := <-errCh; err != nil {
		return err
	}

	elapsed := time.Since(start).Round(time.Millisecond)
	tps := float64(len(files)) / time.Since(start).Seconds()
	color.Green("Concurrent image upload finished in %s (%.2f tx/sec)", elapsed, tps)
	return nil
}
