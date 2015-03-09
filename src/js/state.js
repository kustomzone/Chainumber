var LevelMenu = require('./levelMenu/levelMenu');
var MainMenu = require('./mainMenu/mainMenu');

var levelModules = require('./levelModules');
var gameConfig = require('./gameConfig.js');
var util = require('./util');

function State() {
    this._activeElement = null;
    this._activeLevel = null;
    this.winLevels = [];
    this.openLevels = [gameConfig.levels[0]];

    this.levelMenu = new LevelMenu(this);
    this.mainMenu = new MainMenu(this);

    this._createElement();

    this.levelMenu.updateOpenLevels();
}

State.prototype._createElement = function() {
    this.element = document.createElement('div');
    this.element.className = 'state';
    this.element.innerHTML =
        '<div class="state__mainMenu"></div>' +
        '<div class="state__levelMenu"></div>' +
        '<div class="state__activeLevel"></div>';

    this.mainMenuElement = this.element.getElementsByClassName('state__mainMenu')[0];
    this.mainMenuElement.appendChild(this.mainMenu.element);

    this.levelMenuElement = this.element.getElementsByClassName('state__levelMenu')[0];
    this.levelMenuElement.appendChild(this.levelMenu.element);

    this.activeLevelElement = this.element.getElementsByClassName('state__activeLevel')[0];
};

State.prototype._activate = function(element) {
    if (this._activeElement === element) { return; }

    if (this._activeElement) {
        util.removeClass(this._activeElement, '_showed');
    }

    util.addClass(element, '_showed');
    this._activeElement = element;
};

State.prototype.runLevelMenu = function() {
    this._activate(this.levelMenuElement);
};

State.prototype.runMainMenu = function() {
    this._activate(this.mainMenuElement);
};

State.prototype.runLevel = function(name) {
    var isOpen = this.openLevels.indexOf(name) !== -1;

    if (!isOpen) { return; }

    this.mainMenu.resumeLevelActive();

    var newLevel = new levelModules[name](name, this);

    if (this._activeLevel) {
        this.activeLevelElement.replaceChild(newLevel.element, this._activeLevel.element);
    } else {
        this.activeLevelElement.appendChild(newLevel.element);
    }

    this._activeLevel = newLevel;

    this._activate(this.activeLevelElement);
};

State.prototype.nextFromLevel = function() {
    var currentNameIndex = this.openLevels.indexOf(this._activeLevel.name);

    var nextLevelName = this.openLevels[currentNameIndex + 1];

    if (nextLevelName) {
        this.runLevel(nextLevelName);
    } else {
        this.runLevelMenu();
    }
};

State.prototype.levelWin = function(name) {
    this.winLevels.push(name);

    this._openNextLevel();
};

State.prototype._openNextLevel = function() {
    var nextLevelName = gameConfig.levels[this.openLevels.length];

    if (nextLevelName) {
        this.openLevels.push(nextLevelName);
    }

    this.levelMenu.updateOpenLevels();
};

State.prototype.backFromLevel = function() {
    this.runMainMenu();
};

State.prototype.resumeLevel = function() {
    if (this._activeLevel) {
        this._activate(this.activeLevelElement);
    }
};

module.exports = State;