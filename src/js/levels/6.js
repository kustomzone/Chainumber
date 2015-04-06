var Abilities = require('../game/abilities.js');
var levelStore = require('../levelStore.js');
var analytics = require('../analytics.js');
var Field = require('../game/field.js');
var Game = require('../game/game.js');

function LField(game, restoreData) {
    Field.call(this, game, restoreData);
}

LField.prototype = Object.create(Field.prototype);
LField.prototype.constructor = LField;

LField.prototype.checkPositions = function() {
    this._addNewBlocks();
};

function Level(name, state, restoreData) {
    restoreData = restoreData || {};

    this.name = name;
    this.state = state;
    this.store = levelStore.get(name);

    this.score = restoreData.score || 0;

    this.field = new LField(this, restoreData.field);
    this.abilities = new Abilities(this, restoreData.abilities);

    this._createElement();
    this._bindEvents();
}

Level.prototype = Object.create(Game.prototype);
Level.prototype.constructor = Level;

Level.prototype.restart = function() {
    this.score = 0;
    this.scoreElement.innerHTML = 0;

    var newField = new LField(this);
    this.fieldElement.replaceChild(newField.element, this.field.element);
    this.field = newField;

    var newAbilities = new Abilities(this);
    this.abilitiesElement.replaceChild(newAbilities.element, this.abilities.element);
    this.abilities = newAbilities;

    this.saveState();

    analytics.levelRestart(this.name);
};

module.exports = Level;
