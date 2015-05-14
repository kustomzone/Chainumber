var levelStore = require('../levelStore.js');
var util = require('../util.js');

function LevelBlock(levelMenu, name, order) {
    this.levelMenu = levelMenu;
    this.name = name;

    this.store = levelStore.get(this.name);

    this.element = document.createElement('div');
    this.element.className = 'levelBlock _level_' + order % 3;

    var template =
        '<div class="levelBlock__score"></div>' +
        '<div class="levelBlock__text">{{name}}</div>' +
        '<div class="levelBlock__goal"></div>';

    this.element.innerHTML = template.replace('{{name}}', name);

    this.scoreElement = this.element.getElementsByClassName('levelBlock__score')[0];
    this.goalElement = this.element.getElementsByClassName('levelBlock__goal')[0];

    this.isOpen = false;

    util.on(this.element, 'click', this._onClick.bind(this));
}

LevelBlock.prototype._onClick = function() {
    this.levelMenu.runLevel(this.name);
};

LevelBlock.prototype.update = function() {
    this.goalElement.innerHTML = 'Goals: ' + this.store.currentGoal + ' / 3';
    this.scoreElement.innerHTML = 'Score: ' + this.store.maxScore;

    var newIsOpen = this.store.isOpen;

    if (this.isOpen !== newIsOpen) {
        util.addClass(this.element, '_open');
    }
};

module.exports = LevelBlock;
