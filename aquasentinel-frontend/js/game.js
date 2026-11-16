/*
  Aqua Sentinel - Realistic Vector Submarine & Ocean Ecosystem Engine
  Clean syntax with smooth vector graphics, torpedo physics, and victory handling done using AI.
*/

/*
  Modular game loop manually decoupled for high cohesion.
*/
const FISH_GAME_API = 'https://marcconrad.com/uob/fish/api.php?out=json';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = Math.min(player.x, canvas.width - 90);
    player.y = Math.min(player.y, canvas.height - 160);
});

// Load persistent configuration settings
let currentDifficulty = localStorage.getItem('aquaDifficulty') || 'Normal';
let soundEnabled = localStorage.getItem('aquaSound') !== 'false';

// Game State & Score Variables
let score = 0;
let baseHealth = 100;
let energy = 100;
let missionTime = 0;
let isPaused = false;
let isGameOver = false;
let currentFishSolution = null;
let lockedTarget = null;
let lastFireTime = 0; // Cooldown throttle to prevent double-firing/key-repeat bugs

// Combo Tracking Variables
let currentCombo = 0;
let bestCombo = 0;

// Global Web Audio Context (Resumes on user interaction)
let audioCtx = null;
function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Web Audio Sonar FX Synthesizer
function playSonarSound(type = 'ping') {
    if (!soundEnabled) return;
    try {
        initAudio();
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        if (type === 'ping') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
        } else if (type === 'explosion') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }

        osc.connect(gain);
        gain.connect(audioCtx.destination);
    } catch (e) {
        console.log("Audio synthesis error:", e);
    }
}

// Mission Survival Timer & Energy Regeneration
setInterval(() => {
    if (!isPaused && !isGameOver) {
        missionTime++;
        const mins = String(Math.floor(missionTime / 60)).padStart(2, '0');
        const secs = String(missionTime % 60).padStart(2, '0');
        const timeElem = document.getElementById('hud-time');
        if (timeElem) timeElem.innerText = `${mins}:${secs}`;

        if (missionTime % 10 === 0) {
            score += 15;
            const scoreElem = document.getElementById('hud-score');
            if (scoreElem) scoreElem.innerText = score;
        }

        if (energy < 100 && missionTime % 2 === 0) {
            energy = Math.min(100, energy + 5);
            updateEnergyUI();
        }
    }
}, 1000);

function updateEnergyUI() {
    const energyFill = document.getElementById('hud-energy-fill');
    if (energyFill) energyFill.style.width = `${energy}%`;
}

function updateHealthUI() {
    const healthFill = document.getElementById('base-health-fill');
    if (healthFill) healthFill.style.width = `${baseHealth}%`;
}

