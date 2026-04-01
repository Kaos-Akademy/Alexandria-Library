package gutenberg

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode"
)

// NeedsReviewSplitConf: heuristic confidence below this marks the entry needs_review.
const NeedsReviewSplitConf = 0.55

// MinSectionLineCount: each section file must have at least this many lines (including blanks).
// Section 1 counts PG boilerplate before *** START ***, license block, TOC, and body through the
// first split — so "first chapter" is never valid if it is shorter than this.
const MinSectionLineCount = 100

// SplitHeuristicResult holds split output and a rough confidence score (0–1).
type SplitHeuristicResult struct {
	SectionPaths []string
	Confidence   float64
	Warnings     []string
	// NeedsReview is true when any section has fewer than MinSectionLineCount lines.
	NeedsReview bool
}

var (
	// Roman chapters must use all-caps CHAPTER so we do not match "Chapter XXIV. of …" in prose.
	chapterHeadingRomanCaps = regexp.MustCompile(`^\s*CHAPTER\s+[IVXLCDM]+`)
	// Title-case "Chapter" with Roman numerals (e.g. Dhammapada: "Chapter I. The Twin-Verses").
	chapterHeadingRomanTitleCase = regexp.MustCompile(`^\s*Chapter\s+[IVXLCDM]+`)
	// Arabic chapter numbers only as a whole line ("Chapter 12" / "CHAPTER 3."). Do not match
	// Contents outlines like "Chapter 1: The Twin Verses" or "Chapter 26 The Brahmana".
	chapterArabicStandalone     = regexp.MustCompile(`(?i)^\s*Chapter\s+[0-9]+\s*\.?\s*$`)
	chapterArabicCapsStandalone = regexp.MustCompile(`^\s*CHAPTER\s+[0-9]+\s*\.?\s*$`)
	bookHeading = regexp.MustCompile(`(?i)^\s*BOOK\s+[IVXLCDM]+\.?\s*$`)
	// Body may use "PART II.--INTRODUCTION." (subtitle on same line); strict EOL-only patterns miss it
	// and leave a single PART mark → one section for the whole file (e.g. Coleridge PG 8956).
	partHeading = regexp.MustCompile(`(?i)^\s*(PART|Part)\s+[IVXLCDM]+(?:\.|$|--)`)
	// Literary remains / edited volumes: "NOTES ON HOOKER." at column 0 (TOC may indent "Notes on …").
	notesOnHeading = regexp.MustCompile(`(?i)^NOTES ON\s+.{8,}`)
	letterHeading  = regexp.MustCompile(`(?i)^\s*(Letter|LETTER)\s+[IVXLCDM0-9]+`)
	// TOC outline lines like "CHAPTER I. INTRODUCTORY." or "CHAPTER II. OF THE POSSIBLE..."
	// put the chapter title on the same line; body text usually has "CHAPTER I." alone, title next line.
	chapterRomanSameLineTitle = regexp.MustCompile(`^\s*CHAPTER\s+[IVXLCDM]+\.\s+\S`)
	// Outline without a period after the numeral (e.g. PG 4557 TOC: "CHAPTER XVIII MATERIAL ...");
	// body chapters in that edition use "CHAPTER XVIII. MATERIAL ...".
	chapterRomanNoPeriodSameLine = regexp.MustCompile(`^\s*CHAPTER\s+[IVXLCDM]+\s+[A-Z]`)
	// Second column-0 "PART I" after CONTENTS (TOC often repeats PART I before the real body; PG 9304).
	partISingleLine = regexp.MustCompile(`(?i)^PART\s+I\.?\s*$`)
	// Literary close before publisher catalog (PG 8646: ads + foreign book TOC after THE END).
	standaloneTheEndLine = regexp.MustCompile(`(?i)^THE END\.?\s*$`)
	// Leonardo notebooks (PG 4998): major parts as "II." "III." on their own line after a Contents block.
	standaloneRomanOnlyLine = regexp.MustCompile(`^[IVXLCDM]+\.\s*$`)
	// Bare Roman section marker (e.g. PG 6101 body: "I" then all-caps title line).
	standaloneRomanBareLine = regexp.MustCompile(`^[IVXLCDM]+$`)
	// First "1." / "2." paragraph line after Contents — anchors body so TOC roman lines are not marks.
	standaloneNumericOnlyLine = regexp.MustCompile(`^\d+\.\s*$`)
	// Gutenberg normalized structural marker (e.g. PG 5683): BOOK_1|CHAPTER_2
	bookChapterPipeMarker = regexp.MustCompile(`^BOOK_[0-9]+\|CHAPTER_[0-9]+$`)
	underscoredHeadingLine = regexp.MustCompile(`^_[^_]{6,}_$`)
)

