var util = require('../util.js');

function Menu(state) {
    this.state = state;
    this._isResumeActive = false;

    this._createElement();
    this._bindEvents();
}

Menu.prototype._createElement = function() {
    var element = document.createElement('div');
    element.className = 'mainMenu';
    element.innerHTML =
        '<div class="mainMenu__header">' +
            '<div class="mainMenu__title">Chainumber</div>' +
        '</div>' +
        '<div class="mainMenu__body">' +
            '<div class="mainMenu__newGame">New game</div>' +
            '<div class="mainMenu__resumeGame">Resume game</div>' +
        '</div>' +
        '<div class="mainMenu__footer">' +
            '<div class="mainMenu__version">v0.0.1</div>' +
        '</div>';

    this.element = element;
    this.newGameButton = element.getElementsByClassName('mainMenu__newGame')[0];
    this.resumeGameButton = element.getElementsByClassName('mainMenu__resumeGame')[0];
};

Menu.prototype._bindEvents = function() {
    util.on(this.newGameButton, 'click', function() {
        this.state.runLevelMenu();
    }.bind(this));

    util.on(this.resumeGameButton, 'click', function() {
        this.state.resumeLevel();
    }.bind(this));
};

Menu.prototype.resumeLevelActive = function() {
    if (this._isResumeActive) { return; }

    this._isResumeActive = true;
    util.addClass(this.element, '_activeLevel');
};

module.exports = Menu;
