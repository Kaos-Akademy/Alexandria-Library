package gutenberg

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestCollectMarksSkipsIndentedTocChapterLines(t *testing.T) {
	lines := []string{
		"              CONTENTS",
		"   CHAPTER   I",
		"   CHAPTER  II",
		"   CHAPTER III",
		"",
		"PREFACE",
		"Some text.",
		"",
		"CHAPTER I",
		"Body starts.",
	}
	marks := collectMarks(lines, 0, "")
	if len(marks) != 1 || marks[0] != 8 {
		t.Fatalf("expected single mark at body CHAPTER I (index 8), got %v", marks)
	}
}

func TestInferSectionTitleFromHeading(t *testing.T) {
	tmp := filepath.Join(t.TempDir(), "sec.txt")
	content := "\n\nPart III\n\nQuery 1.\n"
	if err := os.WriteFile(tmp, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
	got := inferSectionTitle(tmp, "Chapter 3")
	if got != "Part III" {
		t.Fatalf("expected inferred title Part III, got %q", got)
	}
}

func TestCollectMarksStandaloneRomanAfterContentsNumericAnchor(t *testing.T) {
	lines := []string{
		"Preamble",
		"CONTENTS OF VOLUME I",
		"",
		"II.",
		"TOC blurb",
		"III.",
		"More TOC",
		"",
		"Intro",
		"1.",
		"First numbered paragraph",
		"IV.",
		"Major part body",
		"V.",
		"Next part",
	}
	marks := collectMarks(lines, 0, "")
	if len(marks) != 2 || marks[0] != 11 || marks[1] != 13 {
		t.Fatalf("expected marks at IV. and V. only (indices 11,13), got %v", marks)
	}
}

func TestCollectMarksFlushLeftChapterPeriodSameLineIsMark(t *testing.T) {
	lines := []string{
		"CONTENTS",
		"   CHAPTER I  TOC LINE",
		"PREFACE",
		"CHAPTER I. FIRST REAL CHAPTER TITLE ON SAME LINE",
		"Paragraph.",
		"CHAPTER II. SECOND CHAPTER TITLE",
		"More.",
	}
	marks := collectMarks(lines, 0, "")
	if len(marks) != 2 || marks[0] != 3 || marks[1] != 5 {
		t.Fatalf("expected marks at body CHAPTER I and II (indices 3,5), got %v", marks)
	}
}

func TestCollectMarksSkipsNoPeriodTocOutlineFlushLeft(t *testing.T) {
	lines := []string{
		"CONTENTS",
		"CHAPTER XVIII MATERIAL PROGRESS: TOC OUTLINE",
		"INTRODUCTION",
		"CHAPTER I. REAL BODY CHAPTER",
		"Text.",
	}
	marks := collectMarks(lines, 0, "")
	if len(marks) != 1 || marks[0] != 3 {
		t.Fatalf("expected single mark at CHAPTER I. body line, got %v", marks)
	}
}

func TestCollectMarksBareRomanHeadingWithTitleAfterContents(t *testing.T) {
	lines := []string{
		"CONTENTS",
		"CHAPTER I",
		"CHAPTER II",
		"",
		"I",
		"THE DOUBLE ASPECT OF GOODNESS",
		"para",
		"",
		"II",
		"MISCONCEPTIONS OF GOODNESS",
	}
	marks := collectMarks(lines, 0, "")
	if len(marks) < 2 || marks[0] != 4 || marks[1] != 8 {
		t.Fatalf("expected bare Roman marks at 4 and 8, got %v", marks)
	}
}

func TestCollectMarksBookChapterPipeMarkers(t *testing.T) {
	lines := []string{
		"TABLE OF CONTENTS",
		" CHAPTER I. TOC",
		"BOOK_1|CHAPTER_1",
		" CHAPTER I. Body title",
		"body",
		"BOOK_1|CHAPTER_2",
		" CHAPTER II. Body title",
	}
	marks := collectMarks(lines, 0, "")
	if len(marks) != 2 || marks[0] != 2 || marks[1] != 5 {
		t.Fatalf("expected marker-line marks at 2 and 5, got %v", marks)
	}
}

func TestCollectMarksSkipsIndentedTocBookLines(t *testing.T) {
	lines := []string{
		"Contents",
		" BOOK I",
		" BOOK II",
		" BOOK VII",
		"",
		"BOOK I",
		"Real text begins here and continues.",
	}
	marks := collectMarks(lines, 0, "")
	if len(marks) != 1 || marks[0] != 5 {
		t.Fatalf("expected single mark at body BOOK I (line index 5), got %v", marks)
	}
}

func TestSectionRangesSplitsWhenOnlyTwoPartMarks(t *testing.T) {
	lines := []string{
		"front", "PART I.", "a", "b", "PART II.", "c", "d",
	}
	r := SectionRanges(lines, 0, "")
	if len(r) != 2 {
		t.Fatalf("expected two ranges split at PART II, got %#v", r)
	}
	if r[0][0] != 0 || r[0][1] != 3 || r[1][0] != 4 || r[1][1] != 6 {
		t.Fatalf("unexpected ranges: %#v", r)
	}
}

func TestMergeShortStructuralChainsBookPartThenChapter(t *testing.T) {
	lines := []string{
		"lead",
		"BOOK I.",
		"",
		"THE ELIZABETHAN ART OF DELIVERY AND TRADITION.",
		"",
		"PART I.",
		"MICHAEL DE MONTAIGNE.",
		"poetry line",
		"CHAPTER I.",
		"ASCENT FROM PARTICULARS",
		"long body paragraph one",
		"long body paragraph two",
	}
	// Three splits: BOOK-only stub, PART-header stub, CHAPTER+body (matches SectionRanges)
	ranges := [][]int{{1, 4}, {5, 7}, {8, 11}}
	merged := mergeShortStructuralSections(ranges, lines)
	if len(merged) != 1 {
		t.Fatalf("expected 1 range after chained merge, got %d: %#v", len(merged), merged)
	}
	if merged[0][0] != 1 || merged[0][1] != 11 {
		t.Fatalf("unexpected span: %#v", merged[0])
	}
}

func TestMergeRangesUntilMinLines(t *testing.T) {
	ranges := [][]int{{0, 200}, {201, 206}, {207, 500}}
	out, n := mergeRangesUntilMinLines(ranges, 100)
	if n != 1 {
		t.Fatalf("expected 1 merge, got %d", n)
	}
	if len(out) != 2 {
		t.Fatalf("expected 2 ranges, got %d", len(out))
	}
	if spanLineCount(out[0]) != 201 || spanLineCount(out[1]) < 100 {
		t.Fatalf("unexpected spans: %#v", out)
	}
}

func TestSectionLengthsNeedReview(t *testing.T) {
	ranges := [][]int{{0, 49}, {50, 199}}
	warns, nr := SectionLengthsNeedReview(ranges)
	if !nr || len(warns) != 1 {
		t.Fatalf("expected one short section flagged, got nr=%v warns=%v", nr, warns)
	}
	rangesOK := [][]int{{0, 99}, {100, 250}}
	_, nr2 := SectionLengthsNeedReview(rangesOK)
	if nr2 {
		t.Fatal("expected pass when all sections >= 100 lines")
	}
}

func TestMergeShortStructuralSkipsLongBookBlock(t *testing.T) {
	var lines []string
	lines = append(lines, "BOOK I.")
	for i := 0; i < 40; i++ {
		lines = append(lines, "line of real content")
	}
	ranges := [][]int{{0, 40}, {41, 41}}
	merged := mergeShortStructuralSections(ranges, lines)
	if len(merged) != 2 {
		t.Fatalf("expected no merge for long BOOK section, got %d ranges", len(merged))
	}
}

func TestCollectMarksSkipsFlushLeftTocBetweenContentsAndIndex(t *testing.T) {
	lines := []string{
		"HEADER",
		"",
		"CONTENTS",
		"",
		"PART I",
		"TOC",
		"CHAPTER I",
		"TOC",
		"INDEX",
		"",
		"TITLE",
		"",
		"PART I",
		"SECTION",
		"CHAPTER I",
		"Body line.",
	}
	marks := collectMarks(lines, 0, "")
	if len(marks) < 2 {
		t.Fatalf("expected body PART + CHAPTER marks, got %v", marks)
	}
	if marks[0] != 12 {
		t.Fatalf("expected first mark at body PART I (index 12), got %v", marks)
	}
}

func TestCollectMarksSecondPartIWhenNoIndex(t *testing.T) {
	lines := []string{
		"CONTENTS",
		"PART I",
		"fake",
		"",
		"PREFACE",
		"PART I",
		"REAL",
	}
	marks := collectMarks(lines, 0, "")
	if len(marks) != 1 || marks[0] != 5 {
		t.Fatalf("expected single mark at second PART I (index 5), got %v", marks)
	}
}

func TestTruncatePublisherCatalogAfterTheEnd(t *testing.T) {
	lines := []string{
		"body",
		"THE END",
		"",
		"VALUABLE WORKS",
		"",
		"TABLE OF CONTENTS.",
		"PART I.",
		"junk",
	}
	out := truncatePublisherCatalogAfterTheEnd(lines)
	if len(out) != 2 || out[1] != "THE END" {
		t.Fatalf("expected truncate to THE END line, got len=%d %#v", len(out), out)
	}
}

func TestTruncatePublisherCatalogNoSecondToc(t *testing.T) {
	lines := []string{"a", "THE END", "epilogue continues"}
	out := truncatePublisherCatalogAfterTheEnd(lines)
	if len(out) != 3 {
		t.Fatalf("expected no truncation, got %d lines", len(out))
	}
}

func TestPG9304FirstMarkAfterTocIndex(t *testing.T) {
	wd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	try := []string{
		filepath.Join(wd, "books", "pg-cache", "9304", "pg9304-source.txt"),
		filepath.Join(wd, "..", "..", "books", "pg-cache", "9304", "pg9304-source.txt"),
	}
	var raw []byte
	var readErr error
	for _, p := range try {
		raw, readErr = os.ReadFile(p)
		if readErr == nil {
			break
		}
	}
	if readErr != nil {
		t.Skip("9304 cache not present:", readErr)
	}
	lines := strings.Split(strings.ReplaceAll(string(raw), "\r\n", "\n"), "\n")
	lines = StripGutenbergWrapper(lines)
	marks := collectMarks(lines, 0, "")
	if len(marks) == 0 {
		t.Fatal("expected marks")
	}
	// Real body PART I is the repeated block after INDEX (not TOC PART I).
	if marks[0] < 250 {
		t.Fatalf("first mark should be after TOC block (>= ~296 0-based); got index %d", marks[0])
	}
}

func TestPG8646TruncatesPublisherCatalog(t *testing.T) {
	wd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	try := []string{
		filepath.Join(wd, "books", "pg-cache", "8646", "pg8646-source.txt"),
		filepath.Join(wd, "..", "..", "books", "pg-cache", "8646", "pg8646-source.txt"),
	}
	var raw []byte
	var readErr error
	for _, p := range try {
		raw, readErr = os.ReadFile(p)
		if readErr == nil {
			break
		}
	}
	if readErr != nil {
		t.Skip("8646 cache not present:", readErr)
	}
	lines := strings.Split(strings.ReplaceAll(string(raw), "\r\n", "\n"), "\n")
	lines = StripGutenbergWrapper(lines)
	lines = truncatePublisherCatalogAfterTheEnd(lines)
	if len(lines) < 5000 {
		t.Fatalf("expected most of Ferguson text retained, got %d lines", len(lines))
	}
	last := strings.TrimSpace(lines[len(lines)-1])
	if !strings.EqualFold(last, "THE END") {
		t.Fatalf("expected last line THE END after dropping publisher catalog, got %q", last)
	}
}

func TestPG6585LucianVol2NamedWorkSections(t *testing.T) {
	wd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	try := []string{
		filepath.Join(wd, "books", "pg-cache", "6585", "pg6585-source.txt"),
		filepath.Join(wd, "..", "..", "books", "pg-cache", "6585", "pg6585-source.txt"),
	}
	var raw []byte
	var readErr error
	for _, p := range try {
		raw, readErr = os.ReadFile(p)
		if readErr == nil {
			break
		}
	}
	if readErr != nil {
		t.Skip("6585 cache not present:", readErr)
	}
	lines := strings.Split(strings.ReplaceAll(string(raw), "\r\n", "\n"), "\n")
	lines = StripGutenbergWrapper(lines)
	lines = truncatePublisherCatalogAfterTheEnd(lines)
	marks := collectMarks(lines, 0, "PG6585")
	// Vol. II has 17 named works (ALL CAPS titles in CONTENTS OF VOL. II); duplicate-first-title TOC skip + PG6585 marks.
	if len(marks) != 17 {
		for _, mi := range marks {
			t.Logf("mark %d: %s", mi, strings.TrimSpace(lines[mi]))
		}
		t.Fatalf("expected exactly 17 work-title marks; got %d", len(marks))
	}
}

func TestContentsBodyStartDuplicateFirstTitle(t *testing.T) {
	lines := []string{
		"*** START ***",
		"CONTENTS OF VOL. II",
		"",
		"FIRST ESSAY TITLE HERE",
		"SECOND IN TOC",
		"",
		"",
		"FIRST ESSAY TITLE HERE",
		"Body starts.",
	}
	got := contentsBodyStartByDuplicateFirstTitle(lines, 1)
	if got != 7 {
		t.Fatalf("bodyStart: want line index 7, got %d", got)
	}
}