const tocIndexSearchMaxLines = 4000

// isTocStyleChapterLine detects table-of-contents chapter lines that must not start a section.
// Indented same-line titles ("CHAPTER I. Foo") are Contents outlines. Flush-left "CHAPTER I. Foo"
// is normal body markup in many scholarly texts (e.g. PG 4557) and must count as a split mark.
func isTocStyleChapterLine(trimmed, raw string) bool {
	t := strings.TrimSpace(trimmed)
	if !chapterHeadingRomanCaps.MatchString(t) {
		return false
	}
	if strings.HasSuffix(t, "...") {
		return true
	}
	if chapterRomanNoPeriodSameLine.MatchString(t) {
		return true
	}
	if chapterRomanSameLineTitle.MatchString(t) {
		return hasLeadingIndent(raw)
	}
	return false
}

// hasLeadingIndent is true when the line begins with space or tab (not column-0 text).
func hasLeadingIndent(raw string) bool {
	return len(strings.TrimLeft(raw, " \t")) < len(raw)
}

// isTocStyleIndentedHeading is true for Contents-style outlines: "   CHAPTER  II", " BOOK I",
// indented PART lines, etc. TrimSpace makes them indistinguishable from body "CHAPTER II" at
// column 0 (e.g. Pirke Avot PG 8547).
func isTocStyleIndentedHeading(trimmed, raw string) bool {
	if !hasLeadingIndent(raw) {
		return false
	}
	if isTocStyleChapterLine(trimmed, raw) {
		return true
	}
	if bookHeading.MatchString(trimmed) ||
		chapterHeadingRomanCaps.MatchString(trimmed) ||
		chapterHeadingRomanTitleCase.MatchString(trimmed) ||
		chapterArabicStandalone.MatchString(trimmed) ||
		chapterArabicCapsStandalone.MatchString(trimmed) ||
		partHeading.MatchString(trimmed) ||
		letterHeading.MatchString(trimmed) ||
		notesOnHeading.MatchString(trimmed) {
		return true
	}
	return false
}

// isStandaloneRomanSectionMark is true for flush-left lines that are only a Roman numeral and period
// (e.g. PG 4998 body: "II." "IX.") after the first numbered paragraph following a Contents block.
func isStandaloneRomanSectionMark(trimmed, raw string, lineIndex, numericAnchor int) bool {
	if numericAnchor < 0 || lineIndex < numericAnchor {
		return false
	}
	if hasLeadingIndent(raw) {
		return false
	}
	t := strings.TrimSpace(trimmed)
	return standaloneRomanOnlyLine.MatchString(t)
}

func isStandaloneRomanBareHeadingWithTitle(lines []string, i int) bool {
	if i < 0 || i >= len(lines) {
		return false
	}
	raw := lines[i]
	if hasLeadingIndent(raw) {
		return false
	}
	t := strings.TrimSpace(raw)
	if !standaloneRomanBareLine.MatchString(t) {
		return false
	}
	if findContentsLineIndex(lines) < 0 {
		return false
	}
	for j := i + 1; j < len(lines); j++ {
		n := strings.TrimSpace(lines[j])
		if n == "" {
			continue
		}
		if len(n) < 6 {
			return false
		}
		// Require an all-caps title-ish line after the bare numeral.
		if n == strings.ToUpper(n) {
			return true
		}
		return false
	}
	return false
}

func normalizeHeadingKey(line string) string {
	s := strings.TrimSpace(line)
	s = strings.Trim(s, "_")
	s = strings.TrimSpace(s)
	s = strings.ToLower(s)
	s = strings.ReplaceAll(s, "’", "'")
	s = strings.ReplaceAll(s, "‘", "'")
	s = strings.ReplaceAll(s, "“", "\"")
	s = strings.ReplaceAll(s, "”", "\"")
	s = strings.ReplaceAll(s, "  ", " ")
	return s
}

func isUnderscoredSectionHeading(trimmed string) bool {
	if !underscoredHeadingLine.MatchString(strings.TrimSpace(trimmed)) {
		return false
	}
	t := strings.ToLower(strings.Trim(strings.TrimSpace(trimmed), "_"))
	if strings.Contains(t, "footnotes") || strings.Contains(t, "transcriber") {
		return false
	}
	return true
}

