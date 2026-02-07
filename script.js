// KAN-17 Flappy Bird implementation using vanilla JS

// ----- Configuration -----
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const GRAVITY = 0.45; // downward acceleration per frame
const FLAP_STRENGTH = -8.5; // initial upward velocity on flap
const PIPE_SPEED = 2.5; // horizontal speed of pipes
const PIPE_INTERVAL = 1500; // ms between pipe spawns
const PIPE_GAP = 150; // vertical gap between top and bottom pipes
const PIPE_MIN_HEIGHT = 60; // minimum height of top/bottom pipe

// DOM references
const gameContainer = document.getElementById('game-container');
const birdEl = document.getElementById('bird');
const groundEl = document.getElementById('ground');
const scoreEl = document.getElementById('score');
const startScreenEl = document.getElementById('start-screen');
const gameOverScreenEl = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score');
const bestScoreEl = document.getElementById('best-score');
const restartBtn = document.getElementById('restart-btn');

// Game state
let bird;
let pipes;
let score;
let bestScore = 0;
let lastPipeTime = 0;
let lastFrameTime = 0;
let animationFrameId = null;
let isRunning = false;
let hasStarted = false;

// Load best score from localStorage
(function loadBestScore() {
  const stored = localStorage.getItem('kan17_best_score');
  if (stored) {
    bestScore = parseInt(stored, 10) || 0;
  }
})();

// ----- Entity helpers -----
function createInitialState() {
  const groundRect = groundEl.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();

  const groundTop = groundRect.top - containerRect.top;

  bird = {
    x: GAME_WIDTH * 0.25,
    y: GAME_HEIGHT * 0.4,
    width: 34,
    height: 24,
    vy: 0,
  };

  pipes = [];
  score = 0;
  lastPipeTime = 0;
  lastFrameTime = performance.now();

  // Position bird and clear pipes from DOM
  updateBirdElement();
  document.querySelectorAll('.pipe').forEach((p) => p.remove());

  // Ensure ground is at bottom of container
  groundEl.style.height = `${Math.max(80, GAME_HEIGHT - groundTop)}px`;
}

