var gameConfig = require('../gameConfig.js');
var levelStore = require('../levelStore.js');
var util = require('../util.js');

function Level(levelMenu, name, order) {
    this.levelMenu = levelMenu;
    this.name = name;

    this.store = levelStore.get(this.name);

    this.element = document.createElement('div');
    this.element.className = 'levelMenu__levelBlock ' +
        '_level_' + order % 3;

    var template =
        '<div class="levelMenu__levelBlockGoalState"></div>' +
        '<div class="levelMenu__levelBlockText">{{name}}</div>';

    this.element.innerHTML = template.replace('{{name}}', name);
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
    this._updateProgress();
}

LevelMenu.prototype._createElement = function() {
    var element = document.createElement('div');
    element.className = 'levelMenu';
    element.innerHTML =
        '<div class="levelMenu__header">' +
            '<div class="levelMenu__headerLevels">Levels:</div>' +
        '</div>' +
        '<div class="levelMenu__body">' +
            '<div class="levelMenu__progress">' +
                '<div class="levelMenu__progressBar"></div>' +
                '<div class="levelMenu__progressText"></div>' +
            '</div>' +
            '<div class="levelMenu__levelList"></div>' +
        '</div>' +
        '<div class="levelMenu__footer">' +
            '<div class="levelMenu__backButton">Back</div>' +
        '</div>';

    var list = element.getElementsByClassName('levelMenu__levelList')[0];
    var fragment = document.createDocumentFragment();

    gameConfig.levels.forEach(function(name, i) {
        var level = new Level(this, name, i);

        this.levels[name] = level;

        fragment.appendChild(level.element);
    }, this);

    list.appendChild(fragment);

    this.backButton = element.getElementsByClassName('levelMenu__backButton')[0];
    this.progressBarElement = element.getElementsByClassName('levelMenu__progressBar')[0];
    this.progressTextElement = element.getElementsByClassName('levelMenu__progressText')[0];
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

    this._updateProgress();
};

LevelMenu.prototype.runLevel = function(name) {
    if (levelStore.get(name).isOpen) {
        this.state.runLevel(name);
    }
};

LevelMenu.prototype._updateProgress = function() {
    var length = Object.keys(this.levels).length;
    var goalsCount = 3;
    var sum = 0;

    util.forEach(this.levels, function(level) {
        sum += level.store.currentGoal;
    });

    var progressValue = sum / (length * goalsCount);

    this.progressBarElement.style.width = Math.floor(progressValue * gameConfig.progressBar.width) + 'px';
    this.progressTextElement.innerHTML = Math.floor(progressValue * 100) + '%';
};

module.exports = LevelMenu;