func allowUnderscoredSectionMarks(prefix string) bool {
	switch strings.ToUpper(strings.TrimSpace(prefix)) {
	case "PG78119", "PG78218":
		return true
	default:
		return false
	}
}

func isChapterOrBookMark(trimmed, raw string, lineIndex, numericAnchor int, prefix string, lines []string) bool {
	if trimmed == "" {
		return false
	}
	if isTocStyleChapterLine(trimmed, raw) {
		return false
	}
	if isTocStyleIndentedHeading(trimmed, raw) {
		return false
	}
	if chapterHeadingRomanCaps.MatchString(trimmed) ||
		chapterHeadingRomanTitleCase.MatchString(trimmed) ||
		chapterArabicStandalone.MatchString(trimmed) ||
		chapterArabicCapsStandalone.MatchString(trimmed) ||
		partHeading.MatchString(trimmed) ||
		letterHeading.MatchString(trimmed) ||
		notesOnHeading.MatchString(trimmed) ||
		bookChapterPipeMarker.MatchString(trimmed) {
		return true
	}
	if bookHeading.MatchString(trimmed) && !suppressBookRomanMarksForPrefix(prefix) {
		return true
	}
	if isStandaloneRomanSectionMark(trimmed, raw, lineIndex, numericAnchor) {
		return true
	}
	if allowUnderscoredSectionMarks(prefix) && isUnderscoredSectionHeading(trimmed) {
		return true
	}
	if allowAllCapsWorkTitleMarks(prefix) && lines != nil && isAllCapsLucianVolumeWorkTitleLine(lines, lineIndex, trimmed) {
		return true
	}
	return false
}

// suppressBookRomanMarksForPrefix: Lucian Vol. II (PG6585) uses BOOK I/II inside "The True History";
// those are not top-level volume sections.
func suppressBookRomanMarksForPrefix(prefix string) bool {
	return strings.EqualFold(strings.TrimSpace(prefix), "PG6585")
}

// allowAllCapsWorkTitleMarks: PG6585 body uses flush-left ALL CAPS work titles (essay names).
func allowAllCapsWorkTitleMarks(prefix string) bool {
	p := strings.ToUpper(strings.TrimSpace(prefix))
	return p == "PG6585" || p == "PG78000" || p == "PG78134" || p == "PG78147"
}

// isAllCapsStandaloneWorkTitleLine matches a single-line ALL CAPS title (letters only), e.g. Lucian essay headings.
func isAllCapsStandaloneWorkTitleLine(trimmed string) bool {
	s := strings.TrimSpace(trimmed)
	if len(s) < 8 || len(s) > 200 {
		return false
	}
	if standaloneTheEndLine.MatchString(s) {
		return false
	}
	hasLetter := false
	for _, r := range s {
		if unicode.IsLetter(r) {
			hasLetter = true
			if !unicode.IsUpper(r) {
				return false
			}
		}
	}
	if !hasLetter {
		return false
	}
	words := strings.Fields(s)
	if len(words) == 1 && len(s) < 10 {
		return false
	}
	return true
}

// isAllCapsLucianVolumeWorkTitleLine applies PG6585-specific filters: salutation letters, epigraph
// continuations, and subsection headings that are ALL CAPS but not volume work titles.
func isAllCapsLucianVolumeWorkTitleLine(lines []string, lineIndex int, trimmed string) bool {
	if !isAllCapsStandaloneWorkTitleLine(trimmed) {
		return false
	}
	// "DEAR SABINUS," / "MY DEAR PHILO," — letters, not chapter titles.
	if strings.HasSuffix(trimmed, ",") {
		return false
	}
	lt := strings.ToLower(trimmed)
	if strings.HasPrefix(lt, "dear ") || strings.HasPrefix(lt, "my dear ") {
		return false
	}
	if strings.HasSuffix(strings.TrimSpace(trimmed), " TO THE") {
		return false
	}
	if strings.EqualFold(trimmed, "INTRODUCTION") || strings.EqualFold(trimmed, "CONCLUSION") {
		return false
	}
	if lineIndex > 0 {
		prev := strings.TrimSpace(lines[lineIndex-1])
		if strings.HasSuffix(prev, " TO THE") {
			return false
		}
	}
	return true
}

