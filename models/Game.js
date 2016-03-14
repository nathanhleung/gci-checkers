'use strict';

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const schema = new mongoose.Schema({
  accessCode: {
    type: String,
    unique: true,
  },
  gameData: String,
  turn: {
    type: String,
    default: 'red',
  },
});

const Game = mongoose.model('Game', schema);

module.exports = Game;
