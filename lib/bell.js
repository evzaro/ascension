var soundStore = require('./sounds.js');
var imageStore = require('./images.js');

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