// isContentsHeadingLine matches standalone PG "CONTENTS" / "Contents of Volume …" / short "Table of Contents" lines.
func isContentsHeadingLine(line string) bool {
	t := strings.TrimSpace(line)
	if strings.EqualFold(t, "CONTENTS") {
		return true
	}
	lt := strings.ToLower(t)
	if strings.HasPrefix(lt, "contents ") && len(t) < 90 {
		return true
	}
	return strings.Contains(lt, "table of contents") && len(t) < 60
}

func findContentsLineIndex(lines []string) int {
	for i, line := range lines {
		if isContentsHeadingLine(line) {
			return i
		}
	}
	return -1
}

// findFirstStandaloneNumericParagraphAfterContents returns the first flush-left "1." / "12." only line
// after a Contents heading, or -1 if there is no Contents block. Used to ignore Roman TOC lines and
// accept Roman major-part lines in the notebook body (PG 4998). Values >999 are ignored so years like
// "1803." on their own line (PG 5621) are not mistaken for paragraph numbers.
func findFirstStandaloneNumericParagraphAfterContents(lines []string) int {
	c := findContentsLineIndex(lines)
	if c < 0 {
		return -1
	}
	for i := c + 1; i < len(lines); i++ {
		raw := lines[i]
		if hasLeadingIndent(raw) {
			continue
		}
		t := strings.TrimSpace(raw)
		if !standaloneNumericOnlyLine.MatchString(t) {
			continue
		}
		var n int
		if _, err := fmt.Sscanf(t, "%d.", &n); err != nil || n < 1 || n > 999 {
			continue
		}
		return i
	}
	return -1
}

// findIndexLineAfter finds a standalone "INDEX" line (end of outline) after CONTENTS.
func findIndexLineAfter(lines []string, start, maxEnd int) int {
	if maxEnd > len(lines) {
		maxEnd = len(lines)
	}
	for i := start; i < maxEnd; i++ {
		if strings.EqualFold(strings.TrimSpace(lines[i]), "INDEX") {
			return i
		}
	}
	return -1
}

func firstStructuralMarkIndex(lines []string, start int) int {
	numericAnchor := findFirstStandaloneNumericParagraphAfterContents(lines)
	for i := start; i < len(lines); i++ {
		raw := lines[i]
		t := strings.TrimSpace(raw)
		if t == "" {
			continue
		}
		if isChapterOrBookMark(t, raw, i, numericAnchor, "", lines) {
			return i
		}
	}
	return -1
}

// contentsBodyStartByDuplicateFirstTitle finds the body start when the first line after CONTENTS
// repeats later (TOC lists the same title as the first essay; PG 6585 Lucian Vol. II).
func contentsBodyStartByDuplicateFirstTitle(lines []string, contentsIdx int) int {
	i := contentsIdx + 1
	for i < len(lines) && strings.TrimSpace(lines[i]) == "" {
		i++
	}
	if i >= len(lines) {
		return -1
	}
	first := normalizeHeadingKey(lines[i])
	if len(first) < 8 {
		return -1
	}
	for j := i + 1; j < len(lines); j++ {
		if normalizeHeadingKey(lines[j]) == first {
			return j
		}
	}
	return -1
}

func bodyStartBySecondPlutarchMorals(lines []string) int {
	found := 0
	for i, line := range lines {
		t := strings.ToUpper(strings.TrimSpace(line))
		t = strings.ReplaceAll(t, "’", "'")
		if strings.Contains(t, "PLUTARCH") && strings.Contains(t, "MORALS.") {
			found++
			if found == 2 {
				return i
			}
		}
	}
	return -1
}

// secondColumnZeroPartILine returns the line index of the second flush-left "PART I" after contentsIdx (TOC + body).
func secondColumnZeroPartILine(lines []string, afterContents int) int {
	found := 0
	for i := afterContents; i < len(lines); i++ {
		raw := lines[i]
		if hasLeadingIndent(raw) {
			continue
		}
		t := strings.TrimSpace(raw)
		if !partISingleLine.MatchString(t) {
			continue
		}
		found++
		if found == 2 {
			return i
		}
	}
	return -1
}

func findBareRomanHeadingWithTitleAfter(lines []string, start int) int {
	for i := start; i < len(lines); i++ {
		if isStandaloneRomanBareHeadingWithTitle(lines, i) {
			return i
		}
	}
	return -1
}