function spawnPipePair() {
  const containerRect = gameContainer.getBoundingClientRect();
  const groundRect = groundEl.getBoundingClientRect();
  const groundTop = groundRect.top - containerRect.top;

  const maxGapTop = groundTop - PIPE_GAP - PIPE_MIN_HEIGHT;
  const gapTop =
    PIPE_MIN_HEIGHT + Math.random() * Math.max(0, maxGapTop - PIPE_MIN_HEIGHT);

  const topHeight = gapTop;
  const bottomHeight = groundTop - (gapTop + PIPE_GAP);

  const pipeId = `pipe-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const topPipe = document.createElement('div');
  topPipe.className = 'pipe top';
  topPipe.style.height = `${topHeight}px`;
  topPipe.style.left = `${GAME_WIDTH}px`;
  topPipe.dataset.pipeId = pipeId;

  const bottomPipe = document.createElement('div');
  bottomPipe.className = 'pipe bottom';
  bottomPipe.style.height = `${bottomHeight}px`;
  bottomPipe.style.left = `${GAME_WIDTH}px`;
  bottomPipe.dataset.pipeId = pipeId;

  gameContainer.appendChild(topPipe);
  gameContainer.appendChild(bottomPipe);

  pipes.push({
    id: pipeId,
    x: GAME_WIDTH,
    width: 60,
    gapTop,
    gapBottom: gapTop + PIPE_GAP,
    passed: false,
    topEl: topPipe,
    bottomEl: bottomPipe,
  });
}

function updateBirdElement() {
  birdEl.style.left = `${bird.x - bird.width / 2}px`;
  birdEl.style.top = `${bird.y - bird.height / 2}px`;
}

// Axis-aligned bounding box collision detection
function isColliding(rectA, rectB) {
  return !(
    rectA.right < rectB.left ||
    rectA.left > rectB.right ||
    rectA.bottom < rectB.top ||
    rectA.top > rectB.bottom
  );
}

function checkCollisions() {
  const containerRect = gameContainer.getBoundingClientRect();
  const groundRect = groundEl.getBoundingClientRect();

  const birdRect = {
    left: bird.x - bird.width / 2,
    right: bird.x + bird.width / 2,
    top: bird.y - bird.height / 2,
    bottom: bird.y + bird.height / 2,
  };

  // Collision with ground or ceiling
  const groundTop = groundRect.top - containerRect.top;
  if (birdRect.bottom >= groundTop || birdRect.top <= 0) {
    return true;
  }

  // Collision with pipes
  for (const pipe of pipes) {
    const topRect = {
      left: pipe.x,
      right: pipe.x + pipe.width,
      top: 0,
      bottom: pipe.gapTop,
    };
    const bottomRect = {
      left: pipe.x,
      right: pipe.x + pipe.width,
      top: pipe.gapBottom,
      bottom: groundTop,
    };

    if (isColliding(birdRect, topRect) || isColliding(birdRect, bottomRect)) {
      return true;
    }
  }

  return false;
}

// ----- Game loop -----
function gameLoop(timestamp) {
  if (!isRunning) return;

  const delta = timestamp - lastFrameTime;
  lastFrameTime = timestamp;

  // Spawn pipes at fixed time intervals
  if (timestamp - lastPipeTime > PIPE_INTERVAL) {
    spawnPipePair();
    lastPipeTime = timestamp;
  }

  // Update bird physics: v = v + a, y = y + v
  bird.vy += GRAVITY;
  bird.y += bird.vy;
  updateBirdElement();

  // Move pipes and handle scoring
  const dx = PIPE_SPEED; // pixels per frame (approx; frame rate ~60fps)
  pipes.forEach((pipe) => {
    pipe.x -= dx;
    pipe.topEl.style.left = `${pipe.x}px`;
    pipe.bottomEl.style.left = `${pipe.x}px`;

    // Score when bird passes the pipe center
    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      pipe.passed = true;
      score += 1;
      scoreEl.textContent = score;
    }
  });

  // Remove off-screen pipes
  pipes = pipes.filter((pipe) => {
    if (pipe.x + pipe.width < 0) {
      pipe.topEl.remove();
      pipe.bottomEl.remove();
      return false;
    }
    return true;
  });

  // Collision detection
  if (checkCollisions()) {
    endGame();
    return;
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

// ----- Game control -----
function startGame() {
  if (isRunning) return;
  hasStarted = true;
  isRunning = true;
  startScreenEl.classList.remove('visible');
  gameOverScreenEl.classList.remove('visible');
  createInitialState();
  scoreEl.textContent = '0';
  lastFrameTime = performance.now();
  lastPipeTime = lastFrameTime;
  animationFrameId = requestAnimationFrame(gameLoop);
}

function endGame() {
  isRunning = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  finalScoreEl.textContent = score;

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('kan17_best_score', String(bestScore));
  }

  bestScoreEl.textContent = bestScore;
  gameOverScreenEl.classList.add('visible');
}

function resetGame() {
  hasStarted = false;
  isRunning = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  createInitialState();
  scoreEl.textContent = '0';
  startScreenEl.classList.add('visible');
  gameOverScreenEl.classList.remove('visible');
}

function flap() {
  if (!hasStarted) {
    startGame();
  }
  if (!isRunning) return;
  bird.vy = FLAP_STRENGTH;
}

// ----- Input handling -----
function handleKeydown(e) {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    flap();
  }
}

function handlePointerInput() {
  flap();
}

// Attach listeners
window.addEventListener('keydown', handleKeydown);

gameContainer.addEventListener('mousedown', handlePointerInput);
// Touch support for mobile

gameContainer.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handlePointerInput();
});

restartBtn.addEventListener('click', () => {
  resetGame();
});

// Initialize static state
createInitialState();
startScreenEl.classList.add('visible');
scoreEl.textContent = '0';

// Expose some helpers for debugging in console (optional)
window.__KAN17_DEBUG__ = {
  getState: () => ({ bird, pipes, score, bestScore }),
};
