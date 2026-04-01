var path = require('path');

module.exports = {
  mode: 'development',
  entry: './lib/ascension.js',
  output: {
    path: path.resolve(__dirname),
    filename: 'game.js'
  },
  devtool: 'source-map'
};
