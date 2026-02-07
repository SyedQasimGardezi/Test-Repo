# Flappy Bird (KAN-17)

A simple Flappy Bird-style browser game built with **vanilla HTML, CSS, and JavaScript**.

## How to Run

1. Clone the repository:
   ```bash
   git clone https://github.com/SyedQasimGardezi/Test-Repo.git
   cd Test-Repo
   ```
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
   - You can double-click the file, or
   - Serve it with a simple HTTP server (optional):
     ```bash
     python -m http.server 8000
     # then open http://localhost:8000 in your browser
     ```

No build step or backend is required.

## Controls

- **Spacebar** or **Arrow Up** – flap / jump
- **Mouse click** inside the game area – flap
- **Touch** inside the game area (on mobile) – flap

## Gameplay

- The bird is pulled down by gravity.
- Tap/click/press to flap upward and navigate through the gaps between pipes.
- Each time you successfully pass a pipe pair, your **score increases by 1**.
- Colliding with a pipe, the ground, or the ceiling results in **Game Over**.
- The **best score** is stored in `localStorage` and shown on the Game Over screen.

## Files

- `index.html` – main page and game container
- `style.css` – layout and visual styling
- `script.js` – game logic (physics, rendering, input, collision detection)

## Notes

- The layout is responsive and should work on both desktop and mobile browsers.
- All logic is implemented with `requestAnimationFrame` for smooth animation.
