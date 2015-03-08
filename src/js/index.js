var Game = require('./game/game.js');
var util = require('./util.js');

if (!util.isMobile) {
    util.addClass(document.body, 'no-touch');
}

var game = new Game();

var html = document.getElementById('game');

html.appendChild(game.element);
