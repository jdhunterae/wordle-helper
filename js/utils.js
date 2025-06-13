export const DOM = {
    board: document.getElementById("grid-container"),
    stats: document.getElementById("stats"),
    suggestions: document.getElementById("suggestions"),
    topPicks: document.getElementById("top-picks"),
    outOf: document.getElementById("out-of"),
    toggleKnown: document.getElementById("toggle-known")
};

export const guesses = [];
export const DEBUG = true;
export const DEBUG_MAX = 10;

Set.prototype.hasAny = function (arr) {
    return arr.some(x => this.has(x));
};

export function shuffleArray(arr) {
    const a = [...arr];

    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }

    return a;
}
