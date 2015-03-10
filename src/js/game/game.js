var Field = require('./field.js');
var util = require('../util');

function Game(name, state) {
    this.name = name;
    this.state = state;
    this.config = config.levels[name];
    this.score = 0;
    this._isWin = Boolean(state.winLevels.indexOf(name) !== -1);

    this.field = new Field(this);

    this._createElement();
    this._bindEvents();
}

Game.prototype._createElement = function() {
    var element = document.createElement('div');
    element.className = 'game';

    var template =
        '<div class="game__header">' +
            '<div class="game__score">0</div>' +
            '<div class="game__chainSum"></div>' +
            '<div class="game__goal">{{goal}}</div>' +
        '</div>' +
        '<div class="game__body"></div>' +
        '<div class="game__footer">' +
            '<div class="game__backButton">Menu</div>' +
            '<div class="game__restartButton">Restart</div>' +
            '<div class="game__nextButton">Next</div>' +
        '</div>';

    element.innerHTML = template.replace('{{goal}}', this.config.goal);

    if (this._isWin) {
        util.addClass(element, '_win');
    }

    this.backButton = element.getElementsByClassName('game__backButton')[0];
    this.restartButton = element.getElementsByClassName('game__restartButton')[0];
    this.nextButton = element.getElementsByClassName('game__nextButton')[0];

    this.scoreElement = element.getElementsByClassName('game__score')[0];
    this.chainSumElement = element.getElementsByClassName('game__chainSum')[0];

    this.bodyElement = element.getElementsByClassName('game__body')[0];
    this.bodyElement.appendChild(this.field.element);

    this.element = element;
};

Game.prototype._bindEvents = function() {
    util.on(this.restartButton, 'click', this.restart.bind(this));
    util.on(this.backButton, 'click', this._backToMenu.bind(this));
    util.on(this.nextButton, 'click', this._nextLevel.bind(this));
};

Game.prototype._nextLevel = function() {
    this.state.nextFromLevel();
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

Game.prototype.updateChainSum = function(value) {
    if (value) {
        this.chainSumElement.innerHTML = value;
        util.addClass(this.chainSumElement, '_showed');
    } else {
        util.removeClass(this.chainSumElement, '_showed');
    }
};

Game.prototype.updateScore = function(value) {
    this.score += value;
    this.scoreElement.innerHTML = this.score;

    this._checkWin();
};

Game.prototype._checkWin = function() {
    if (!this._isWin && this.score >= this.config.winCondition.score) {
        this._isWin = true;
        this.state.levelWin(this.name);
        util.addClass(this.element, '_win');
    }
};

module.exports = Game;
