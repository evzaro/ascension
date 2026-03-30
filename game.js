/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./lib/bell.js"
/*!*********************!*\
  !*** ./lib/bell.js ***!
  \*********************/
(module, __unused_webpack_exports, __webpack_require__) {

var soundStore = __webpack_require__(/*! ./sounds.js */ "./lib/sounds.js");
var imageStore = __webpack_require__(/*! ./images.js */ "./lib/images.js");

var BASE_FALL_SPEED = 75; // pixels per second

var BellModel = function(canvas, score, cameraY) {
  if (score < 2000) {
    this.radius = 28;
  } else if (score < 8000) {
    this.radius = 24;
  } else if (score < 18000) {
    this.radius = 20;
  } else if (score < 30000) {
    this.radius = 16;
  } else {
    this.radius = 14;
  }

  this.chime = soundStore.chime;
  this.canvas = canvas;
  this.baseFallSpeed = BASE_FALL_SPEED;
  this.fallSpeed = BASE_FALL_SPEED;
  this.x = (Math.random() * this.canvas.width);
  this.y = (cameraY || 0) - 50 - (Math.random() * 150);
  this.fruit = imageStore.fruits[Math.floor(Math.random() * imageStore.fruits.length)];

  this.spriteSize = this.radius * 2.5;
  this.spriteHalf = this.spriteSize / 2;

  this.fruitSprite = imageStore.sprite({
    width: this.spriteSize,
    height: this.spriteSize,
    image: this.fruit,
  });
};

BellModel.prototype.update = function(dt) {
  this.y += this.fallSpeed * dt;
};

BellModel.prototype.render = function(ctx) {
  var pos = { x: this.x - this.spriteHalf, y: this.y - this.spriteHalf };
  this.fruitSprite.render(ctx, pos);
};

module.exports = BellModel;


/***/ },

/***/ "./lib/bg.js"
/*!*******************!*\
  !*** ./lib/bg.js ***!
  \*******************/
(module, __unused_webpack_exports, __webpack_require__) {

var imageStore = __webpack_require__(/*! ./images.js */ "./lib/images.js");

var NORMAL_PAN_SPEED = 36; // pixels per second
var FALLING_PAN_SPEED = -330; // pixels per second (reverse scroll on death)

function Background() {
  this.falling = false;
  this.x = 0;
  this.y = 0;
  this.panningSpeed = NORMAL_PAN_SPEED;
}

Background.prototype.update = function(dt) {
  if (this.falling) {
    this.panningSpeed = FALLING_PAN_SPEED;
  }
  this.y += this.panningSpeed * dt;

  if (this.y >= this.canvasHeight) {
    this.y = 0;
  } else if (this.falling && this.y < 0) {
    this.y = this.canvasHeight;
  }
};

Background.prototype.render = function() {
  this.context.drawImage(imageStore.background, this.x, this.y);
  this.context.drawImage(imageStore.background, this.x, this.y - this.canvasHeight);
};

Background.prototype.reset = function() {
  this.falling = false;
  this.panningSpeed = NORMAL_PAN_SPEED;
};

module.exports = Background;


/***/ },

/***/ "./lib/images.js"
/*!***********************!*\
  !*** ./lib/images.js ***!
  \***********************/
(module) {

var Images = function() {
  this.background = new Image();
  this.background.src = "./images/bg.png";

  this.leftsit = new Image();
  this.leftsit.src = "./images/leftsit.png";
  this.leftjump = new Image();
  this.leftjump.src = "./images/leftjump.png";

  this.rightsit = new Image();
  this.rightsit.src = "./images/rightsit.png";
  this.rightjump = new Image();
  this.rightjump.src = "./images/rightjump.png";

  this.apple = new Image();
  this.apple.src = "./images/apple.png";

  this.avacado = new Image();
  this.avacado.src = "./images/avacado.png";

  this.broc = new Image();
  this.broc.src = "./images/broc.png";

  this.pear = new Image();
  this.pear.src = "./images/pear.png";

  this.splash = new Image();
  this.splash.src = "./images/splash.png";

  this.sprite = function(options) {
    var that = {};
    that.width = options.width;
    that.height = options.height;
    that.image = options.image;
    that.render = function(ctx, pos) {
      ctx.drawImage(that.image, pos.x, pos.y, that.width, that.height);
    };
    return that;
  };

  this.fruits = [this.avacado, this.pear, this.broc, this.apple];
};

module.exports = new Images();


/***/ },

/***/ "./lib/player.js"
/*!***********************!*\
  !*** ./lib/player.js ***!
  \***********************/