// tocBodyStartSkip returns the first line index where chapter/book marks may start: after a CONTENTS
// block, marks inside the outline (flush-left PART/CHAPTER lines) are not real body structure.
// Strategy: (1) CONTENTS + standalone INDEX → first structural mark after INDEX; (2) else second
// column-0 PART I; (3) else 0 (indent rules + merge still apply).
func tocBodyStartSkip(lines []string, prefix string) int {
	switch strings.ToUpper(strings.TrimSpace(prefix)) {
	case "PG78000", "PG78134", "PG78147":
		if j := bodyStartBySecondPlutarchMorals(lines); j >= 0 {
			return j
		}
	}
	contentsIdx := findContentsLineIndex(lines)
	if contentsIdx < 0 {
		return 0
	}
	searchEnd := contentsIdx + 1 + tocIndexSearchMaxLines
	idxLine := findIndexLineAfter(lines, contentsIdx+1, searchEnd)
	if idxLine >= 0 {
		bodyMark := firstStructuralMarkIndex(lines, idxLine+1)
		if bodyMark >= 0 {
			// #region agent log
			debugLogTocSplit("H2", map[string]interface{}{"mode": "after-index", "contentsIdx": contentsIdx, "indexIdx": idxLine, "bodyStart": bodyMark})
			// #endregion
			return bodyMark
		}
	}
	if j := contentsBodyStartByDuplicateFirstTitle(lines, contentsIdx); j >= 0 {
		// #region agent log
		debugLogTocSplit("H7", map[string]interface{}{"mode": "duplicate-first-toc-title", "contentsIdx": contentsIdx, "bodyStart": j})
		// #endregion
		return j
	}
	if j := secondColumnZeroPartILine(lines, contentsIdx+1); j >= 0 {
		// #region agent log
		debugLogTocSplit("H3", map[string]interface{}{"mode": "second-part-i", "contentsIdx": contentsIdx, "bodyStart": j})
		// #endregion
		return j
	}
	if j := findBareRomanHeadingWithTitleAfter(lines, contentsIdx+1); j >= 0 {
		// #region agent log
		debugLogTocSplit("H6", map[string]interface{}{"mode": "roman-bare-heading", "contentsIdx": contentsIdx, "bodyStart": j})
		// #endregion
		return j
	}
	// #region agent log
	debugLogTocSplit("H4", map[string]interface{}{"mode": "fallback", "prefix": prefix, "contentsIdx": contentsIdx, "bodyStart": 0})
	// #endregion
	return 0
}

