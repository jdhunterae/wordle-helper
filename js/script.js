const board = document.getElementById("grid-container");
const suggestionsList = document.getElementById("suggestions");
const guesses = [];
let wordList = [];

function createBoard() {
    for (let row = 0; row < 6; row++) {
        guesses[row] = [];
        for (let col = 0; col < 5; col++) {
            const cell = document.createElement("div");
            cell.className = "word-cell";
            cell.contentEditable = true;
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.dataset.state = "unset";
            cell.addEventListener("click", () => {
                cycleColor(cell);
            });
            guesses[row].push(cell);
            board.appendChild(cell);
        }
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
            return `${char.toUpperCase()} — ${percent}%`;
        });

    return sorted;
}

function applyHints() {
    const included = new Set();
    const excluded = new Set();
    const knownLetters = new Set();
    const exact = Array(5).fill(null);
    const partial = [];

    guesses.forEach(row => {
        row.forEach((cell, i) => {
            const letter = cell.textContent.trim().toLowerCase();
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

    // Check toggle
    const toggle = document.getElementById("toggle-known");
    const hideKnown = !toggle.checked;

    const stats = calculateLetterFrequencies(results, hideKnown, knownLetters);
    document.getElementById("stats").innerHTML = stats.map(s => `<li>${s}</li>`).join("");

    suggestionsList.innerHTML = results.slice(0, 10).map(w => `<li class="collection-item">${w}</li>`).join("");
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
