var Game = require('./game/game.js');
var util = require('./util.js');

if (!util.isMobile) {
    util.addClass(document.body, 'no-touch');
}

var html = document.getElementById('game');

var game;

function createNewGame() {
    var newGame = new Game();

    if (game) {
        html.replaceChild(newGame.element, game.element);
    } else {
        html.appendChild(newGame.element);
    }

    game = newGame;
}

createNewGame();

var restartButton = document.createElement('div');
restartButton.className = 'restartButton';
restartButton.innerHTML = 'Restart';
util.on(restartButton, 'click', createNewGame);
html.appendChild(restartButton);