(module, __unused_webpack_exports, __webpack_require__) {

var imageStore = __webpack_require__(/*! ./images.js */ "./lib/images.js");

var GRAVITY = 1000; // pixels/sec^2
var JUMP_VELOCITY = -550; // pixels per second (upward)
var SPRITE_SIZE = 80;
var SPRITE_HALF = SPRITE_SIZE / 2;

var PlayerModel = function(canvas, deathFunc) {
  this.canvas = canvas;
  this.playerRadius = 25;
  this.playerY = 0;
  this.playerX = (this.canvas.width - this.playerRadius) / 2;
  this.jumping = false;
  this.jumpVelocity = JUMP_VELOCITY;
  this.startedAscent = false;
  this.dead = false;
  this.deathFunc = deathFunc;
  this.direction = "right";

  this.moveListener = this.handleMove.bind(this);
  this.touchMoveListener = this.handleTouchMove.bind(this);
  this.jumpListener = this.handleJump.bind(this);

  this.canvas.addEventListener("mousemove", this.moveListener, false);
  this.canvas.addEventListener("touchmove", this.touchMoveListener, { passive: false });
  this.enableJump();

  this.leftsit = imageStore.sprite({
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
    image: imageStore.leftsit,
  });

  this.leftjump = imageStore.sprite({
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
    image: imageStore.leftjump,
  });

  this.rightsit = imageStore.sprite({
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
    image: imageStore.rightsit,
  });

  this.rightjump = imageStore.sprite({
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
    image: imageStore.rightjump,
  });
};

PlayerModel.prototype.getWorldCenterY = function() {
  return this.canvas.height - this.playerRadius + this.playerY;
};

PlayerModel.prototype.handleMove = function(e) {
  if (e.movementX > 0) {
    this.direction = "right";
  } else if (e.movementX < 0) {
    this.direction = "left";
  }
  this.playerX = e.pageX - this.canvas.offsetLeft - (this.playerRadius / 2);
};

PlayerModel.prototype.handleTouchMove = function(e) {
  e.preventDefault();
  var touch = e.touches[0];
  var newX = touch.pageX - this.canvas.offsetLeft - (this.playerRadius / 2);
  if (newX > this.playerX) {
    this.direction = "right";
  } else if (newX < this.playerX) {
    this.direction = "left";
  }
  this.playerX = newX;
};

PlayerModel.prototype.handleJump = function() {
  this.jumping = true;
  this.jumpVelocity = JUMP_VELOCITY;
};

PlayerModel.prototype.update = function(dt) {
  if (!this.jumping) return;

  this.disableJump();
  this.playerY += this.jumpVelocity * dt;
  this.jumpVelocity += GRAVITY * dt;

  if (this.playerY > 0) {
    if (this.startedAscent === false) {
      this.enableJump();
    } else {
      this.handleDeath();
    }
    this.jumping = false;
    this.playerY = 0;
    this.jumpVelocity = JUMP_VELOCITY;
  }
};

PlayerModel.prototype.handleDeath = function() {
  this.dead = true;
  window.setTimeout(this.deathFunc, 5000);
};

PlayerModel.prototype.enableJump = function() {
  this.canvas.addEventListener("mousedown", this.jumpListener, false);
  this.canvas.addEventListener("touchstart", this.jumpListener, false);
};

PlayerModel.prototype.disableJump = function() {
  this.canvas.removeEventListener("mousedown", this.jumpListener, false);
  this.canvas.removeEventListener("touchstart", this.jumpListener, false);
};

PlayerModel.prototype.render = function(ctx) {
  var centerY = this.getWorldCenterY();
  var pos = { x: this.playerX - SPRITE_HALF, y: centerY - SPRITE_HALF };

  if (this.direction === "left") {
    if (this.jumpVelocity > 100) {
      this.leftsit.render(ctx, pos);
    } else if (this.jumping) {
      this.leftjump.render(ctx, pos);
    } else {
      this.leftsit.render(ctx, pos);
    }
  } else {
    if (this.jumpVelocity > 100) {
      this.rightsit.render(ctx, pos);
    } else if (this.jumping) {
      this.rightjump.render(ctx, pos);
    } else {
      this.rightsit.render(ctx, pos);
    }
  }
};

module.exports = PlayerModel;


/***/ },

/***/ "./lib/sounds.js"
/*!***********************!*\
  !*** ./lib/sounds.js ***!
  \***********************/
(module) {

var Sounds = function() {
  this.chime = new Audio();
  this.chime.src = "./audio/chime.wav";
  this.music = new Audio();
  this.music.src = "./audio/music.wav";
  this.music.loop = true;
};

module.exports = new Sounds();


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**************************!*\
  !*** ./lib/ascension.js ***!
  \**************************/
var PlayerModel = __webpack_require__(/*! ./player.js */ "./lib/player.js");
var BellModel = __webpack_require__(/*! ./bell.js */ "./lib/bell.js");
var Background = __webpack_require__(/*! ./bg.js */ "./lib/bg.js");
var imageStore = __webpack_require__(/*! ./images.js */ "./lib/images.js");
var soundStore = __webpack_require__(/*! ./sounds.js */ "./lib/sounds.js");

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

})();

/******/ })()
;
//# sourceMappingURL=game.js.map