const board = document.getElementById("grid-container");
const suggestionsList = document.getElementById("suggestions");
const guesses = [];
let wordList = [];

function createBoard() {
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
            board.appendChild(cell);
        }
    }

    // Autofocus on the first cell
    guesses[0][0].focus();
}

function clearBoard() {
    guesses.forEach(row => {
        row.forEach(cell => {
            cell.value = "";
            cell.dataset.state = "unset";
            cell.className = "word-cell";
        });
    });

    document.getElementById("stats").innerHTML = "";
    document.getElementById("suggestions").innerHTML = "";
    document.getElementById("top-picks").innerHTML = "";
    document.getElementById("out-of").innerHTML = "";

    guesses[0][0].focus(); // Refocus on the first cell
}

function handleTyping(e, row, col) {
    const cell = e.target;
    cell.value = cell.value.toUpperCase();

    // Only auto-advance if not the last in row
    if (cell.value && col < 4) {
        const nextCell = guesses[row][col + 1];
        if (nextCell) nextCell.focus();
    }
}

function handleBackspace(e, row, col) {
    const cell = guesses[row][col];

    if (cell.value === "" && col > 0) {
        const prevCell = guesses[row][col - 1];
        prevCell.focus();
        prevCell.value = "";
        e.preventDefault(); // Prevent default backspace behavior
    }
}

function cycleColor(cell) {
    const states = ["unset", "green", "yellow", "grey"];
    let current = states.indexOf(cell.dataset.state);
    current = (current + 1) % states.length;
    cell.dataset.state = states[current];
    cell.className = `word-cell ${states[current] !== "unset" ? states[current] : ""}`;
}

function calculateLetterFrequencies(words, hideKnown = false, knownLetters = new Set()) {
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

function scoreWord(word, knownLetters, exact, invalid, topLetters) {
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

function applyHints() {
    const included = new Set();
    const excluded = new Set();
    const knownLetters = new Set();
    const exact = Array(5).fill(null);
    const partial = [];

    guesses.forEach(row => {
        row.forEach((cell, i) => {
            const letter = cell.value.trim().toLowerCase();

            if (!letter || letter.length !== 1) return;

            const state = cell.dataset.state;

            if (state === "green") {
                exact[i] = letter;
                knownLetters.add(letter);
            } else if (state === "yellow") {
                included.add(letter);
                knownLetters.add(letter);
                partial.push({ letter, notAt: i });
            } else if (state === "grey") {
                excluded.add(letter);
            }
        });
    });

    const results = wordList.filter(word => {
        if (excluded.hasAny([...word])) return false;

        for (let i = 0; i < 5; i++) {
            if (exact[i] && word[i] !== exact[i]) return false;
        }

        for (const { letter, notAt } of partial) {
            if (!word.includes(letter) || word[notAt] === letter) return false;
        }

        for (const l of included) {
            if (!word.includes(l)) return false;
        }

        return true;
    });

    // Toggle to include/exclude known letters from stats
    const toggle = document.getElementById("toggle-known");
    const hideKnown = !toggle.checked;

    const stats = calculateLetterFrequencies(results, hideKnown, knownLetters);
    document.getElementById("stats").innerHTML = stats
        .map(s => `<li class="collection-item">${s.char.toUpperCase()}<span class="right">${s.rate}%</span></li>`)
        .join("");

    document.getElementById("out-of").innerHTML = `(narrowing to ${results.length} of ${wordList.length} words)`;

    suggestionsList.innerHTML = results
        .slice(0, 30)
        .map(w => `<div class="suggestion-item">${w.toUpperCase()}</div>`)
        .join("");

    const rawTopLetters = calculateLetterFrequencies(results, false);
    const topLetters = rawTopLetters.map(entry => entry[0]?.toLocaleLowerCase?.() || "");

    // Build invalid position map from yello letters
    const invalid = {};
    partial.forEach(({ letter, notAt }) => {
        if (!invalid[notAt]) invalid[notAt] = new Set();
        invalid[notAt].add(letter);
    });

    // Score words using current context
    const ranked = results.map(word => ({
        word,
        score: scoreWord(word, new Set([...included, ...knownLetters]), exact, invalid, topLetters)
    })).sort((a, b) => b.score - a.score);

    // Update top-picks UI
    const topPicksHTML = ranked.slice(0, 3)
        .map(p => `<li class="collection-item">${p.word.toUpperCase()}<span class="right">${p.score}</span></li>`)
        .join("");

    document.getElementById("top-picks").innerHTML = topPicksHTML;
}

Set.prototype.hasAny = function (arr) {
    return arr.some(x => this.has(x));
};

fetch("words.txt")
    .then(response => response.text())
    .then(text => {
        wordList = text.split("\n").map(w => w.trim().toLowerCase()).filter(w => w.length === 5);
    });

createBoard();
