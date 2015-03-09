var Field = require('./field.js');
var util = require('../util');

function Game(name, levelMenu) {
    this.name = name;
    this.levelMenu = levelMenu;
    this.config = config.levels[name];
    this.score = 0;

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

    var gameBody = document.createElement('div');
    gameBody.className = 'game__body';
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

    this.backButton = backButton;
    this.restartButton = restartButton;

    this.scoreElement = score;
    this.chainSumElement = chainSum;

    this.bodyElement = gameBody;
    this.element = element;
};

Game.prototype._bindEvents = function() {
    util.on(this.restartButton, 'click', this.restart.bind(this));
    util.on(this.backButton, 'click', this._backToMenu.bind(this));
};

Game.prototype.restart = function() {
    var newField = new Field(this);

    this.bodyElement.replaceChild(newField.element, this.field.element);

    this.score = 0;
    this.scoreElement.innerHTML = 0;

    this.field = newField;
};

Game.prototype._backToMenu = function() {
    this.levelMenu.show();
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
    if (this.score > this.config.winCondition.score) {
        this.win();
    }
};

Game.prototype.win = function() {
    this.levelMenu.levelWin(this.name);
};

module.exports = Game;
