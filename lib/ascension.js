var PlayerModel = require('./player.js');
var BellModel = require('./bell.js');
var Background = require('./bg.js');
var imageStore = require('./images.js');
var soundStore = require('./sounds.js');

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var bgCanvas = document.getElementById('background');
var bgContext = bgCanvas.getContext('2d');
Background.prototype.context = bgContext;
Background.prototype.canvasWidth = bgCanvas.width;
Background.prototype.canvasHeight = bgCanvas.height;

var FIXED_DT = 1 / 120;
var MAX_FRAME_TIME = 0.1;

var player;
var score;
var high_score = 0;
var currentBellPointVal;
var bells;
var background = new Background();
var running = false;
var lastTimestamp = null;
var accumulator = 0;
var animFrameId = null;

var bellSpawnTimer = 0;
var BASE_SPAWN_INTERVAL = 0.38;
var MIN_SPAWN_INTERVAL = 0.18;

var cameraY = 0;
var CAMERA_SMOOTHING = 0.1;
var CAMERA_LEAD = 150;

function resetGame() {
  player = new PlayerModel(canvas, gameOver);
  score = 0;
  currentBellPointVal = 10;
  bells = [];
  background.reset();
  bellSpawnTimer = 0;
  cameraY = 0;
  accumulator = 0;
  lastTimestamp = null;
}

resetGame();

function getSpawnInterval() {
  var baseInterval = BASE_SPAWN_INTERVAL + (score / 200000);
  baseInterval = Math.min(baseInterval, 0.5);

  var speed = Math.abs(player.jumpVelocity);
  if (player.jumping && player.jumpVelocity < 0) {
    var speedFactor = Math.max(0.4, 1 - (speed / 1200));
    baseInterval *= speedFactor;
  }

  return Math.max(MIN_SPAWN_INTERVAL, baseInterval);
}

function makeNewBell() {
  if (player.dead === false) {
    bells.push(new BellModel(canvas, score, cameraY));
  }
}

function handleScore() {
  score += currentBellPointVal;
  currentBellPointVal += 10;
}

function checkCollision(bell) {
  var dx = player.playerX - bell.x;
  var dy = player.getWorldCenterY() - bell.y;
  var distance = Math.sqrt(dx * dx + dy * dy);
  return distance < player.playerRadius + bell.radius;
}

var MIN_BELLS_ON_SCREEN = 5;

function countVisibleBells() {
  var viewTop = cameraY - 200;
  var viewBottom = cameraY + canvas.height;
  var count = 0;
  for (var i = 0; i < bells.length; i++) {
    if (bells[i].y >= viewTop && bells[i].y <= viewBottom) {
      count++;
    }
  }
  return count;
}

function update(dt) {
  bellSpawnTimer += dt;
  var shouldSpawn = bellSpawnTimer >= getSpawnInterval();
  var needMore = countVisibleBells() < MIN_BELLS_ON_SCREEN;

  if (shouldSpawn || needMore) {
    makeNewBell();
    bellSpawnTimer = 0;
  }

  background.update(dt);
  player.update(dt);

  var targetCameraY = Math.min(0, player.playerY + CAMERA_LEAD);
  cameraY += (targetCameraY - cameraY) * CAMERA_SMOOTHING;

  var survivingBells = [];
  var viewTop = cameraY;
  var viewBottom = cameraY + canvas.height;

  for (var i = 0; i < bells.length; i++) {
    var bell = bells[i];
    bell.update(dt);

    if (bell.y > viewBottom + bell.radius + 200) {
      continue;
    }

    if (!player.dead) {
      if (checkCollision(bell)) {
        handleScore();
        bell.chime.play();
        player.startedAscent = true;
        player.handleJump();
        continue;
      }
    } else {
      if (player.playerY > -220) {
        player.playerY += -15 * dt;
      }
      bell.fallSpeed = -300;
      background.falling = true;
    }

    survivingBells.push(bell);
  }

  bells = survivingBells;
}

function render() {
  background.render();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(0, -cameraY);

  for (var i = 0; i < bells.length; i++) {
    bells[i].render(ctx);
  }

  player.render(ctx);

  ctx.restore();

  ctx.save();
  ctx.font = "bold 24px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillText(score, 12, 32);
  ctx.fillStyle = 'white';
  ctx.fillText(score, 10, 30);
  ctx.restore();
}

function gameLoop(timestamp) {
  if (!running) return;

  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }

  var frameDt = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  if (frameDt > MAX_FRAME_TIME) frameDt = MAX_FRAME_TIME;

  accumulator += frameDt;

  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  render();

  animFrameId = window.requestAnimationFrame(gameLoop);
}

