var levelStore = require('../levelStore');
var gameConfig = require('../gameConfig');
var analytics = require('../analytics');
var Abilities = require('./abilities');
var Field = require('./field');
var saves = require('../saves');
var util = require('../util');

function Game(name, state, restoreData) {
    restoreData = restoreData || {};

    this.name = name;
    this.state = state;
    this.store = levelStore.get(name);

    this.score = restoreData.score || 0;

    this.field = new Field(this, restoreData.field);
    this.abilities = new Abilities(this, restoreData.abilities);

    this._createElement();
    this._bindEvents();
    this._checkFirst();
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
        '<div class="game__body">' +
            '<div class="game__message">' +
                '<div class="game__messageInner">' +
                    '<div class="game__messageText"></div>' +
                    '<div class="game__messageButtons">' +
                        '<div class="game__messageReturn">Continue</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="game__field"></div>' +
        '</div>' +
        '<div class="game__footer">' +
            '<div class="game__abilities"></div>' +
            '<div class="game__buttons">' +
                '<div class="game__backButton">Back</div>' +
                '<div class="game__restartButton">Restart</div>' +
            '</div>' +
        '</div>';

    element.innerHTML = template
        .replace('{{score}}', this.score)
        .replace('{{goal}}', this._getGoalText())
        .replace('{{name}}', this.name)
        .replace('{{maxScore}}', this.store.maxScore);

    this.backButton = element.getElementsByClassName('game__backButton')[0];
    this.restartButton = element.getElementsByClassName('game__restartButton')[0];

    this.abilitiesElement = element.getElementsByClassName('game__abilities')[0];
    this.abilitiesElement.appendChild(this.abilities.element);

    this.goalElement = element.getElementsByClassName('game__goal')[0];
    this.scoreElement = element.getElementsByClassName('game__score')[0];
    this.chainSumElement = element.getElementsByClassName('game__chainSum')[0];
    this.maxScoreElement = element.getElementsByClassName('game__maxScore')[0];

    this.messageElement = element.getElementsByClassName('game__message')[0];
    this.messageTextElement = element.getElementsByClassName('game__messageText')[0];
    this.messageReturnButton = element.getElementsByClassName('game__messageReturn')[0];

    this.fieldElement = element.getElementsByClassName('game__field')[0];
    this.fieldElement.appendChild(this.field.element);

    this.element = element;
};

Game.prototype._bindEvents = function() {
    util.on(this.restartButton, 'click', this.restart.bind(this));
    util.on(this.backButton, 'click', this._backToMenu.bind(this));
    util.on(this.messageReturnButton, 'click', this._hideMessage.bind(this));
};

Game.prototype._checkFirst = function() {
    if (saves.isFirstGame()) {
        this.showMessage(gameConfig.message.first);
    }
};

Game.prototype._getGoalText = function() {
    if (this.store.currentGoal <= 3) {
        return this.store.goals[this.store.currentGoal];
    }

    return '';
};

Game.prototype.restart = function() {
    this.score = 0;
    this.scoreElement.innerHTML = 0;

    var newField = new Field(this);
    this.fieldElement.replaceChild(newField.element, this.field.element);
    this.field = newField;

    var newAbilities = new Abilities(this);
    this.abilitiesElement.replaceChild(newAbilities.element, this.abilities.element);
    this.abilities = newAbilities;

    this.saveState();

    analytics.levelRestart(this.name);
};

Game.prototype._backToMenu = function() {
    this.state.backFromLevel();
};

Game.prototype.updateChainSum = function(value) {
    if (value === undefined) {
        util.removeClass(this.chainSumElement, '_showed');
        return;
    }

    this.chainSumElement.innerHTML = value;
    util.addClass(this.chainSumElement, '_showed');
};

Game.prototype.upScore = function(value) {
    this.score += Math.round(value);
    this.scoreElement.innerHTML = this.score;

    if (this.store.maxScore < this.score) {
        this.store.maxScore = this.score;
        this.maxScoreElement.innerHTML = 'Max score: ' + this.score;
        analytics.maxScoreUp(this.score);
    }

    this._checkGoal();

    this.abilities.checkUp();

    levelStore.saveLevels();
};

Game.prototype._checkGoal = function() {
    if (this.store.currentGoal == 3) { return; }

    var store = this.store;

    if (this.score >= store.winConditions[store.currentGoal]) {
        store.currentGoal = Math.min(store.currentGoal + 1, 3);

        if (store.currentGoal == 1) { this._win(); }

        this.goalElement.innerHTML = this._getGoalText();

        analytics.goalAchived(store.currentGoal);
    }
};

Game.prototype._win = function() {
    levelStore.checkOpenLevels();
};

Game.prototype.getState = function() {
    return {
        field: this.field.getState(),
        abilities: this.abilities.getState(),
        name: this.name,
        score: this.score
    };
};

Game.prototype.saveState = function() {
    this.state.saveActiveLevel();
};

Game.prototype.showMessage = function(text) {
    this.messageTextElement.innerHTML = text;
    util.addClass(this.messageElement, '_active');
};

Game.prototype._hideMessage = function() {
    util.removeClass(this.messageElement, '_active');
};

module.exports = Game;
