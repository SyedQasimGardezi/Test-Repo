// KAN-17 Flappy Bird implementation
// Vanilla JS game using requestAnimationFrame.

// ----- Configuration -----
const CONFIG = {
  width: 360,
  height: 640,
  gravity: 0.45,
  flapVelocity: -7.5,
  maxFallSpeed: 12,
  pipeSpeed: 2.5,
  pipeWidth: 60,
  pipeGap: 150,
  pipeInterval: 1500, // ms between pipes
  bird: {
    x: 90,
    width: 34,
    height: 24,
  },
  groundHeight: 80,
};

// ----- Game State -----
const gameContainer = document.getElementById('game-container');
const birdEl = document.getElementById('bird');
const groundEl = document.getElementById('ground');
const startScreenEl = document.getElementById('start-screen');
const gameOverScreenEl = document.getElementById('game-over-screen');
const restartBtn = document.getElementById('restart-btn');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const finalScoreEl = document.getElementById('final-score');
const finalBestScoreEl = document.getElementById('final-best-score');

let lastTimestamp = 0;
let pipeSpawnTimer = 0;
let animationFrameId = null;

const STATE = {
  running: false,
  gameOver: false,
  birdY: CONFIG.height / 2,
  birdVelocity: 0,
  pipes: [], // each: { x, gapTop, passed }
  score: 0,
  bestScore: 0,
};

// ----- Utility Functions -----
function loadBestScore() {
  const stored = localStorage.getItem('kan17_best_score');
  STATE.bestScore = stored ? parseInt(stored, 10) || 0 : 0;
  bestScoreEl.textContent = STATE.bestScore;
}

function saveBestScore() {
  if (STATE.score > STATE.bestScore) {
    STATE.bestScore = STATE.score;
    localStorage.setItem('kan17_best_score', String(STATE.bestScore));
  }
}

function resetState() {
  STATE.running = false;
  STATE.gameOver = false;
  STATE.birdY = CONFIG.height / 2;
  STATE.birdVelocity = 0;
  STATE.pipes = [];
  STATE.score = 0;
  pipeSpawnTimer = 0;
  lastTimestamp = 0;
  scoreEl.textContent = '0';
  updateBirdPosition();
  clearPipesFromDOM();
}

function startGame() {
  if (STATE.running) return;
  resetState();
  STATE.running = true;
  startScreenEl.classList.remove('visible');
  gameOverScreenEl.classList.remove('visible');
  lastTimestamp = performance.now();
  animationFrameId = requestAnimationFrame(gameLoop);
}

