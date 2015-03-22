var abilityModules = require('../abilityModules.js');
var util = require('../util.js');

function Abilities(game, restoreData) {
    restoreData = restoreData || {};

    this.game = game;
    this.config = game.store;

    this.element = null;
    this.isEnable = false;
    this._lastUpAbilityScore = 0;
    this._abilities = {};
    this.currentAbility = null;

    this._initElements();
    this._restoreData(restoreData);
}

Abilities.prototype._initElements = function() {
    var element = document.createElement('div');
    element.className = 'abilities';

    if (this.config.ability) {
        util.forEach(this.config.ability, function(options, name) {
            var ability = new abilityModules[name](name, options, this);

            this._abilities[name] = ability;

            element.appendChild(ability.element);
        }, this);

        this.isEnable = true;
    }

    this.element = element;
};

Abilities.prototype._restoreData = function(data) {
    if (data.list) {
        util.forEach(data.list, function(abilityData, name) {
            this._abilities[name].count = abilityData.count || 0;
            this._abilities[name].updateCount();
        }, this);
    }
};

Abilities.prototype.checkUp = function() {
    if (!this.isEnable) { return; }

    if (this.game.score - this._lastUpAbilityScore < this.config.abilityPerScore) { return; }

    var numberUp = Math.floor((this.game.score - this._lastUpAbilityScore) / this.config.abilityPerScore);

    var randomAbilityName, randomAbility;

    var randomArray = [];

    util.forEach(this.config.ability, function(el, name) {
        randomArray.push([name, el.ratio]);
    });

    for (var i = 0; i < numberUp; i++) {
        randomAbilityName = util.random(randomArray);
        randomAbility = this._abilities[randomAbilityName];
        randomAbility.count++;
        randomAbility.updateCount();
    }

    this._lastUpAbilityScore = this.game.score;

    this.game.saveState();
};

Abilities.prototype.runAbility = function(name) {
    if (this.currentAbility) {
        this._abilities[this.currentAbility].deactivate();
    }

    this._abilities[name].activate();
    this.currentAbility = name;
};

Abilities.prototype.stopAbility = function(name) {
    if (this.currentAbility == name) {
        this._abilities[name].deactivate();
        this.currentAbility = null;
    }
};

Abilities.prototype.getState = function() {
    var state = {};
    state.list = {};

    util.forEach(this._abilities, function(ability, name) {
        state.list[name] = {
            count: ability.count
        };
    });

    return state;
};

module.exports = Abilities;