// #region agent log
func debugLogTocSplit(hypothesisID string, data map[string]interface{}) {
	f, err := os.OpenFile("/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/.cursor/debug-a97b1b.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()
	payload := map[string]interface{}{
		"sessionId":    "a97b1b",
		"hypothesisId": hypothesisID,
		"location":     "split.go:tocBodyStartSkip",
		"message":      "toc body skip",
		"data":         data,
		"timestamp":    time.Now().UnixMilli(),
	}
	b, err := json.Marshal(payload)
	if err != nil {
		return
	}
	f.Write(append(b, '\n'))
}

// #endregion

func collectMarks(lines []string, skipLines int, prefix string) []int {
	if skipLines < 0 {
		skipLines = 0
	}
	bodyStart := tocBodyStartSkip(lines, prefix)
	if bodyStart < skipLines {
		bodyStart = skipLines
	}
	numericAnchor := findFirstStandaloneNumericParagraphAfterContents(lines)
	var marks []int
	for i := skipLines; i < len(lines); i++ {
		if i < bodyStart {
			continue
		}
		raw := lines[i]
		t := strings.TrimSpace(raw)
		if t == "" {
			continue
		}
		if isChapterOrBookMark(t, raw, i, numericAnchor, prefix, lines) || isStandaloneRomanBareHeadingWithTitle(lines, i) {
			marks = append(marks, i)
		}
	}
	return marks
}

// StripGutenbergWrapper keeps the PG header (everything before the START line), drops the START
// line itself, trims after END, and concatenates so Section_1 can include license + title metadata
// with the book body (see SectionRanges).
func StripGutenbergWrapper(lines []string) []string {
	const startNeedle = "*** START OF THE PROJECT GUTENBERG EBOOK"
	const endNeedle = "*** END OF THE PROJECT GUTENBERG EBOOK"
	startIdx := -1
	for i, line := range lines {
		if strings.Contains(strings.ToUpper(strings.TrimSpace(line)), strings.ToUpper(startNeedle)) {
			startIdx = i
			break
		}
	}
	if startIdx < 0 {
		for i, line := range lines {
			if strings.Contains(strings.ToUpper(strings.TrimSpace(line)), strings.ToUpper(endNeedle)) {
				return lines[:i]
			}
		}
		return lines
	}
	pre := lines[:startIdx]
	rest := lines[startIdx+1:]
	endCut := len(rest)
	for i, line := range rest {
		if strings.Contains(strings.ToUpper(strings.TrimSpace(line)), strings.ToUpper(endNeedle)) {
			endCut = i
			break
		}
	}
	rest = rest[:endCut]
	out := make([]string, 0, len(pre)+len(rest))
	out = append(out, pre...)
	out = append(out, rest...)
	return out
}

// SectionRanges returns inclusive [start,end] line indices per section.
// Section 1 always starts at line 0 (after StripGutenbergWrapper): Project Gutenberg boilerplate,
// any front matter, and the first chapter through its last line. Later sections begin at each
// following chapter mark.
// If the first mark is a Part heading (e.g. "Part I" in the title block), section 1 runs through
// the first CHAPTER under that part (marks[2]-1), so "Part I" does not steal the first chapter.
func SectionRanges(lines []string, skipLines int, prefix string) [][]int {
	if len(lines) == 0 {
		return nil
	}
	marks := collectMarks(lines, skipLines, prefix)
	return sectionRangesFromMarks(lines, marks)
}

func sectionRangesFromMarks(lines []string, marks []int) [][]int {
	last := len(lines) - 1
	if len(marks) == 0 {
		return [][]int{{0, last}}
	}
	if len(marks) == 1 {
		return [][]int{{0, last}}
	}
	var ranges [][]int
	firstEnd := marks[1] - 1
	advance := 1
	firstLine := strings.TrimSpace(lines[marks[0]])
	secondLine := strings.TrimSpace(lines[marks[1]])
	if partHeading.MatchString(firstLine) {
		if len(marks) == 2 {
			if partHeading.MatchString(secondLine) {
				// Two top-level PART markers (e.g. PG 6123): split by part boundary.
				firstEnd = marks[1] - 1
				advance = 1
			} else {
				return [][]int{{0, last}}
			}
		} else {
			// PART II immediately after PART I (no CHAPTER line): split by part, not one mega-section.
			// When the second mark is CHAPTER (Dhammapada, On Compromise), first section runs through
			// that first chapter (marks[2]-1).
			if partHeading.MatchString(secondLine) {
				firstEnd = marks[1] - 1
				advance = 1
			} else {
				firstEnd = marks[2] - 1
				advance = 2
			}
		}
	}
	if firstEnd > last {
		firstEnd = last
	}
	ranges = append(ranges, []int{0, firstEnd})
	if firstEnd >= last {
		return ranges
	}
	for j := advance; j < len(marks)-1; j++ {
		ranges = append(ranges, []int{marks[j], marks[j+1] - 1})
	}
	ranges = append(ranges, []int{marks[len(marks)-1], last})
	return ranges
}

// mergeShortStructuralSections folds short BOOK / PART header stacks into the following section.
// Gutenberg often has BOOK I → subtitle → PART I → author line → CHAPTER I; naive marks create
// useless 5–15 line "chapters". We merge forward while the span is still a small heading block
// starting with BOOK or PART, then one merge pulls in the real CHAPTER body.
func mergeShortStructuralSections(ranges [][]int, lines []string) [][]int {
	if len(ranges) < 2 {
		return ranges
	}
	out := append([][]int(nil), ranges...)
	for {
		merged := false
		for k := 0; k < len(out)-1; k++ {
			if !isShortStructuralStub(out[k], lines) {
				continue
			}
			out[k] = []int{out[k][0], out[k+1][1]}
			out = append(out[:k+1], out[k+2:]...)
			merged = true
			break
		}
		if !merged {
			break
		}
	}
	return out
}

// rangeContainsChapterHeading is true if this span includes a real CHAPTER line (not BOOK/PART).
// Once a CHAPTER heading is inside the span, the block is no longer a "stub" to merge forward.
func rangeContainsChapterHeading(lines []string, start, end int) bool {
	for ln := start; ln <= end && ln < len(lines); ln++ {
		t := strings.TrimSpace(lines[ln])
		if t == "" {
			continue
		}
		if isTocStyleChapterLine(t, lines[ln]) {
			continue
		}
		if chapterHeadingRomanCaps.MatchString(t) ||
			chapterHeadingRomanTitleCase.MatchString(t) ||
			chapterArabicStandalone.MatchString(t) ||
			chapterArabicCapsStandalone.MatchString(t) {
			return true
		}
	}
	return false
}

func isShortStructuralStub(r []int, lines []string) bool {
	const maxStubLines = 36
	const maxStubNonEmpty = 20
	if len(r) < 2 || r[1] < r[0] || r[0] < 0 {
		return false
	}
	if rangeContainsChapterHeading(lines, r[0], r[1]) {
		return false
	}
	nLines := r[1] - r[0] + 1
	if nLines > maxStubLines {
		return false
	}
	first := ""
	for ln := r[0]; ln <= r[1] && ln < len(lines); ln++ {
		t := strings.TrimSpace(lines[ln])
		if t != "" {
			first = t
			break
		}
	}
	if first == "" {
		return false
	}
	if !bookHeading.MatchString(first) && !partHeading.MatchString(first) {
		return false
	}
	nonEmpty := 0
	for ln := r[0]; ln <= r[1] && ln < len(lines); ln++ {
		if strings.TrimSpace(lines[ln]) != "" {
			nonEmpty++
		}
	}
	return nonEmpty <= maxStubNonEmpty
}

func spanLineCount(span []int) int {
	if len(span) < 2 || span[1] < span[0] {
		return 0
	}
	return span[1] - span[0] + 1
}

// mergeRangesUntilMinLines repeatedly merges a short span with the next neighbour (or the
// previous if it is the last span) until every span has at least minLines lines or only one
// span remains. Catches unindented TOC outlines (e.g. PG 9304) and any other sub-min chunks.
func mergeRangesUntilMinLines(ranges [][]int, minLines int) ([][]int, int) {
	if minLines <= 1 || len(ranges) <= 1 {
		return ranges, 0
	}
	out := append([][]int(nil), ranges...)
	merged := 0
	for guard := 0; guard < len(out)*5+20; guard++ {
		shortAt := -1
		for i, span := range out {
			if spanLineCount(span) < minLines {
				shortAt = i
				break
			}
		}
		if shortAt < 0 {
			break
		}
		if len(out) == 1 {
			break
		}
		if shortAt+1 < len(out) {
			out[shortAt] = []int{out[shortAt][0], out[shortAt+1][1]}
			out = append(out[:shortAt+1], out[shortAt+2:]...)
			merged++
			continue
		}
		if shortAt > 0 {
			out[shortAt-1] = []int{out[shortAt-1][0], out[shortAt][1]}
			out = append(out[:shortAt], out[shortAt+1:]...)
			merged++
			continue
		}
		break
	}
	return out, merged
}

// SectionLengthsNeedReview returns warnings and true if any section span has fewer than
// MinSectionLineCount lines (same count as written section files).
func SectionLengthsNeedReview(ranges [][]int) (warnings []string, needsReview bool) {
	for i, span := range ranges {
		if span[1] < span[0] {
			continue
		}
		n := span[1] - span[0] + 1
		if n < MinSectionLineCount {
			needsReview = true
			warnings = append(warnings, fmt.Sprintf("section %d has %d lines (minimum %d); entry must be needs_review", i+1, n, MinSectionLineCount))
		}
	}
	return warnings, needsReview
}

func confidenceForMarks(n int) float64 {
	switch {
	case n == 0:
		return 0.25
	case n == 1:
		return 0.4
	case n < 5:
		return 0.7
	default:
		return 0.85
	}
}


func minSectionLineThresholdForPrefix(prefix string) int {
	if strings.EqualFold(strings.TrimSpace(prefix), "PG6085") {
		return 0
	}
	if strings.EqualFold(strings.TrimSpace(prefix), "PG6585") {
		return 0
	}
	return MinSectionLineCount
}

func removeStaleSectionFiles(dir, prefix string) error {
	pattern := filepath.Join(dir, fmt.Sprintf("%s_Section_*.txt", prefix))
	matches, err := filepath.Glob(pattern)
	if err != nil {
		return err
	}
	for _, p := range matches {
		if err := os.Remove(p); err != nil {
			return err
		}
	}
	return nil
}

// WriteSections writes section files into dir using prefix_Section_n.txt.
func WriteSections(lines []string, dir, prefix string, skipLines int) (SplitHeuristicResult, error) {
	lines = StripGutenbergWrapper(lines)
	lines = truncatePublisherCatalogAfterTheEnd(lines)
	marks := collectMarks(lines, skipLines, prefix)
	ranges := sectionRangesFromMarks(lines, marks)
	if len(ranges) == 0 {
		return SplitHeuristicResult{}, fmt.Errorf("no lines")
	}
	beforeMerge := len(ranges)
	ranges = mergeShortStructuralSections(ranges, lines)
	beforeMinMerge := len(ranges)
	var minMerged int
	minLines := minSectionLineThresholdForPrefix(prefix)
	ranges, minMerged = mergeRangesUntilMinLines(ranges, minLines)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return SplitHeuristicResult{}, err
	}
	if err := removeStaleSectionFiles(dir, prefix); err != nil {
		return SplitHeuristicResult{}, err
	}

	marksN := len(marks)
	conf := confidenceForMarks(marksN)
	var warnings []string
	if marksN == 0 {
		warnings = append(warnings, "no chapter markers; single section")
	} else if marksN == 1 {
		warnings = append(warnings, "only one marker; single section")
	}
	if n := beforeMerge - len(ranges); n > 0 {
		warnings = append(warnings, fmt.Sprintf("merged %d short BOOK/PART heading block(s) into the following section", n))
	}
	if minMerged > 0 {
		warnings = append(warnings, fmt.Sprintf("merged %d under-length section(s) to reach %d lines minimum (was %d sections)", minMerged, minLines, beforeMinMerge))
	}

	var paths []string
	for _, span := range ranges {
		if span[1] < span[0] {
			continue
		}
		name := fmt.Sprintf("%s_Section_%d.txt", prefix, len(paths)+1)
		p := filepath.Join(dir, name)
		f, err := os.Create(p)
		if err != nil {
			return SplitHeuristicResult{}, err
		}
		w := bufio.NewWriter(f)
		for ln := span[0]; ln <= span[1] && ln < len(lines); ln++ {
			w.WriteString(lines[ln])
			w.WriteByte('\n')
		}
		w.Flush()
		f.Close()
		paths = append(paths, p)
	}

	lineWarnings, needsReview := []string{}, false
	if minLines > 1 {
		lineWarnings, needsReview = SectionLengthsNeedReview(ranges)
		warnings = append(warnings, lineWarnings...)
	}
	if needsReview && conf >= NeedsReviewSplitConf {
		conf = NeedsReviewSplitConf - 0.01
	}

	return SplitHeuristicResult{SectionPaths: paths, Confidence: conf, Warnings: warnings, NeedsReview: needsReview}, nil
}

