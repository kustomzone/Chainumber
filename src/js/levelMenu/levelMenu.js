var gameConfig = require('../gameConfig.js');
var util = require('../util.js');

var levelModules = require('./levelModules.js');

function LevelMenu() {
    this._levelBlocks = {};

    this._activeLevel = null;

    this._createElement();
}

LevelMenu.prototype._createElement = function() {
    var self = this;

    var element = document.createElement('div');
    element.className = 'levelMenu';

    var container = document.createElement('div');
    container.className = 'levelMenu__container';
    element.appendChild(container);

    var header = document.createElement('div');
    header.className = 'levelMenu__header';
    container.appendChild(header);

    var levels = document.createElement('div');
    levels.className = 'levelMenu__headerLevels';
    levels.innerHTML = 'Levels:';
    header.appendChild(levels);

    var body  = document.createElement('div');
    body.className = 'levelMenu__body';
    container.appendChild(body);

    var fragment = document.createDocumentFragment();

    gameConfig.levels.forEach(function(name, i) {
        var levelBlock = document.createElement('div');
        levelBlock.className = 'levelMenu__levelBlock _level_' + i % 2;
        levelBlock.innerHTML = name;

        util.on(levelBlock, 'click', function() {
            self.levelActivate(name);
        });

        self._levelBlocks[name] = levelBlock;

        fragment.appendChild(levelBlock);
    });

    body.appendChild(fragment);

    var levelContainer = document.createElement('div');
    levelContainer.className = 'levelMenu__levelContainer';
    element.appendChild(levelContainer);

    this.container = container;
    this.levelContainer = levelContainer;
    this.element = element;
};

LevelMenu.prototype.levelWin = function(name) {
    console.log('levelWin', name);
};

LevelMenu.prototype.levelActivate = function(name) {
    var newLevel = new levelModules[name](name, this);

    if (this._activeLevel) {
        this.levelContainer.replaceChild(newLevel.element, this._activeLevel.element);
    } else {
        this.levelContainer.appendChild(newLevel.element);
    }

    this._activeLevel = newLevel;

    util.addClass(this.container, '_hidden');
    util.removeClass(this.levelContainer, '_hidden');
};

LevelMenu.prototype.show = function() {
    util.removeClass(this.container, '_hidden');
    util.addClass(this.levelContainer, '_hidden');
};

module.exports = LevelMenu;
