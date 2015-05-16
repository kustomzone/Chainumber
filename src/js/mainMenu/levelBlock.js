var levelStore = require('../levelStore');
var util = require('../util');

function LevelBlock(levelMenu, name, order) {
    this.levelMenu = levelMenu;
    this.name = name;

    this.store = levelStore.get(this.name);

    this.element = document.createElement('div');
    this.element.className = 'levelBlock _level_' + order % 3;

    var template =
        '<div class="levelBlock__score"></div>' +
        '<div class="levelBlock__text">{{name}}</div>' +
        '<div class="levelBlock__goal">' +
            '<div class="levelBlock__goalPoint"></div>' +
            '<div class="levelBlock__goalPoint"></div>' +
            '<div class="levelBlock__goalPoint"></div>' +
        '</div>';

    this.element.innerHTML = template.replace('{{name}}', name);

    this.scoreElement = this.element.getElementsByClassName('levelBlock__score')[0];
    this.goalElements = this.element.getElementsByClassName('levelBlock__goalPoint');

    this.isOpen = false;

    util.on(this.element, 'click', this._onClick.bind(this));
}

LevelBlock.prototype._onClick = function() {
    this.levelMenu.runLevel(this.name);
};

LevelBlock.prototype.update = function() {
    for (var i = 0; i < this.goalElements.length; i++) {
        if (i + 1 <= this.store.currentGoal) {
            util.addClass(this.goalElements[i], '_active');
        } else {
            util.removeClass(this.goalElements[i], '_active');
        }
    }

    this.scoreElement.innerHTML = 'Score: ' + this.store.maxScore;

    var newIsOpen = this.store.isOpen;

    if (this.isOpen !== newIsOpen) {
        util.addClass(this.element, '_open');
    }
};

module.exports = LevelBlock;
