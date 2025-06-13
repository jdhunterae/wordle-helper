import { handleTyping, handleBackspace, cycleColor } from './input.js';
import { DOM, guesses } from './utils.js';

export function createBoard() {
    for (let row = 0; row < 6; row++) {
        guesses[row] = [];

        for (let col = 0; col < 5; col++) {
            const cell = document.createElement("input");
            cell.className = "word-cell";
            cell.maxLength = 1;
            cell.autocomplete = "off";
            cell.inputMode = "text";
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.dataset.state = "unset";

            // Color cycling on click
            cell.addEventListener("click", () => {
                cycleColor(cell);
            });

            // Validate and move to the next box on input
            cell.addEventListener('input', (e) => {
                handleTyping(e, row, col);
            });

            // Optional: prevent non-letter characters
            cell.addEventListener('keypress', (e) => {
                const char = String.fromCharCode(e.which);
                if (!/^[a-zA-Z]$/.test(char)) {
                    e.preventDefault();
                }
            });

            cell.addEventListener('keydown', (e) => {
                if (e.key === "Backspace") {
                    handleBackspace(e, row, col);
                }
            });

            guesses[row].push(cell);
            DOM.board.appendChild(cell);
        }
    }

    guesses[0][0].focus();
}

export function clearBoard() {
    guesses.flat().forEach(cell => {
        cell.value = "";
        cell.dataset.state = "unset";
        cell.className = "word-cell";
    });

    DOM.stats.innerHTML = "";
    DOM.suggestions.innerHTML = "";
    DOM.topPicks.innerHTML = "";
    DOM.outOf.innerHTML = "";

    guesses[0][0].focus();
}

export function parseGridState() {
    const exact = Array(5).fill(null);
    const included = new Set();
    const excluded = new Set();
    const knownLetters = new Set();
    const partial = [];
    const letterStatus = {};
    const letterCounts = {};
    const requiredCounts = {};

    const priority = { unset: 0, grey: 1, yellow: 2, green: 3 };
    const greenSeen = new Set(); // e.g., "a@0", "r@2"

    guesses.forEach(row => {
        const rowLetterCounts = {}; // Track green/yellow per guess/row/word

        row.forEach((cell, i) => {
            const letter = cell.value.trim().toLowerCase();
            const state = cell.dataset.state;

            if (!letter || letter.length !== 1) return;

            // Track highest status for display
            const current = priority[state] || 0;
            const existing = priority[letterStatus[letter]] || 0;
            if (current > existing) {
                letterStatus[letter] = state;
            }

            // count the letter state occurences
            if (!letterCounts[letter]) {
                letterCounts[letter] = { green: 0, yellow: 0, grey: 0 };
            }

            // Collect clue state
            if (state === "green") {
                const key = `${letter}@${i}`;
                if (!greenSeen.has(key)) {
                    greenSeen.add(key);
                    letterCounts[letter].green++;
                }
                exact[i] = letter;
                knownLetters.add(letter);
                rowLetterCounts[letter] = (rowLetterCounts[letter] || 0) + 1;
            } else if (state === "yellow") {
                letterCounts[letter].yellow++;
                included.add(letter);
                knownLetters.add(letter);
                partial.push({ letter, notAt: i });
                rowLetterCounts[letter] = (rowLetterCounts[letter] || 0) + 1;
            } else if (state === "grey") {
                letterCounts[letter].grey++;
                excluded.add(letter);
            }
        });

        for (const [letter, count] of Object.entries(rowLetterCounts)) {
            requiredCounts[letter] = Math.max(requiredCounts[letter] || 0, count);
        }
    });

    return { exact, included, excluded, knownLetters, partial, letterStatus, letterCounts, requiredCounts };
}