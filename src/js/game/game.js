var Field = require('./field.js');
var util = require('../util');

function Game() {
    this.field = new Field(this);
    this.score = 0;

    this._createElement();
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

    element.appendChild(this.field.element);

    this.scoreElement = score;
    this.chainSumElement = chainSum;
    this.element = element;
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
};

module.exports = Game;
