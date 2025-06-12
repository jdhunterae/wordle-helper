# Wordle Helper

A simple Wordle Helper and Solver app built with HTML, Materialize CSS, and vanilla JavaScript. Designed to help players track guesses and improve strategy by filtering possible solutions based on game feedback.

## 🌟 Project Goals

- **Interactive Guess Panel**  
  Allow users to input up to 6 guesses in a 5-letter Wordle grid format.

- **Color Marking for Hints**  
  Users can mark each letter as:
  - 🟩 **Green** – correct letter in the correct position
  - 🟨 **Yellow** – correct letter in the wrong position
  - ⬛ **Grey** – letter not in the word

- **Smart Filtering of Possibilities**  
  Based on guesses and color hints, the app filters a list of valid 5-letter words and recommends next guesses.

- **Client-side Simplicity**  
  Entirely frontend—no frameworks, no back-end. Just plain HTML, CSS, and JS for easy hosting and use on GitHub Pages.

## 🛠️ Technologies

- HTML5
- Materialize CSS (for layout and responsive styling)
- JavaScript (vanilla)
- Static word list file (`words.txt`)

## 🚀 How to Use

1. Input your Wordle guesses letter-by-letter.
2. Click a letter box to cycle through color statuses (Grey → Yellow → Green → reset).
3. Click **"Get Hints"** to filter the word list and display suggestions.
4. Review the top matches and use them to guide your next guess!

## 📂 File Structure

```
📁 wordle-helper/
├── index.html # Main HTML page
├── style.css # Custom CSS styles
├── script.js # JS logic for grid + filtering
├── words.txt # Source word list (5-letter words)
└── README.md # This file
```

## 🧠 Future Ideas

- Keyboard input support
- Dark mode toggle
- Improved scoring and ranking of suggested words
- Allow custom word lists

## 📄 License

This project is licensed under the MIT License.

---

Enjoy the Wordle grind with a little logic on your side! 🧩
