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

function drawIntro() {
  if (imageStore.splash.complete) {
    ctx.drawImage(imageStore.splash, 0, 0);
  } else {
    imageStore.splash.onload = function() {
      ctx.drawImage(imageStore.splash, 0, 0);
    };
  }
}

function drawGameOver() {
  ctx.fillStyle = '#000033';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';

  ctx.font = "bold 64px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText("GAME OVER", 140, 60);

  ctx.font = "28px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText("Your score: " + score, 35, 140);
  ctx.fillText("Your high score: " + high_score, 35, 180);

  ctx.font = "16px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText("Click anywhere to try again", 35, 300);
}

drawIntro();
canvas.addEventListener('click', run, false);
canvas.addEventListener('touchstart', run, false);

function run(e) {
  if (e) e.preventDefault();
  canvas.removeEventListener('click', run, false);
  canvas.removeEventListener('touchstart', run, false);
  soundStore.music.play();
  running = true;
  lastTimestamp = null;
  accumulator = 0;
  animFrameId = window.requestAnimationFrame(gameLoop);
}
