var abilityStore = require('../abilityStore.js');
var levelStore = require('../levelStore.js');
var Field = require('./field.js');
var util = require('../util');

function Game(name, state, restoreData) {
    restoreData = restoreData || {};

    this.name = name;
    this.state = state;
    this.store = levelStore.get(name);

    this.score = restoreData.score || 0;

    this._abilities = {};
    this.currentAbility = null;

    this.field = new Field(this, restoreData.field);

    this._createElement();
    this._bindEvents();
    this._initAbilities();
}

Game.prototype._createElement = function() {
    var element = document.createElement('div');
    element.className = 'game';

    var template =
        '<div class="game__header">' +
            '<div class="game__levelName">Level: {{name}}</div>' +
            '<div class="game__score">{{score}}</div>' +
            '<div class="game__chainSum"></div>' +
            '<div class="game__maxScore">Max score: {{maxScore}}</div>' +
            '<div class="game__goal">{{goal}}</div>' +
        '</div>' +
        '<div class="game__body"></div>' +
        '<div class="game__footer">' +
            '<div class="game__abilities"></div>' +
            '<div class="game__buttons">' +
                '<div class="game__backButton">Menu</div>' +
                '<div class="game__restartButton">Restart</div>' +
                '<div class="game__nextButton">Next</div>' +
            '</div>' +
        '</div>';

    element.innerHTML = template
        .replace('{{score}}', this.score)
        .replace('{{goal}}', this._getGoalText())
        .replace('{{name}}', this.name)
        .replace('{{maxScore}}', this.store.maxScore);

    if (this.store.currentGoal > 0) {
        util.addClass(element, '_win');
    }


    this.backButton = element.getElementsByClassName('game__backButton')[0];
    this.restartButton = element.getElementsByClassName('game__restartButton')[0];
    this.nextButton = element.getElementsByClassName('game__nextButton')[0];

    this.abilitiesElement = element.getElementsByClassName('game__abilities')[0];
    this.goalElement = element.getElementsByClassName('game__goal')[0];
    this.scoreElement = element.getElementsByClassName('game__score')[0];
    this.chainSumElement = element.getElementsByClassName('game__chainSum')[0];
    this.maxScoreElement = element.getElementsByClassName('game__maxScore')[0];

    this.bodyElement = element.getElementsByClassName('game__body')[0];
    this.bodyElement.appendChild(this.field.element);

    this.element = element;
};

Game.prototype._bindEvents = function() {
    util.on(this.restartButton, 'click', this.restart.bind(this));
    util.on(this.backButton, 'click', this._backToMenu.bind(this));
    util.on(this.nextButton, 'click', this._nextLevel.bind(this));
};

Game.prototype._initAbilities = function() {
    var availableAbilities = abilityStore.get();

    availableAbilities.forEach(function(ability) {
        ability.setGame(this);

        this.abilitiesElement.appendChild(ability.element);
        this._abilities[ability.name] = ability;
    }, this);


};

Game.prototype._getGoalText = function() {
    if (this.store.currentGoal <= 3) {
        return this.store.goals[this.store.currentGoal];
    }

    return '';
};

Game.prototype._nextLevel = function() {
    this.state.runLevelMenu();
};

Game.prototype.restart = function() {
    var newField = new Field(this);

    this.bodyElement.replaceChild(newField.element, this.field.element);

    this.score = 0;
    this.scoreElement.innerHTML = 0;

    this.field = newField;
};

Game.prototype._backToMenu = function() {
    this.state.backFromLevel();
};

Game.prototype.updateChainSum = function() {
    if (!this.field.selectedMode) {
        util.removeClass(this.chainSumElement, '_showed');
        return;
    }

    var field = this.field;

    var blockValue = field.blocks[field.selectedBlocks[0]].value || 0;
    this.chainSumElement.innerHTML = blockValue * field.selectedBlocks.length;
    util.addClass(this.chainSumElement, '_showed');
};

Game.prototype.updateScore = function() {
    var field = this.field;

    var blockValue = field.blocks[field.selectedBlocks[0]].value || 0;
    var k = 1 + 0.2 * (field.selectedBlocks.length - 3);
    this.score += Math.round(blockValue * field.selectedBlocks.length * k);
    this.scoreElement.innerHTML = this.score;

    if (this.store.maxScore < this.score) {
        this.store.maxScore = this.score;
        this.maxScoreElement.innerHTML = 'Max score: ' + this.score;
    }

    this._checkGoal();
};

Game.prototype._checkGoal = function() {
    if (this.store.currentGoal == 3) { return; }

    var store = this.store;

    if (this.score >= store.winConditions[store.currentGoal]) {
        store.currentGoal = Math.min(store.currentGoal + 1, 3);

        if (store.currentGoal == 1) { this._win(); }

        this.goalElement.innerHTML = this._getGoalText();
    }
};

Game.prototype._win = function() {
    util.addClass(this.element, '_win');
    levelStore.checkOpenLevels();
};

Game.prototype.getState = function() {
    return {
        field: this.field.getState(),
        name: this.name,
        score: this.score
    }
};

Game.prototype.runAbility = function(name) {
    if (this.currentAbility === null) {
        this._abilities[name].activate();
        this.currentAbility = name;
    }
};

Game.prototype.stopAbility = function(name) {
    if (this.currentAbility == name) {
        this._abilities[name].deactivate();
        this.currentAbility = null;
    }
};

module.exports = Game;
