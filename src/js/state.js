var MainMenu = require('./mainMenu/mainMenu');
var levelModules = require('./levelModules');
var analytics = require('./analytics.js');

var saves = require('./saves');
var util = require('./util');

function State() {
    this._activeElement = null;
    this._activeLevel = null;

    this.mainMenu = new MainMenu(this);

    this._createElement();
    this._checkActiveLevel();
}

State.prototype._checkActiveLevel = function() {
    var activeSavedLevel = saves.getActiveLevel();

    if (Object.keys(activeSavedLevel).length) {
        this._activeLevel = new levelModules[activeSavedLevel.name](activeSavedLevel.name, this, activeSavedLevel);
        this.activeLevelElement.appendChild(this._activeLevel.element);
        this.mainMenu.resumeLevelActive();
    }
};

State.prototype._createElement = function() {
    this.element = document.createElement('div');
    this.element.className = 'state';
    this.element.innerHTML =
        '<div class="state__mainMenu"></div>' +
        '<div class="state__activeLevel"></div>';

    this.mainMenuElement = this.element.getElementsByClassName('state__mainMenu')[0];
    this.mainMenuElement.appendChild(this.mainMenu.element);

    this.activeLevelElement = this.element.getElementsByClassName('state__activeLevel')[0];
};

State.prototype.saveActiveLevel = function() {
    if (this._activeLevel) {
        saves.setActiveLevel(this._activeLevel.getState());
    }
};

State.prototype._activate = function(element) {
    if (this._activeElement === element) { return; }

    if (this._activeElement) {
        util.removeClass(this._activeElement, '_showed');
    }

    util.addClass(element, '_showed');
    this._activeElement = element;
};/*

State.prototype.runLevelMenu = function() {
    this.levelMenu.update();
    this._activate(this.levelMenuElement);
};*/

State.prototype.runMainMenu = function() {
    this._activate(this.mainMenuElement);
};

State.prototype.runLevel = function(name) {
    if (this._activeLevel && this._activeLevel.name == name) { return this.resumeLevel(); }

    this.mainMenu.resumeLevelActive();

    var newLevel = new levelModules[name](name, this);

    if (this._activeLevel) {
        this.activeLevelElement.replaceChild(newLevel.element, this._activeLevel.element);
    } else {
        this.activeLevelElement.appendChild(newLevel.element);
    }

    this._activeLevel = newLevel;

    this._activate(this.activeLevelElement);

    analytics.levelStarted(this._activeLevel.name);
};

State.prototype.backFromLevel = function() {
    this.runMainMenu();
};

State.prototype.resumeLevel = function() {
    if (this._activeLevel) {
        this._activate(this.activeLevelElement);

        analytics.levelResumed(this._activeLevel.name);
    }
};

module.exports = State;