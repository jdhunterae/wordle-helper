import { parseGridState } from './grid.js';
import { renderStats, renderSuggestions, renderTopPicks } from './display.js';
import { DOM, DEBUG, DEBUG_MAX } from './utils.js';

export function applyHints() {
    const state = parseGridState();
    const filtered = filterWordList(wordList, state);
    const stats = calculateLetterFrequencies(filtered, !DOM.toggleKnown.checked, state.knownLetters);
    const topLetters = calculateTopLetters(filtered);
    const invalid = buildInvalidPositionMap(state.partial);
    const ranked = scoreAndRankWords(filtered, state, topLetters, invalid);

    renderStats(stats, state.letterStatus);
    renderSuggestions(filtered);
    renderTopPicks(ranked);
    renderTopPicks(ranked);
    DOM.outOf.textContent = `(narrowing to ${filtered.length} of ${wordList.length} words)`;
}

export function calculateLetterFrequencies(words, hideKnown = false, knownLetters = new Set()) {
    const presenceCounts = {};
    const totalWords = words.length;

    for (const word of words) {
        const uniqueLetters = new Set(word);
        for (const letter of uniqueLetters) {
            if (hideKnown && knownLetters.has(letter)) continue;
            presenceCounts[letter] = (presenceCounts[letter] || 0) + 1;
        }
    }

    const sorted = Object.entries(presenceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([char, count]) => {
            const percent = ((count / totalWords) * 100).toFixed(1);
            return { char, rate: percent };
        });

    return sorted;
}

export function scoreWord(word, knownLetters, exact, invalid, topLetters) {
    let score = 0;
    const used = new Set();

    for (let i = 0; i < 5; i++) {
        const char = word[i];
        if (used.has(char)) continue;
        used.add(char);

        if (topLetters.includes(char)) score += 3;

        if (knownLetters.has(char)) {
            if (exact[i] === char) score += 5;
            else if (invalid[i]?.has(char)) score -= 2;
            else score += 2;
        }
    }

    score += used.size;
    return score;
}


export function filterWordList(words, state) {
    const { exact, included, excluded, partial, letterCounts, requiredCounts } = state;
    let failCount = 0;

    return words.filter(word => {
        const wordLetterCounts = {};

        for (const char of word) {
            wordLetterCounts[char] = (wordLetterCounts[char] || 0) + 1;
        }

        // Green: must match exact position
        for (let i = 0; i < 5; i++) {
            if (exact[i] && word[i] !== exact[i]) {
                if (DEBUG && failCount < DEBUG_MAX)
                    console.log(`[FAIL] ${word}: expected ${exact[i]} at pos ${i}, got ${word[i]}`);
                failCount++;
                return false;
            }
        }

        // Yellow: must exist in word, but NOT at that specific position)
        for (const { letter, notAt } of partial) {
            if (!word.includes(letter)) {
                if (DEBUG && failCount < DEBUG_MAX)
                    console.log(`[FAIL] ${word}: missing yellow letter ${letter}`);
                failCount++;
                return false;
            }
            if (word[notAt] === letter) {
                if (DEBUG && failCount < DEBUG_MAX)
                    console.log(`[FAIL] ${word}: yellow letter ${letter} appears at invalid position ${notAt}`);
                failCount++;
                return false;
            }
        }

        // Included (any green or yellow): must be present
        for (const l of included) {
            if (!word.includes(l)) {
                if (DEBUG && failCount < DEBUG_MAX)
                    console.log(`[FAIL] ${word}: missing included letter ${l}`);
                failCount++;
                return false;
            }
        }

        // Smart logic using requiredCounts
        for (const [letter, req] of Object.entries(requiredCounts)) {
            const wordCount = wordLetterCounts[letter] || 0;

            // If we saw grey of the letter as well, it must appear exactly this many times
            if ((letterCounts[letter]?.grey || 0) > 0) {
                if (wordCount !== req) {
                    if (DEBUG && failCount < DEBUG_MAX)
                        console.log(`[FAIL] ${word}: letter ${letter} must appear exactly ${req} times, found ${wordCount}`);
                    failCount++;
                    return false;
                }
            } else {
                // Otherwise, it must appear at least this many times
                if (wordCount < req) {
                    if (DEBUG && failCount < DEBUG_MAX)
                        console.log(`[FAIL] ${word}: letter ${letter} must appear at least ${req} times, found ${wordCount}`);
                    failCount++;
                    return false;
                }
            }
        }

        // If purely grey, ensure the letter is absent entirely
        for (const l of excluded) {
            // Already handled in grey+color above
            if (requiredCounts[l]) continue;

            if (wordLetterCounts[l]) {
                if (DEBUG && failCount < DEBUG_MAX)
                    console.log(`[FAIL] ${word}: letter ${l} is grey and shouldn't appear`);
                failCount++;
                return false;
            }
        }        

        return true;
    });
}

export function calculateTopLetters(filtered) {
    return calculateLetterFrequencies(filtered, false)
        .map(entry => entry.char.toLocaleLowerCase());
}

export function buildInvalidPositionMap(partial) {
    const invalid = {};

    partial.forEach(({ letter, notAt }) => {
        if (!invalid[notAt]) invalid[notAt] = new Set();
        invalid[notAt].add(letter);
    });

    return invalid;
}

export function scoreAndRankWords(words, state, topLetters, invalid) {
    return words.map(word => ({
        word,
        score: scoreWord(word, state.knownLetters, state.exact, invalid, topLetters)
    })).sort((a, b) => b.score - a.score);
}