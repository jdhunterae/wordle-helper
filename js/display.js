import { DOM } from './utils.js';
import { shuffleArray } from './utils.js';

export function renderStats(stats, letterStatus = {}) {
    DOM.stats.innerHTML = stats
        .map(s => {
            const cls = letterStatus[s.char] || "";
            return `<li class="collection-item ${cls}">${s.char.toUpperCase()}<span class="right">${s.rate}%</span></li>`
        })
        .join("");
}

export function renderSuggestions(filtered) {
    DOM.suggestions.innerHTML = filtered
        .slice(0, 45)
        .map(w => `<div class="suggestion-item">${w.toUpperCase()}</div>`)
        .join("");
}

export function renderTopPicks(ranked) {
    const topScore = ranked[0]?.score || 0;
    const topMatches = ranked.filter(w => w.score === topScore);

    if (topMatches.length > 3) {
        ranked = shuffleArray(topMatches).slice(0, 3);
    } else {
        ranked = ranked.slice(0, 3);
    }

    DOM.topPicks.innerHTML = ranked
        .map(p => `<li class="collection-item">${p.word.toUpperCase()}<span class="right">${p.score}</span></li>`)
        .join("");
}