// truncatePublisherCatalogAfterTheEnd removes trailing publisher advertisements that repeat another
// book's outline (standalone "THE END" then later "TABLE OF CONTENTS" / PART I for a different work).
// The PG *** END *** line is still after this block in the raw file; those lines must not produce splits.
func truncatePublisherCatalogAfterTheEnd(lines []string) []string {
	const lookAhead = 650
	for i, line := range lines {
		t := strings.TrimSpace(line)
		if !standaloneTheEndLine.MatchString(t) {
			continue
		}
		maxJ := i + 1 + lookAhead
		if maxJ > len(lines) {
			maxJ = len(lines)
		}
		for j := i + 1; j < maxJ; j++ {
			if !isContentsHeadingLine(lines[j]) {
				continue
			}
			tj := strings.ToLower(strings.TrimSpace(lines[j]))
			if strings.Contains(tj, "table of contents") {
				// #region agent log
				debugLogTocSplit("H5", map[string]interface{}{
					"mode": "truncate-after-the-end", "theEndLine": i, "tocLine": j, "beforeLines": len(lines), "afterLines": i + 1,
				})
				// #endregion
				return lines[:i+1]
			}
		}
	}
	return lines
}

// NormalizeLines splits on newlines and normalizes CRLF.
func NormalizeLines(raw string) []string {
	return strings.Split(strings.ReplaceAll(raw, "\r\n", "\n"), "\n")
}

// SplitFileFromPath reads a raw txt, normalizes, splits, writes under cacheDir/<id>/.
func SplitFileFromPath(rawPath string, entry ManifestEntry, cacheDir string, skipLines int) (SplitHeuristicResult, error) {
	entry.EnsureSectionPrefix()
	b, err := os.ReadFile(rawPath)
	if err != nil {
		return SplitHeuristicResult{}, err
	}
	lines := NormalizeLines(string(b))
	outDir := entry.BooksDir(cacheDir)
	prefix := entry.SectionPrefix
	return WriteSections(lines, outDir, prefix, skipLines)
}
