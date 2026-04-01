var imageStore = require('./images.js');

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