function gameOver() {
  running = false;
  if (animFrameId) {
    window.cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (high_score < score) {
    high_score = score;
  }
  drawGameOver();
  canvas.addEventListener('click', run, false);
  canvas.addEventListener('touchstart', run, false);
  resetGame();
}

var menuAnimFrame = null;
var menuStartTime = 0;

function drawMenuBackground() {
  var grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#000820');
  grad.addColorStop(0.5, '#001048');
  grad.addColorStop(1, '#000830');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
  for (var i = 0; i < 40; i++) {
    var sx = (Math.sin(i * 73.7) * 0.5 + 0.5) * canvas.width;
    var sy = (Math.cos(i * 91.3) * 0.5 + 0.5) * canvas.height;
    var sr = 1 + (i % 3);
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGlowText(text, x, y, font, color, glowColor, glowSize) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowSize;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawPulsingText(text, x, y, font, elapsed) {
  var alpha = 0.5 + 0.5 * Math.sin(elapsed * 3);
  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(200, 220, 255, ' + alpha + ')';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function animateIntro(timestamp) {
  if (running) return;
  var elapsed = (timestamp - menuStartTime) / 1000;

  drawMenuBackground();

  var cx = canvas.width / 2;

  drawGlowText('ASCENSION', cx, 120, "bold 72px 'Helvetica Neue', Arial, sans-serif",
    '#ffffff', '#4488ff', 30);

  ctx.save();
  ctx.font = "18px 'Helvetica Neue', Arial, sans-serif";
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(180, 200, 230, 0.8)';
  ctx.fillText('Hop on fruits and veggies to stay afloat', cx, 180);
  ctx.fillText('and increase your score!', cx, 205);
  ctx.restore();

  var fruitY = 260;
  var fruits = imageStore.fruits;
  var spacing = 60;
  var startX = cx - (fruits.length - 1) * spacing / 2;
  for (var i = 0; i < fruits.length; i++) {
    var bobY = fruitY + Math.sin(elapsed * 2 + i * 1.5) * 8;
    ctx.drawImage(fruits[i], startX + i * spacing - 16, bobY - 16, 32, 32);
  }

  ctx.save();
  ctx.font = "16px 'Helvetica Neue', Arial, sans-serif";
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(150, 170, 200, 0.7)';
  ctx.fillText('Move with mouse  \u2022  Click to jump', cx, 340);
  ctx.restore();

  drawPulsingText('Click anywhere to start', cx, 420,
    "bold 22px 'Helvetica Neue', Arial, sans-serif", elapsed);

  menuAnimFrame = window.requestAnimationFrame(animateIntro);
}

function drawIntro() {
  menuStartTime = performance.now();
  menuAnimFrame = window.requestAnimationFrame(animateIntro);
}

function stopMenuAnim() {
  if (menuAnimFrame) {
    window.cancelAnimationFrame(menuAnimFrame);
    menuAnimFrame = null;
  }
}

function animateGameOver(timestamp) {
  if (running) return;
  var elapsed = (timestamp - menuStartTime) / 1000;

  drawMenuBackground();

  var cx = canvas.width / 2;

  drawGlowText('GAME OVER', cx, 100, "bold 68px 'Helvetica Neue', Arial, sans-serif",
    '#ffffff', '#ff4466', 25);

  ctx.save();
  ctx.textAlign = 'center';

  ctx.font = "bold 36px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#4488ff';
  ctx.shadowBlur = 10;
  ctx.fillText(score.toLocaleString(), cx, 180);

  ctx.shadowBlur = 0;
  ctx.font = "16px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillStyle = 'rgba(180, 200, 230, 0.7)';
  ctx.fillText('SCORE', cx, 200);

  if (score >= high_score && high_score > 0) {
    ctx.font = "bold 16px 'Helvetica Neue', Arial, sans-serif";
    var starAlpha = 0.7 + 0.3 * Math.sin(elapsed * 4);
    ctx.fillStyle = 'rgba(255, 215, 0, ' + starAlpha + ')';
    ctx.fillText('\u2605 NEW HIGH SCORE \u2605', cx, 240);
  }

  ctx.font = "bold 28px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillStyle = 'rgba(200, 210, 230, 0.9)';
  ctx.shadowColor = '#2266cc';
  ctx.shadowBlur = 8;
  ctx.fillText(high_score.toLocaleString(), cx, 290);
  ctx.shadowBlur = 0;

  ctx.font = "14px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillStyle = 'rgba(150, 170, 200, 0.6)';
  ctx.fillText('BEST', cx, 310);

  ctx.restore();

  drawPulsingText('Click anywhere to retry', cx, 420,
    "bold 22px 'Helvetica Neue', Arial, sans-serif", elapsed);

  menuAnimFrame = window.requestAnimationFrame(animateGameOver);
}

function drawGameOver() {
  menuStartTime = performance.now();
  menuAnimFrame = window.requestAnimationFrame(animateGameOver);
}

drawIntro();
canvas.addEventListener('click', run, false);
canvas.addEventListener('touchstart', run, false);

function run(e) {
  if (e) e.preventDefault();
  canvas.removeEventListener('click', run, false);
  canvas.removeEventListener('touchstart', run, false);
  stopMenuAnim();
  soundStore.music.play();
  running = true;
  lastTimestamp = null;
  accumulator = 0;
  animFrameId = window.requestAnimationFrame(gameLoop);
}
