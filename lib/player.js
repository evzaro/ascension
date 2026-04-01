var imageStore = require('./images.js');

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
