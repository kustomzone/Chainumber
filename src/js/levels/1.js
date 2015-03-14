var Game = require('../game/game.js');

function Level(name, state, restoreData) {
    Game.call(this, name, state, restoreData);
}

Level.prototype = Object.create(Game.prototype);
Level.prototype.constructor = Level;

module.exports = Level;
