var gameConfig = require('../gameConfig.js');
var util = require('../util.js');

function LevelMenu(state) {
    this.state = state;

    this._levelBlocks = {};

    this._createElement();
    this._bindEvents();
}

LevelMenu.prototype._createElement = function() {
    var self = this;

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
        var levelBlock = document.createElement('div');
        levelBlock.className = 'levelMenu__levelBlock _level_' + i % 2;
        levelBlock.innerHTML = name;

        util.on(levelBlock, 'click', function() {
            self.state.runLevel(name);
        });

        self._levelBlocks[name] = levelBlock;

        fragment.appendChild(levelBlock);
    });

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

LevelMenu.prototype.updateOpenLevels = function() {
    this.state.openLevels.forEach(function(name) {
        util.addClass(this._levelBlocks[name], '_open');
    }, this);
};

module.exports = LevelMenu;
