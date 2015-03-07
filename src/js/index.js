var Game = require('./game/game.js');

var game = new Game();

var html = document.getElementById('game');

html.appendChild(game.element);
