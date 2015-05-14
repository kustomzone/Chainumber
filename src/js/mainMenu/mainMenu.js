var gameConfig = require('../gameConfig.js');
var levelStore = require('../levelStore.js');
var LevelBlock = require('./levelBlock');
var util = require('../util.js');

function Menu(state) {
    this.state = state;
    this._isResumeActive = false;
    this.levelBlocks = {};

    this._createElement();
    this._bindEvents();
    this.update();
}

Menu.prototype._createElement = function() {
    var element = document.createElement('div');
    element.className = 'mainMenu';
    element.innerHTML =
        '<div class="mainMenu__header">' +
            '<div class="mainMenu__title">Chainumber</div>' +
            '<div class="mainMenu__version">v0.0.1</div>' +
        '</div>' +
        '<div class="mainMenu__body">' +
            '<div class="mainMenu__progress">' +
                '<div class="mainMenu__progressBar"></div>' +
                '<div class="mainMenu__progressText"></div>' +
            '</div>' +
            '<div class="mainMenu__levelList"></div>' +
        '</div>' +
        '<div class="mainMenu__footer">' +
        '<div class="mainMenu__resumeGame">Resume</div>' +
        '</div>';

    var list = element.getElementsByClassName('mainMenu__levelList')[0];
    var fragment = document.createDocumentFragment();

    gameConfig.levels.forEach(function(name, i) {
        var level = new LevelBlock(this, name, i);

        this.levelBlocks[name] = level;

        fragment.appendChild(level.element);
    }, this);

    list.appendChild(fragment);

    this.element = element;
    this.resumeGameButton = element.getElementsByClassName('mainMenu__resumeGame')[0];
    this.progressBarElement = element.getElementsByClassName('mainMenu__progressBar')[0];
    this.progressTextElement = element.getElementsByClassName('mainMenu__progressText')[0];
};

Menu.prototype._bindEvents = function() {
    util.on(this.resumeGameButton, 'click', function() {
        this.state.resumeLevel();
    }.bind(this));
};

Menu.prototype.update = function() {
    util.forEach(this.levelBlocks, function(level) {
        level.update();
    }, this);

    this._updateProgress();
};

Menu.prototype._updateProgress = function() {
    var length = Object.keys(this.levelBlocks).length;
    var goalsCount = 3;
    var sum = 0;

    util.forEach(this.levelBlocks, function(level) {
        sum += level.store.currentGoal;
    });

    var progressValue = sum / (length * goalsCount);

    this.progressBarElement.style.width = Math.floor(progressValue * gameConfig.progressBar.width) + 'px';
    this.progressTextElement.innerHTML = Math.floor(progressValue * 100) + '%';
};

Menu.prototype.resumeLevelActive = function() {
    if (this._isResumeActive) { return; }

    this._isResumeActive = true;
    util.addClass(this.element, '_activeLevel');
};

Menu.prototype.runLevel = function(name) {
    if (levelStore.get(name).isOpen) {
        this.state.runLevel(name);
    }
};

module.exports = Menu;
