var Sounds = function() {
  this.chime = new Audio();
  this.chime.src = "./audio/chime.wav";
  this.music = new Audio();
  this.music.src = "./audio/music.wav";
  this.music.loop = true;
};

module.exports = new Sounds();
