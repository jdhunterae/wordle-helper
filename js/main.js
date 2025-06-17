import { createBoard, clearBoard } from './grid.js'
import { applyHints } from './tools.js';

document.getElementById('clear-button').addEventListener('click', clearBoard);
document.getElementById('hint-button').addEventListener('click', applyHints);
document.getElementById('toggle-known').addEventListener('click', applyHints);

const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener('change', () => {
    document.documentElement.setAttribute('data-theme', themeToggle.checked ? 'dark' : 'light');
});

fetch("words.txt")
    .then(res => res.text())
    .then(text => {
        window.wordList = text.split("\n").map(w => w.trim().toLowerCase()).filter(w => w.length === 5);
        createBoard();
        applyHints();
    });