// Spawn Ambient Bubbles
function createBubbles() {
    const oceanBg = document.querySelector('.ocean-bg');
    if (!oceanBg) return;
    for (let i = 0; i < 25; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        const size = Math.random() * 8 + 3;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}vw`;
        bubble.style.animationDuration = `${Math.random() * 6 + 4}s`;
        bubble.style.animationDelay = `${Math.random() * 5}s`;
        oceanBg.appendChild(bubble);
    }
}
createBubbles();

// Player Submarine
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 50,
    speed: 6.5
};

// Keyboard Controls - Event-Driven Programming (Assigned directly to prevent listener duplication bugs)
const keys = {};
window.onkeydown = (e) => {
    initAudio();
    if (e.repeat) return; // Prevent OS key-repeat stacking
    keys[e.code] = true;
    if (e.code === 'Space' && !isPaused && !isGameOver) {
        e.preventDefault();
        fireTorpedo();
    }
};
window.onkeyup = (e) => {
    keys[e.code] = false;
};

canvas.addEventListener('click', () => {
    initAudio();
});

// Entities
let torpedoes = [];
let particles = [];
let hostiles = [];

function spawnHostile() {
    const fromRight = Math.random() > 0.4;
    let speedMultiplier = 1.0;
    if (currentDifficulty === 'Easy') speedMultiplier = 0.8;
    if (currentDifficulty === 'Hard') speedMultiplier = 1.35;

    return {
        x: fromRight ? canvas.width + 100 : -100,
        y: Math.random() * (canvas.height - 400) + 120,
        vx: (fromRight ? -(Math.random() * 1.2 + 0.8) : (Math.random() * 1.2 + 0.8)) * speedMultiplier,
        vy: ((Math.random() - 0.5) * 0.8) * speedMultiplier,
        radius: 42,
        active: true
    };
}

function initHostiles() {
    hostiles = [];
    for (let i = 0; i < 3; i++) {
        const h = spawnHostile();
        h.x = canvas.width * (0.3 + i * 0.28);
        hostiles.push(h);
    }
}
initHostiles();

let seaweeds = [];
for (let i = 0; i < 22; i++) {
    seaweeds.push({
        x: i * (window.innerWidth / 20) + Math.random() * 20,
        height: Math.random() * 140 + 80,
        segments: 5,
        speed: Math.random() * 0.03 + 0.02
    });
}

let backgroundFish = [];
for (let i = 0; i < 22; i++) {
    backgroundFish.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height - 280) + 60,
        speed: Math.random() * 0.7 + 0.3,
        size: Math.random() * 14 + 8
    });
}

function fireTorpedo() {
    // Throttle firing to 150ms intervals to ensure smooth, controlled projection
    const now = Date.now();
    if (now - lastFireTime < 150) return;
    lastFireTime = now;

    playSonarSound('ping');

    let torpedoSpeedMultiplier = 1.0;
    if (currentDifficulty === 'Easy') torpedoSpeedMultiplier = 0.85;
    if (currentDifficulty === 'Hard') torpedoSpeedMultiplier = 1.25;

    // Fixed multiplication operator syntax
    torpedoes.push({
        x: player.x,
        y: player.y - 40,
        vy: -14 * torpedoSpeedMultiplier
    });
}

// Modal Toggle Helpers
function togglePause() {
    isPaused = !isPaused;
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) {
        if (isPaused) {
            pauseModal.classList.add('active');
        } else {
            pauseModal.classList.remove('active');
            requestAnimationFrame(gameLoop);
        }
    }
}

function openAccountSettings() {
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) pauseModal.classList.remove('active');

    const accountModal = document.getElementById('account-settings-modal');
    if (accountModal) accountModal.classList.add('active');
}

function closeAccountSettings() {
    const accountModal = document.getElementById('account-settings-modal');
    if (accountModal) accountModal.classList.remove('active');

    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) pauseModal.classList.add('active');
}

// Virtual Identity: local storage user profile state and identity persistence
function updateUsername() {
    const newUsername = document.getElementById('new-username-input').value.trim();
    if (!newUsername) return;
    localStorage.setItem('aquaUser', newUsername);
}

function updatePassword() {
    const currentPass = document.getElementById('current-password-input').value;
    const newPass = document.getElementById('new-password-input').value;
    if (!currentPass || !newPass) return;
    document.getElementById('current-password-input').value = '';
    document.getElementById('new-password-input').value = '';
}

// Marc Conrad Fish API Challenge Flow
async function triggerTargetDecryption(targetSub) {
    isPaused = true;
    lockedTarget = targetSub;

    const threatCard = document.getElementById('threat-alert-card');
    if (threatCard) threatCard.classList.add('active');

    setTimeout(async () => {
        if (threatCard) threatCard.classList.remove('active');

        const modal = document.getElementById('api-modal');
        const imgElem = document.getElementById('fish-puzzle-img');
        const loadingText = document.getElementById('api-loading-text');

        if (modal) modal.classList.add('active');
        if (imgElem) imgElem.style.display = 'none';
        if (loadingText) {
            loadingText.style.display = 'block';
            loadingText.innerText = 'Intercepting sonar signature...';
        }
        document.getElementById('api-feedback').innerText = '';
        document.getElementById('fish-answer-input').value = '';

        try {
            // Interoperability: JSON parsing and multi-key fallback
            const res = await fetch(`${FISH_GAME_API}&_t=${Date.now()}`);
            const data = await res.json();

            currentFishSolution = parseInt(data.fish !== undefined ? data.fish : (data.solution ?? 0), 10);
            if (imgElem) imgElem.src = data.question;
            if (imgElem) {
                imgElem.onload = () => {
                    if (loadingText) loadingText.style.display = 'none';
                    imgElem.style.display = 'block';
                };
            }
        } catch (err) {
            currentFishSolution = 2;
            if (loadingText) loadingText.innerText = 'Offline backup cipher loaded. Enter 2.';
        }
    }, 1000);
}

function verifyFishSolution(event) {
    event.preventDefault();
    const inputElem = document.getElementById('fish-answer-input');
    const userGuess = inputElem ? parseInt(inputElem.value, 10) : NaN;

    if (userGuess === currentFishSolution) {
        document.getElementById('api-modal').classList.remove('active');
        document.getElementById('success-modal').classList.add('active');

        playSonarSound('explosion');

        if (lockedTarget) {
            spawnExplosion(lockedTarget.x, lockedTarget.y);
            lockedTarget.active = false;
            lockedTarget = null;
        }

        score += 200;
        currentCombo++;
        if (currentCombo > bestCombo) bestCombo = currentCombo;

        energy = Math.min(100, energy + 25);
        updateEnergyUI();
        document.getElementById('hud-score').innerText = score;
    } else {
        document.getElementById('api-modal').classList.remove('active');
        document.getElementById('incorrect-modal').classList.add('active');

        if (lockedTarget) {
            lockedTarget.x += 120;
            lockedTarget = null;
        }

        currentCombo = 0;
        baseHealth = Math.max(0, baseHealth - 25);
        updateHealthUI();

        if (baseHealth <= 0) {
            document.getElementById('incorrect-modal').classList.remove('active');
            triggerGameOver();
        }
    }
}

function triggerGameOver() {
    isGameOver = true;
    document.getElementById('final-score').innerText = score;
    submitGameResult();
    document.getElementById('game-over-modal').classList.add('active');
}

function triggerVictory() {
    isGameOver = true;
    document.getElementById('victory-score').innerText = score;
    submitGameResult();
    document.getElementById('victory-modal').classList.add('active');
}

function restartGame() {
    isGameOver = false;
    isPaused = false;
    score = 0;
    currentCombo = 0;
    bestCombo = 0;
    baseHealth = 100;
    energy = 100;
    missionTime = 0;
    torpedoes = [];
    particles = [];
    initHostiles();

    updateHealthUI();
    updateEnergyUI();
    document.getElementById('hud-score').innerText = score;
    document.getElementById('hud-time').innerText = "00:00";

    document.getElementById('game-over-modal').classList.remove('active');
    document.getElementById('victory-modal').classList.remove('active');

    requestAnimationFrame(gameLoop);
}

function closeSuccessModal() {
    document.getElementById('success-modal').classList.remove('active');
    isPaused = false;
    if (hostiles.every(h => !h.active)) {
        triggerVictory();
    } else {
        requestAnimationFrame(gameLoop);
    }
}

function closeIncorrectModal() {
    document.getElementById('incorrect-modal').classList.remove('active');
    isPaused = false;
    if (!isGameOver) requestAnimationFrame(gameLoop);
}

function spawnExplosion(x, y) {
    for (let p = 0; p < 28; p++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 11,
            vy: (Math.random() - 0.5) * 11,
            life: 45
        });
    }
}

async function submitGameResult() {
    // Fallback to a default test username if localStorage is empty
    const username = localStorage.getItem('aquaUser') || 'Commander_Alpha';

    try {
        const response = await fetch('http://localhost:8081/api/game/result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, score: score, combo: bestCombo })
        });
        if (!response.ok) {
            console.error("Failed to sync stats to database:", await response.text());
        } else {
            console.log("Game stats successfully synced to PostgreSQL database!");
        }
    } catch (err) {
        console.error("Network error while saving game stats:", err);
    }
}

function update() {
    if ((keys['ArrowUp'] || keys['KeyW']) && player.y > 100) player.y -= player.speed;
    if ((keys['ArrowDown'] || keys['KeyS']) && player.y < canvas.height - 160) player.y += player.speed;
    if ((keys['ArrowLeft'] || keys['KeyA']) && player.x > 100) player.x -= player.speed;
    if ((keys['ArrowRight'] || keys['KeyD']) && player.x < canvas.width - 100) player.x += player.speed;

    backgroundFish.forEach(fish => {
        fish.x += fish.speed;
        if (fish.x > canvas.width + 60) {
            fish.x = -60;
            fish.y = Math.random() * (canvas.height - 280) + 60;
        }
    });

    for (let i = torpedoes.length - 1; i >= 0; i--) {
        torpedoes[i].y += torpedoes[i].vy;
        if (torpedoes[i].y < -20) torpedoes.splice(i, 1);
    }

    let activeHostileCount = 0;
    for (let i = hostiles.length - 1; i >= 0; i--) {
        const h = hostiles[i];
        if (!h.active) continue;

        activeHostileCount++;
        h.x += h.vx;
        h.y += h.vy;

        if (h.x < 140 || h.x > canvas.width - 140) h.vx *= -1;
        if (h.y < 120 || h.y > canvas.height - 200) h.vy *= -1;

        for (let tIdx = torpedoes.length - 1; tIdx >= 0; tIdx--) {
            const t = torpedoes[tIdx];
            if (Math.hypot(t.x - h.x, t.y - h.y) < h.radius + 18) {
                torpedoes.splice(tIdx, 1);
                triggerTargetDecryption(h);
                return;
            }
        }
    }

    if (activeHostileCount === 0 && hostiles.length > 0 && !isGameOver) {
        triggerVictory();
        return;
    }

    particles.forEach((pt, i) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        if (pt.life <= 0) particles.splice(i, 1);
    });
}

function drawRealisticSubmarine(x, y, isHostile) {
    ctx.save();
    ctx.translate(x, y);

    const mainColor = isHostile ? '#78281f' : '#1f4e79';
    const highlightColor = isHostile ? '#ff4d6d' : '#00ffff';
    const portholeColor = isHostile ? '#ff99a8' : '#a8f5ff';

    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 72, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = isHostile ? '#511b15' : '#153852';
    ctx.fillRect(-20, -50, 40, 28);
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-20, -50, 40, 28);

    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.lineTo(0, -66);
    ctx.lineTo(10, -66);
    ctx.stroke();

    ctx.fillStyle = portholeColor;
    ctx.shadowBlur = 8;
    ctx.shadowColor = highlightColor;
    [-24, 0, 24].forEach(px => {
        ctx.beginPath();
        ctx.arc(px, 2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#010b18';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(isHostile ? 70 : -84, -14, 14, 28);

    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#01050a';
    ctx.fillRect(0, canvas.height - 110, canvas.width, 110);

    const time = Date.now() / 800;
    seaweeds.forEach((sw, idx) => {
        ctx.strokeStyle = '#083324';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(sw.x, canvas.height - 110);
        let currX = sw.x;
        let currY = canvas.height - 110;
        const segLen = sw.height / sw.segments;
        for (let s = 1; s <= sw.segments; s++) {
            currY -= segLen;
            currX += Math.sin(time + idx + s) * 8;
            ctx.lineTo(currX, currY);
        }
        ctx.stroke();
    });

    ctx.fillStyle =