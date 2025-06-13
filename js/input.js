import { guesses } from './utils.js';

export function handleTyping(e, row, col) {
    const cell = e.target;
    cell.value = cell.value.toUpperCase();

    // Only auto-advance if not the last in row
    if (cell.value && col < 4) {
        const nextCell = guesses[row][col + 1];
        if (nextCell) nextCell.focus();
    }
}

export function handleBackspace(e, row, col) {
    const cell = guesses[row][col];

    if (cell.value === "" && col > 0) {
        const prevCell = guesses[row][col - 1];
        prevCell.focus();
        prevCell.value = "";
        e.preventDefault(); // Prevent default backspace behavior
    }
}

export function cycleColor(cell) {
    const states = ["unset", "green", "yellow", "grey"];
    let current = states.indexOf(cell.dataset.state);
    current = (current + 1) % states.length;
    cell.dataset.state = states[current];
    cell.className = `word-cell ${states[current] !== "unset" ? states[current] : ""}`;
}