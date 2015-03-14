var gameConfig = require('../gameConfig.js');
var levelStore = require('../levelStore.js');
var util = require('../util.js');

function Level(levelMenu, name, order) {
    this.levelMenu = levelMenu;
    this.name = name;

    this.store = levelStore.get(this.name);

    this.element = document.createElement('div');
    this.element.className = 'levelMenu__levelBlock ' +
        '_level_' + order % 2;

    this.element.innerHTML = name;
    this.goal = null;

    this.isOpen = false;

    util.on(this.element, 'click', this._onClick.bind(this));
}

Level.prototype._onClick = function() {
    this.levelMenu.runLevel(this.name);
};

Level.prototype.update = function() {
    var newGoal = this.store.currentGoal;

    if (this.goal !== newGoal) {
        util.removeClass(this.element, '_goal_' + this.goal);
        util.addClass(this.element, '_goal_' + newGoal);
        this.goal = newGoal;
    }

    var newIsOpen = this.store.isOpen;

    if (this.isOpen !== newIsOpen) {
        util.addClass(this.element, '_open');
    }
};

function LevelMenu(state) {
    this.state = state;
    this.levels = {};

    this._createElement();
    this._bindEvents();
}

LevelMenu.prototype._createElement = function() {
    var element = document.createElement('div');
    element.className = 'levelMenu';

    var header = document.createElement('div');
    header.className = 'levelMenu__header';
    element.appendChild(header);

    var levels = document.createElement('div');
    levels.className = 'levelMenu__headerLevels';
    levels.innerHTML = 'Levels:';
    header.appendChild(levels);

    var body = document.createElement('div');
    body.className = 'levelMenu__body';
    element.appendChild(body);

    var fragment = document.createDocumentFragment();

    gameConfig.levels.forEach(function(name, i) {
        var level = new Level(this, name, i);

        this.levels[name] = level;

        fragment.appendChild(level.element);
    }, this);

    body.appendChild(fragment);

    var footer = document.createElement('div');
    footer.className = 'levelMenu__footer';
    element.appendChild(footer);

    var backButton = document.createElement('div');
    backButton.className = 'levelMenu__backButton';
    backButton.innerHTML = 'Back';
    footer.appendChild(backButton);

    this.backButton = backButton;
    this.element = element;
};

LevelMenu.prototype._bindEvents = function() {
    util.on(this.backButton, 'click', function() {
        this.state.runMainMenu();
    }.bind(this));
};

LevelMenu.prototype.update = function() {
    util.forEach(this.levels, function(level) {
        level.update();
    }, this);
};

LevelMenu.prototype.runLevel = function(name) {
    if (levelStore.get(name).isOpen) {
        this.state.runLevel(name);
    }
};

module.exports = LevelMenu;