function endGame() {
  STATE.running = false;
  STATE.gameOver = true;
  saveBestScore();
  finalScoreEl.textContent = STATE.score;
  finalBestScoreEl.textContent = STATE.bestScore;
  bestScoreEl.textContent = STATE.bestScore;
  gameOverScreenEl.classList.add('visible');
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function flap() {
  if (!STATE.running) {
    // Start game on first flap from start or after game over
    if (!STATE.gameOver) {
      startGame();
    } else {
      // If game over, restart
      startGame();
    }
  }
  STATE.birdVelocity = CONFIG.flapVelocity;
}

// ----- DOM Helpers -----
function updateBirdPosition() {
  const clampedY = Math.max(0, Math.min(STATE.birdY, CONFIG.height - CONFIG.groundHeight - CONFIG.bird.height));
  birdEl.style.top = `${clampedY}px`;
}

function createPipeElements(pipe) {
  const topEl = document.createElement('div');
  topEl.className = 'pipe top';

  const bottomEl = document.createElement('div');
  bottomEl.className = 'pipe bottom';

  topEl.style.left = `${pipe.x}px`;
  bottomEl.style.left = `${pipe.x}px`;

  topEl.style.height = `${pipe.gapTop}px`;
  const bottomHeight = CONFIG.height - CONFIG.groundHeight - (pipe.gapTop + CONFIG.pipeGap);
  bottomEl.style.height = `${bottomHeight}px`;

  pipe.topEl = topEl;
  pipe.bottomEl = bottomEl;

  gameContainer.appendChild(topEl);
  gameContainer.appendChild(bottomEl);
}

function clearPipesFromDOM() {
  STATE.pipes.forEach((pipe) => {
    if (pipe.topEl?.parentNode) pipe.topEl.parentNode.removeChild(pipe.topEl);
    if (pipe.bottomEl?.parentNode) pipe.bottomEl.parentNode.removeChild(pipe.bottomEl);
  });
}

// ----- Game Mechanics -----
function spawnPipe() {
  const minGapTop = 40;
  const maxGapTop = CONFIG.height - CONFIG.groundHeight - CONFIG.pipeGap - 40;
  const gapTop = Math.floor(Math.random() * (maxGapTop - minGapTop + 1)) + minGapTop;

  const pipe = {
    x: CONFIG.width,
    gapTop,
    passed: false,
    topEl: null,
    bottomEl: null,
  };

  createPipeElements(pipe);
  STATE.pipes.push(pipe);
}

function updatePipes(delta) {
  const dx = CONFIG.pipeSpeed * (delta / 16.67); // normalize to ~60fps

  STATE.pipes.forEach((pipe) => {
    pipe.x -= dx;
    if (pipe.topEl) pipe.topEl.style.left = `${pipe.x}px`;
    if (pipe.bottomEl) pipe.bottomEl.style.left = `${pipe.x}px`;
  });

  // Remove off-screen pipes
  STATE.pipes = STATE.pipes.filter((pipe) => {
    if (pipe.x + CONFIG.pipeWidth < 0) {
      if (pipe.topEl?.parentNode) pipe.topEl.parentNode.removeChild(pipe.topEl);
      if (pipe.bottomEl?.parentNode) pipe.bottomEl.parentNode.removeChild(pipe.bottomEl);
      return false;
    }
    return true;
  });
}

function updateBird(delta) {
  const dt = delta / 16.67;
  STATE.birdVelocity += CONFIG.gravity * dt;
  if (STATE.birdVelocity > CONFIG.maxFallSpeed) {
    STATE.birdVelocity = CONFIG.maxFallSpeed;
  }
  STATE.birdY += STATE.birdVelocity * dt;
  updateBirdPosition();
}

function checkCollisions() {
  const birdRect = {
    x: CONFIG.bird.x,
    y: STATE.birdY,
    width: CONFIG.bird.width,
    height: CONFIG.bird.height,
  };

  // Ground / ceiling
  if (birdRect.y <= 0 || birdRect.y + birdRect.height >= CONFIG.height - CONFIG.groundHeight) {
    return true;
  }

  // Pipes
  for (const pipe of STATE.pipes) {
    const pipeX = pipe.x;
    const pipeWidth = CONFIG.pipeWidth;

    const topRect = {
      x: pipeX,
      y: 0,
      width: pipeWidth,
      height: pipe.gapTop,
    };

    const bottomRect = {
      x: pipeX,
      y: pipe.gapTop + CONFIG.pipeGap,
      width: pipeWidth,
      height: CONFIG.height - CONFIG.groundHeight - (pipe.gapTop + CONFIG.pipeGap),
    };

    if (aabbIntersect(birdRect, topRect) || aabbIntersect(birdRect, bottomRect)) {
      return true;
    }
  }

  return false;
}

function aabbIntersect(a, b) {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

function updateScore() {
  STATE.pipes.forEach((pipe) => {
    if (!pipe.passed && pipe.x + CONFIG.pipeWidth < CONFIG.bird.x) {
      pipe.passed = true;
      STATE.score += 1;
      scoreEl.textContent = STATE.score;
    }
  });
}

// ----- Game Loop -----
function gameLoop(timestamp) {
  if (!STATE.running) return;

  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // Spawn pipes
  pipeSpawnTimer += delta;
  if (pipeSpawnTimer >= CONFIG.pipeInterval) {
    spawnPipe();
    pipeSpawnTimer = 0;
  }

  updateBird(delta);
  updatePipes(delta);
  updateScore();

  if (checkCollisions()) {
    endGame();
    return;
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

// ----- Input Handling -----
function handleKeyDown(e) {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    flap();
  }
}

function handlePointerInput(e) {
  e.preventDefault();
  flap();
}

// ----- Initialization -----
function init() {
  loadBestScore();
  updateBirdPosition();

  document.addEventListener('keydown', handleKeyDown);
  gameContainer.addEventListener('mousedown', handlePointerInput);
  gameContainer.addEventListener('touchstart', handlePointerInput, {
    passive: false,
  });

  restartBtn.addEventListener('click', () => {
    startGame();
  });
}

window.addEventListener('load', init);
