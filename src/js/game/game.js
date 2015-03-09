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

    var gameHeader = document.createElement('div');
    gameHeader.className = 'game__header';
    element.appendChild(gameHeader);

    var score = document.createElement('div');
    score.className = 'game__score';
    score.innerHTML = '0';
    gameHeader.appendChild(score);

    var chainSum = document.createElement('div');
    chainSum.className = 'game__chainSum';
    gameHeader.appendChild(chainSum);

    var goal = document.createElement('div');
    goal.className = 'game__goal';
    gameHeader.appendChild(goal);

    var gameBody = document.createElement('div');
    gameBody.className = 'game__body';
    goal.innerHTML = 'Goal: ' + this.config.goal;
    element.appendChild(gameBody);

    gameBody.appendChild(this.field.element);

    var gameFooter = document.createElement('div');
    gameFooter.className = 'game__footer';
    element.appendChild(gameFooter);

    var backButton = document.createElement('div');
    backButton.className = 'game__backButton';
    backButton.innerHTML = 'Menu';
    gameFooter.appendChild(backButton);

    var restartButton = document.createElement('div');
    restartButton.className = 'game__restartButton';
    restartButton.innerHTML = 'Restart';
    gameFooter.appendChild(restartButton);

    var nextButton = document.createElement('div');
    nextButton.className = 'game__nextButton';
    nextButton.innerHTML = 'Next';
    gameFooter.appendChild(nextButton);

    if (this._isWin) {
        util.addClass(element, '_win');
    }

    this.backButton = backButton;
    this.restartButton = restartButton;
    this.nextButton = nextButton;

    this.scoreElement = score;
    this.chainSumElement = chainSum;

    this.bodyElement = gameBody;
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
