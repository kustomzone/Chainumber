(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var State = require('./state.js');
var util = require('./util.js');

if (!util.isMobile) {
    util.addClass(document.body, 'no-touch');
}

var html = document.getElementById('game');

var state = new State();

html.appendChild(state.element);

state.runMainMenu();

},{"./state.js":12,"./util.js":13}],2:[function(require,module,exports){
var colors = require('./colors.js');
var util = require('../util.js');

var primeNumbers = [1, 2, 3, 5, 7, 11, 13];

var idCounter = 0;

// cashe of colors, value -> rgb(..,..,..)
var colorsCache = {};

function Block(x, y, field) {
    this.id = ++idCounter;

    this.field = field;
    this.config = field.config;

    this.x = x;
    this.y = y;

    this.value = null;
    this.element = null;

    this.width = 500 / this.config.field.size[0];
    this.height = 500 / this.config.field.size[1];

    this._setRandomValue();
    this._createElement();
    this._bindEvents();
}

Block.prototype._createElement = function() {
    var element = document.createElement('div');
    element.className = 'block';

    element.style.left = Math.floor(this.x * this.width) + 'px';
    element.style.bottom = Math.floor(this.y * this.height) + 'px';

    var inner = document.createElement('div');
    inner.className = 'block__inner';
    element.appendChild(inner);

    var active = document.createElement('div');
    active.className = 'block__active';
    element.appendChild(active);

    var text = document.createElement('div');
    text.className = 'block__text';
    text.innerHTML = this.value;
    inner.appendChild(text);

    this.innerElement = inner;
    this.textElement = text;
    this.activeElement = active;
    this.element = element;

    this._updateColors();
};

Block.prototype._setRandomValue = function() {
    var summRation = 0;
    var possibleValues = this.config.numbers.possibleValues;

    possibleValues.forEach(function(el) {
        summRation += el[1];
    });

    var summ = 0;

    var chanceArray = possibleValues.map(function(el) {
        var val = el[1] / summRation + summ;

        summ = val;

        return val;
    });

    var roll = Math.random();

    var value = 0;

    for (var i = 0; i < chanceArray.length; i++) {
        if (roll <= chanceArray[i]) {
            value = possibleValues[i][0];
            break;
        }
    }

    this.value = value;
};

Block.prototype._bindEvents = function() {
    if (util.isMobile) {
        util.on(this.element, 'touchstart', this._mouseDownHandler.bind(this));
    } else {
        util.on(this.element, 'mousedown', this._mouseDownHandler.bind(this));
        util.on(this.activeElement, 'mouseover', this._mouseOverHandler.bind(this));
        //util.on(this.activeElement, 'mouseout', this._mouseOutHandler.bind(this));
    }
};

Block.prototype._mouseDownHandler = function(ev) {
    ev.preventDefault();

    this.field.blockMouseDown(this.id);
};


Block.prototype._mouseOverHandler = function() {
    this.field.blockMouseOver(this.id);
};


Block.prototype._mouseOutHandler = function() {
    this.field.blockMouseOut(this.id);
};

Block.prototype.changePosition = function(x, y) {
    this.x = x;
    this.y = y;

    this.element.style.left = Math.floor(x * this.width) + 'px';
    this.element.style.bottom = Math.floor(y * this.height) + 'px';
};

Block.prototype._updateColors = function() {
    if (!colorsCache[this.value]) {
        // 7 -> 3 (primeNumber -> ratio)
        var primeArray = [];
        var i;

        for (i = primeNumbers.length - 1; i > 0; i--) {
            if (this.value % primeNumbers[i] === 0) {
                primeArray.push({
                    value: primeNumbers[i],
                    rgb: colors[i].rgb,
                    ratio: this.value / primeNumbers[i]
                });
            }
        }

        var color;

        if (primeArray.length) {
            color = util.rgbSum(primeArray);
        } else {
            color = colors[0].rgb;
        }

        colorsCache[this.value] = 'rgb(' + color.join(',') + ')';
    }

    this.innerElement.style.backgroundColor = colorsCache[this.value];
};

Block.prototype.changeValue = function(value) {
    this.value = value;
    this.textElement.innerHTML = value;

    this._updateColors();
};

Block.prototype.select = function() {
    util.addClass(this.element, '_selected');
};

Block.prototype.unselect = function() {
    util.removeClass(this.element, '_selected');
};

Block.prototype.animateCreate = function() {
    var self = this;

    util.addClass(this.element, '_blink');

    setTimeout(function() {
        util.removeClass(self.element, '_blink');
    }, 0);
};

module.exports = Block;

},{"../util.js":13,"./colors.js":3}],3:[function(require,module,exports){
module.exports = [
    {
        web: '#99b433',
        rgb: [154, 180, 51]
    }, {
        web: '#DA532C',
        rgb: [218, 83, 44]
    }, {
        web: '#1e7145',
        rgb: [30, 113, 69]
    }, {
        web: '#2C89A0',
        rgb: [44, 137, 160]
    }, {
        web: '#00AA88',
        rgb: [0, 170, 136]
    }, {
        web: '#00d455',
        rgb: [0, 212, 85]
    }, {
        web: '#ff2a2a',
        rgb: [255, 42, 42]
    }, {
        web: '#CB5000',
        rgb: [203, 80, 0]
    }
];

},{}],4:[function(require,module,exports){
var Block = require('./block.js');
var util = require('../util');
var gameConfig = require('../gameConfig');

function Field(game) {
    this.game = game;
    this.config = game.config;

    this.blocks = {};
    this._blocksXY = {};
    this.size = this.config.field.size;

    this.selectedBlocks = [];
    this.selectedMode = false;

    this.element = null;

    this._init();
    this._createElement();
    this._bindEvents();
}

Field.prototype._init = function() {
    for (var i = 0; i < this.size[0]; i++) {
        this._blocksXY[i] = {};

        for (var j = 0; j < this.size[1]; j++) {
            this.createBlock(i, j, true);
        }
    }
};

Field.prototype.createBlock = function(x, y, isInit) {
    var block = new Block(x, y, this);

    this.blocks[block.id] = block;

    this._blocksXY[x][y] = block.id;

    if (!isInit) {
        this.element.appendChild(block.element);
        block.animateCreate();
    }
};

Field.prototype._createElement = function() {
    var fragment = document.createDocumentFragment();

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'field__canvas';

    this.ctx = this.canvas.getContext('2d');

    this.canvas.width = gameConfig.field.width;
    this.canvas.height = gameConfig.field.height;
    fragment.appendChild(this.canvas);

    util.forEach(this.blocks, function(bl) {
        fragment.appendChild(bl.element);
    });

    this.element = document.createElement('div');
    this.element.className = 'field' +
        ' _width_' + this.size[0] +
        ' _height_' + this.size[1];

    this.element.appendChild(fragment);
};

Field.prototype._bindEvents = function() {
    if (util.isMobile) {
        util.on(document.body, 'touchend', this._mouseUpHandler.bind(this));
        util.on(document.body, 'touchmove', this._touchMoveHandler.bind(this));
    } else {
        util.on(document.body, 'mouseup', this._mouseUpHandler.bind(this));
    }
};

Field.prototype._touchMoveHandler = function(ev) {
    var isBreak, block, keys,touch, target, i, j;
    var blocks = this.blocks;

    for (i = 0; i < ev.changedTouches.length; i++) {
        touch = ev.changedTouches[i];
        target = document.elementFromPoint(touch.clientX, touch.clientY);

        if (!target || target.className.indexOf('block__active') == -1) { continue; }

        // делаем for, а не forEach, чтобы можно было стопнуть
        keys = Object.keys(blocks);

        for (j = 0; j < keys.length; j++) {
            block = blocks[keys[j]];

            if (block.activeElement === target) {
                this.blockMouseOver(block.id);
                isBreak = true;
                break;
            }
        }

        if (isBreak) {
            break;
        }
    }
};

Field.prototype._mouseUpHandler = function() {
    if (!this.selectedMode) { return; }

    this.selectedMode = false;

    this._runSelected();

    util.forEach(this.blocks, function(block) {
        block.unselect();
    });

    this.game.updateChainSum();

    this._clearPath();
};

Field.prototype.blockMouseDown = function(id) {
    this.selectedMode = true;
    this.selectedBlocks = [id];

    this.blocks[id].select();

    this.game.updateChainSum();
};

Field.prototype._checkWithLast = function(id) {
    var lastBl = this.blocks[this.selectedBlocks[this.selectedBlocks.length - 1]];
    var newBl = this.blocks[id];

    return lastBl.value == newBl.value &&
        Math.abs(lastBl.x - newBl.x) <= 1 &&
        Math.abs(lastBl.y - newBl.y) <= 1;
};

Field.prototype.blockMouseOver = function(id) {
    if (!this.selectedMode) { return; }

    var selBlocks = this.selectedBlocks;

    if (selBlocks.indexOf(id) == -1) {
        if (this._checkWithLast(id)) {
            selBlocks.push(id);
            this.blocks[id].select();

            this.game.updateChainSum();
            this._updatePath();
        }
    } else {
        if (selBlocks[selBlocks.length - 2] == id) {
            var lastBlId = selBlocks.pop();
            this.blocks[lastBlId].unselect();

            this.game.updateChainSum();
            this._updatePath();
        }
    }
};

Field.prototype._updatePath = function() {
    var ctx = this.ctx;
    var fieldHeight = gameConfig.field.height;

    this._clearPath();

    ctx.beginPath();

    ctx.strokeStyle = gameConfig.path.color;
    ctx.lineWidth = gameConfig.path.width;

    this.selectedBlocks.forEach(function(id, i) {
        var block = this.blocks[id];
        var x = (block.x + 0.5) * block.width;
        var y = fieldHeight - (block.y + 0.5) * block.height;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }, this);

    ctx.stroke();
};

Field.prototype._clearPath = function() {
    this.ctx.clearRect(0, 0, gameConfig.field.width, gameConfig.field.height);
};

Field.prototype.blockMouseOut = function(id) {

};

Field.prototype._blockRemove = function(id) {
    var block = this.blocks[id];

    this.element.removeChild(block.element);

    this._blocksXY[block.x][block.y] = null;
    delete this.blocks[id];
};

Field.prototype._runSelected = function() {
    if (this.selectedBlocks.length < this.config.chain.minLength) { return; }

    this.game.updateScore();

    var lastBlId = this.selectedBlocks.pop();
    var lastBl = this.blocks[lastBlId];
    var value = lastBl.value * (this.selectedBlocks.length + 1); // +1 because pop above

    lastBl.changeValue(value);

    this.selectedBlocks.forEach(this._blockRemove, this);

    this._checkPositions();
};

Field.prototype._checkPositions = function() {
    var self = this;

    var blocksXY = this._blocksXY;
    var blocks = this.blocks;

    util.forEach(blocksXY, function(blocksY) {
        var arr = [];

        // добавляем в массив существующие вертикальные элементы
        util.forEach(blocksY, function(id) {
            if (id) { arr.push(id); }
        });

        // если полный или пустой
        if (arr.length == self.size[1] || !arr) { return; }

        // сортируем
        arr.sort(function(a, b) {
            return blocks[a].y > blocks[b].y;
        });

        // сдвигаем отсортированный список к низу
        arr.forEach(function(id, y) {
            var block = blocks[id];

            if (block.y != y) {
                blocksY[block.y] = null;

                block.changePosition(block.x, y);

                blocksY[y] = id;
            }
        });
    });

    this._addNewBlocks();
};

Field.prototype._addNewBlocks = function() {
    var blocksXY = this._blocksXY;

    for (var i = 0; i < this.size[0]; i++) {
        for (var j = 0; j < this.size[1]; j++) {
            if (!blocksXY[i][j]) {
                this.createBlock(i, j);
            }
        }
    }
};

module.exports = Field;

},{"../gameConfig":6,"../util":13,"./block.js":2}],5:[function(require,module,exports){
var Field = require('./field.js');
var util = require('../util');

function Game(name, state) {
    this.name = name;
    this.state = state;
    this.config = config.levels[name];
    this.score = 0;
    this._isWin = Boolean(state.winLevels.indexOf(name) !== -1);

    this.field = new Field(this);

    this._createElement();
    this._bindEvents();
}

Game.prototype._createElement = function() {
    var element = document.createElement('div');
    element.className = 'game';

    var template =
        '<div class="game__header">' +
            '<div class="game__score">0</div>' +
            '<div class="game__chainSum"></div>' +
            '<div class="game__goal">{{goal}}</div>' +
        '</div>' +
        '<div class="game__body"></div>' +
        '<div class="game__footer">' +
            '<div class="game__backButton">Menu</div>' +
            '<div class="game__restartButton">Restart</div>' +
            '<div class="game__nextButton">Next</div>' +
        '</div>';

    element.innerHTML = template.replace('{{goal}}', this.config.goal);

    if (this._isWin) {
        util.addClass(element, '_win');
    }

    this.backButton = element.getElementsByClassName('game__backButton')[0];
    this.restartButton = element.getElementsByClassName('game__restartButton')[0];
    this.nextButton = element.getElementsByClassName('game__nextButton')[0];

    this.scoreElement = element.getElementsByClassName('game__score')[0];
    this.chainSumElement = element.getElementsByClassName('game__chainSum')[0];

    this.bodyElement = element.getElementsByClassName('game__body')[0];
    this.bodyElement.appendChild(this.field.element);

    this.element = element;
};

Game.prototype._bindEvents = function() {
    util.on(this.restartButton, 'click', this.restart.bind(this));
    util.on(this.backButton, 'click', this._backToMenu.bind(this));
    util.on(this.nextButton, 'click', this._nextLevel.bind(this));
};

Game.prototype._nextLevel = function() {
    this.state.nextFromLevel();
};

Game.prototype.restart = function() {
    var newField = new Field(this);

    this.bodyElement.replaceChild(newField.element, this.field.element);

    this.score = 0;
    this.scoreElement.innerHTML = 0;

    this.field = newField;
};

Game.prototype._backToMenu = function() {
    this.state.backFromLevel();
};

Game.prototype.updateChainSum = function() {
    if (!this.field.selectedMode) {
        util.removeClass(this.chainSumElement, '_showed');
        return;
    }

    var field = this.field;

    var blockValue = field.blocks[field.selectedBlocks[0]].value || 0;
    this.chainSumElement.innerHTML = blockValue * field.selectedBlocks.length;
    util.addClass(this.chainSumElement, '_showed');
};

Game.prototype.updateScore = function() {
    var field = this.field;

    var blockValue = field.blocks[field.selectedBlocks[0]].value || 0;
    var k = 1 + 0.2 * (field.selectedBlocks.length - 3);
    this.score += Math.round(blockValue * field.selectedBlocks.length * k);
    this.scoreElement.innerHTML = this.score;

    this._checkWin();
};

Game.prototype._checkWin = function() {
    if (!this._isWin && this.score >= this.config.winCondition.score) {
        this._isWin = true;
        this.state.levelWin(this.name);
        util.addClass(this.element, '_win');
    }
};

module.exports = Game;

},{"../util":13,"./field.js":4}],6:[function(require,module,exports){
module.exports = {
    field: {
        width: 500,
        height: 500
    },
    path: {
        color: 'rgba(255, 255, 255, 0.25)',
        width: 10
    },
    openLevelsLength: 7,
    levels: [1, 2, 3, 4, 5, 6, 7, 8]
};

},{}],7:[function(require,module,exports){
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

    var body = document.createElement('div');
    body.className = 'levelMenu__body';
    container.appendChild(body);

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
    container.appendChild(footer);

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

},{"../gameConfig.js":6,"../util.js":13}],8:[function(require,module,exports){
module.exports = {
    1: require('./levels/1'),
    2: require('./levels/2'),
    3: require('./levels/2'),
    4: require('./levels/2'),
    5: require('./levels/2'),
    6: require('./levels/2'),
    7: require('./levels/2'),
    8: require('./levels/2')
};

},{"./levels/1":9,"./levels/2":10}],9:[function(require,module,exports){
var Game = require('../game/game.js');

function Level(name, levelMenu) {
    Game.call(this, name, levelMenu);
}

Level.prototype = Object.create(Game.prototype);
Level.prototype.constructor = Level;

module.exports = Level;

},{"../game/game.js":5}],10:[function(require,module,exports){
var Game = require('../game/game.js');

module.exports = Game;

},{"../game/game.js":5}],11:[function(require,module,exports){
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

},{"../util.js":13}],12:[function(require,module,exports){
var LevelMenu = require('./levelMenu/levelMenu');
var MainMenu = require('./mainMenu/mainMenu');

var levelModules = require('./levelModules');
var gameConfig = require('./gameConfig.js');
var util = require('./util');

function State() {
    this._activeElement = null;
    this._activeLevel = null;
    this.winLevels = [];

    this.openLevels = gameConfig.levels.slice(0, gameConfig.openLevelsLength);

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
},{"./gameConfig.js":6,"./levelMenu/levelMenu":7,"./levelModules":8,"./mainMenu/mainMenu":11,"./util":13}],13:[function(require,module,exports){
var util = {};

util.addClass = function(el, name) {
    var classNames = el.className.split(' ');
    var index = classNames.indexOf(name);

    if (index === -1) {
        classNames.push(name);
        el.className = classNames.join(' ');
    }

    return el;
};

util.removeClass = function(el, name) {
    var classNames = el.className.split(' ');
    var index = classNames.indexOf(name);

    if (index !== -1) {
        classNames.splice(index, 1);
        el.className = classNames.join(' ');
    }

    return el;
};

util.hasClass = function(el, name) {
    var classNames = el.className.split(' ');

    return classNames.indexOf(name) != -1;
};

util.forEach = function(obj, iterator, context) {
    if (obj.length) {
        obj.forEach(iterator, context);
    } else {
        Object.keys(obj).forEach(function(key) {
            iterator.call(context, obj[key], key);
        });
    }
};

util.on = function(node, type, callback) {
    node.addEventListener(type, callback);
};

util.off = function(node, type, callback) {
    node.removeEventListener(type, callback);
};


// Seem legit
var isMobile = ('DeviceOrientationEvent' in window || 'orientation' in window);
// But with my Chrome on windows, DeviceOrientationEvent == fct()
if (/Windows NT|Macintosh|Mac OS X|Linux/i.test(navigator.userAgent)) isMobile = false;
// My android have "linux" too
if (/Mobile/i.test(navigator.userAgent)) isMobile = true;

util.isMobile = isMobile;

util.rgbSum = function(arr) {
    //[{rgb, ratio}, ...]

    var sum = [0, 0, 0];
    var n = 0;
    var el, i, j;

    for (i = 0; i < arr.length; i++) {
        el = arr[i];

        for (j = 0; j < 3; j++) {
            sum[j] += el.rgb[j] * el.ratio;
        }

        n += el.ratio;
    }

    for (j = 0; j < 3; j++) {
        sum[j] = Math.floor(sum[j] / n);
    }

    return sum;
};

util.nullFn = function() {};

module.exports = util;

},{}]},{},[1])


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvaW5kZXguanMiLCJzcmMvanMvZ2FtZS9ibG9jay5qcyIsInNyYy9qcy9nYW1lL2NvbG9ycy5qcyIsInNyYy9qcy9nYW1lL2ZpZWxkLmpzIiwic3JjL2pzL2dhbWUvZ2FtZS5qcyIsInNyYy9qcy9nYW1lQ29uZmlnLmpzIiwic3JjL2pzL2xldmVsTWVudS9sZXZlbE1lbnUuanMiLCJzcmMvanMvbGV2ZWxNb2R1bGVzLmpzIiwic3JjL2pzL2xldmVscy8xLmpzIiwic3JjL2pzL2xldmVscy8yLmpzIiwic3JjL2pzL21haW5NZW51L21haW5NZW51LmpzIiwic3JjL2pzL3N0YXRlLmpzIiwic3JjL2pzL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgU3RhdGUgPSByZXF1aXJlKCcuL3N0YXRlLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG5pZiAoIXV0aWwuaXNNb2JpbGUpIHtcbiAgICB1dGlsLmFkZENsYXNzKGRvY3VtZW50LmJvZHksICduby10b3VjaCcpO1xufVxuXG52YXIgaHRtbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdnYW1lJyk7XG5cbnZhciBzdGF0ZSA9IG5ldyBTdGF0ZSgpO1xuXG5odG1sLmFwcGVuZENoaWxkKHN0YXRlLmVsZW1lbnQpO1xuXG5zdGF0ZS5ydW5NYWluTWVudSgpO1xuIiwidmFyIGNvbG9ycyA9IHJlcXVpcmUoJy4vY29sb3JzLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcblxudmFyIHByaW1lTnVtYmVycyA9IFsxLCAyLCAzLCA1LCA3LCAxMSwgMTNdO1xuXG52YXIgaWRDb3VudGVyID0gMDtcblxuLy8gY2FzaGUgb2YgY29sb3JzLCB2YWx1ZSAtPiByZ2IoLi4sLi4sLi4pXG52YXIgY29sb3JzQ2FjaGUgPSB7fTtcblxuZnVuY3Rpb24gQmxvY2soeCwgeSwgZmllbGQpIHtcbiAgICB0aGlzLmlkID0gKytpZENvdW50ZXI7XG5cbiAgICB0aGlzLmZpZWxkID0gZmllbGQ7XG4gICAgdGhpcy5jb25maWcgPSBmaWVsZC5jb25maWc7XG5cbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG5cbiAgICB0aGlzLnZhbHVlID0gbnVsbDtcbiAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuXG4gICAgdGhpcy53aWR0aCA9IDUwMCAvIHRoaXMuY29uZmlnLmZpZWxkLnNpemVbMF07XG4gICAgdGhpcy5oZWlnaHQgPSA1MDAgLyB0aGlzLmNvbmZpZy5maWVsZC5zaXplWzFdO1xuXG4gICAgdGhpcy5fc2V0UmFuZG9tVmFsdWUoKTtcbiAgICB0aGlzLl9jcmVhdGVFbGVtZW50KCk7XG4gICAgdGhpcy5fYmluZEV2ZW50cygpO1xufVxuXG5CbG9jay5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2Jsb2NrJztcblxuICAgIGVsZW1lbnQuc3R5bGUubGVmdCA9IE1hdGguZmxvb3IodGhpcy54ICogdGhpcy53aWR0aCkgKyAncHgnO1xuICAgIGVsZW1lbnQuc3R5bGUuYm90dG9tID0gTWF0aC5mbG9vcih0aGlzLnkgKiB0aGlzLmhlaWdodCkgKyAncHgnO1xuXG4gICAgdmFyIGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgaW5uZXIuY2xhc3NOYW1lID0gJ2Jsb2NrX19pbm5lcic7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChpbm5lcik7XG5cbiAgICB2YXIgYWN0aXZlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgYWN0aXZlLmNsYXNzTmFtZSA9ICdibG9ja19fYWN0aXZlJztcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGFjdGl2ZSk7XG5cbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRleHQuY2xhc3NOYW1lID0gJ2Jsb2NrX190ZXh0JztcbiAgICB0ZXh0LmlubmVySFRNTCA9IHRoaXMudmFsdWU7XG4gICAgaW5uZXIuYXBwZW5kQ2hpbGQodGV4dCk7XG5cbiAgICB0aGlzLmlubmVyRWxlbWVudCA9IGlubmVyO1xuICAgIHRoaXMudGV4dEVsZW1lbnQgPSB0ZXh0O1xuICAgIHRoaXMuYWN0aXZlRWxlbWVudCA9IGFjdGl2ZTtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXG4gICAgdGhpcy5fdXBkYXRlQ29sb3JzKCk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuX3NldFJhbmRvbVZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN1bW1SYXRpb24gPSAwO1xuICAgIHZhciBwb3NzaWJsZVZhbHVlcyA9IHRoaXMuY29uZmlnLm51bWJlcnMucG9zc2libGVWYWx1ZXM7XG5cbiAgICBwb3NzaWJsZVZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgIHN1bW1SYXRpb24gKz0gZWxbMV07XG4gICAgfSk7XG5cbiAgICB2YXIgc3VtbSA9IDA7XG5cbiAgICB2YXIgY2hhbmNlQXJyYXkgPSBwb3NzaWJsZVZhbHVlcy5tYXAoZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgdmFyIHZhbCA9IGVsWzFdIC8gc3VtbVJhdGlvbiArIHN1bW07XG5cbiAgICAgICAgc3VtbSA9IHZhbDtcblxuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0pO1xuXG4gICAgdmFyIHJvbGwgPSBNYXRoLnJhbmRvbSgpO1xuXG4gICAgdmFyIHZhbHVlID0gMDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hhbmNlQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHJvbGwgPD0gY2hhbmNlQXJyYXlbaV0pIHtcbiAgICAgICAgICAgIHZhbHVlID0gcG9zc2libGVWYWx1ZXNbaV1bMF07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5fYmluZEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh1dGlsLmlzTW9iaWxlKSB7XG4gICAgICAgIHV0aWwub24odGhpcy5lbGVtZW50LCAndG91Y2hzdGFydCcsIHRoaXMuX21vdXNlRG93bkhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXRpbC5vbih0aGlzLmVsZW1lbnQsICdtb3VzZWRvd24nLCB0aGlzLl9tb3VzZURvd25IYW5kbGVyLmJpbmQodGhpcykpO1xuICAgICAgICB1dGlsLm9uKHRoaXMuYWN0aXZlRWxlbWVudCwgJ21vdXNlb3ZlcicsIHRoaXMuX21vdXNlT3ZlckhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgICAgIC8vdXRpbC5vbih0aGlzLmFjdGl2ZUVsZW1lbnQsICdtb3VzZW91dCcsIHRoaXMuX21vdXNlT3V0SGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9XG59O1xuXG5CbG9jay5wcm90b3R5cGUuX21vdXNlRG93bkhhbmRsZXIgPSBmdW5jdGlvbihldikge1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB0aGlzLmZpZWxkLmJsb2NrTW91c2VEb3duKHRoaXMuaWQpO1xufTtcblxuXG5CbG9jay5wcm90b3R5cGUuX21vdXNlT3ZlckhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmZpZWxkLmJsb2NrTW91c2VPdmVyKHRoaXMuaWQpO1xufTtcblxuXG5CbG9jay5wcm90b3R5cGUuX21vdXNlT3V0SGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZmllbGQuYmxvY2tNb3VzZU91dCh0aGlzLmlkKTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5jaGFuZ2VQb3NpdGlvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG5cbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUubGVmdCA9IE1hdGguZmxvb3IoeCAqIHRoaXMud2lkdGgpICsgJ3B4JztcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUuYm90dG9tID0gTWF0aC5mbG9vcih5ICogdGhpcy5oZWlnaHQpICsgJ3B4Jztcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5fdXBkYXRlQ29sb3JzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCFjb2xvcnNDYWNoZVt0aGlzLnZhbHVlXSkge1xuICAgICAgICAvLyA3IC0+IDMgKHByaW1lTnVtYmVyIC0+IHJhdGlvKVxuICAgICAgICB2YXIgcHJpbWVBcnJheSA9IFtdO1xuICAgICAgICB2YXIgaTtcblxuICAgICAgICBmb3IgKGkgPSBwcmltZU51bWJlcnMubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgJSBwcmltZU51bWJlcnNbaV0gPT09IDApIHtcbiAgICAgICAgICAgICAgICBwcmltZUFycmF5LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJpbWVOdW1iZXJzW2ldLFxuICAgICAgICAgICAgICAgICAgICByZ2I6IGNvbG9yc1tpXS5yZ2IsXG4gICAgICAgICAgICAgICAgICAgIHJhdGlvOiB0aGlzLnZhbHVlIC8gcHJpbWVOdW1iZXJzW2ldXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY29sb3I7XG5cbiAgICAgICAgaWYgKHByaW1lQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb2xvciA9IHV0aWwucmdiU3VtKHByaW1lQXJyYXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29sb3IgPSBjb2xvcnNbMF0ucmdiO1xuICAgICAgICB9XG5cbiAgICAgICAgY29sb3JzQ2FjaGVbdGhpcy52YWx1ZV0gPSAncmdiKCcgKyBjb2xvci5qb2luKCcsJykgKyAnKSc7XG4gICAgfVxuXG4gICAgdGhpcy5pbm5lckVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3JzQ2FjaGVbdGhpcy52YWx1ZV07XG59O1xuXG5CbG9jay5wcm90b3R5cGUuY2hhbmdlVmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLnRleHRFbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuXG4gICAgdGhpcy5fdXBkYXRlQ29sb3JzKCk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5hZGRDbGFzcyh0aGlzLmVsZW1lbnQsICdfc2VsZWN0ZWQnKTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS51bnNlbGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5lbGVtZW50LCAnX3NlbGVjdGVkJyk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuYW5pbWF0ZUNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5lbGVtZW50LCAnX2JsaW5rJyk7XG5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHNlbGYuZWxlbWVudCwgJ19ibGluaycpO1xuICAgIH0sIDApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCbG9jaztcbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICAgIHtcbiAgICAgICAgd2ViOiAnIzk5YjQzMycsXG4gICAgICAgIHJnYjogWzE1NCwgMTgwLCA1MV1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyNEQTUzMkMnLFxuICAgICAgICByZ2I6IFsyMTgsIDgzLCA0NF1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyMxZTcxNDUnLFxuICAgICAgICByZ2I6IFszMCwgMTEzLCA2OV1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyMyQzg5QTAnLFxuICAgICAgICByZ2I6IFs0NCwgMTM3LCAxNjBdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjMDBBQTg4JyxcbiAgICAgICAgcmdiOiBbMCwgMTcwLCAxMzZdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjMDBkNDU1JyxcbiAgICAgICAgcmdiOiBbMCwgMjEyLCA4NV1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyNmZjJhMmEnLFxuICAgICAgICByZ2I6IFsyNTUsIDQyLCA0Ml1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyNDQjUwMDAnLFxuICAgICAgICByZ2I6IFsyMDMsIDgwLCAwXVxuICAgIH1cbl07XG4iLCJ2YXIgQmxvY2sgPSByZXF1aXJlKCcuL2Jsb2NrLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcbnZhciBnYW1lQ29uZmlnID0gcmVxdWlyZSgnLi4vZ2FtZUNvbmZpZycpO1xuXG5mdW5jdGlvbiBGaWVsZChnYW1lKSB7XG4gICAgdGhpcy5nYW1lID0gZ2FtZTtcbiAgICB0aGlzLmNvbmZpZyA9IGdhbWUuY29uZmlnO1xuXG4gICAgdGhpcy5ibG9ja3MgPSB7fTtcbiAgICB0aGlzLl9ibG9ja3NYWSA9IHt9O1xuICAgIHRoaXMuc2l6ZSA9IHRoaXMuY29uZmlnLmZpZWxkLnNpemU7XG5cbiAgICB0aGlzLnNlbGVjdGVkQmxvY2tzID0gW107XG4gICAgdGhpcy5zZWxlY3RlZE1vZGUgPSBmYWxzZTtcblxuICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fY3JlYXRlRWxlbWVudCgpO1xuICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcbn1cblxuRmllbGQucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNpemVbMF07IGkrKykge1xuICAgICAgICB0aGlzLl9ibG9ja3NYWVtpXSA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5zaXplWzFdOyBqKyspIHtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQmxvY2soaSwgaiwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuY3JlYXRlQmxvY2sgPSBmdW5jdGlvbih4LCB5LCBpc0luaXQpIHtcbiAgICB2YXIgYmxvY2sgPSBuZXcgQmxvY2soeCwgeSwgdGhpcyk7XG5cbiAgICB0aGlzLmJsb2Nrc1tibG9jay5pZF0gPSBibG9jaztcblxuICAgIHRoaXMuX2Jsb2Nrc1hZW3hdW3ldID0gYmxvY2suaWQ7XG5cbiAgICBpZiAoIWlzSW5pdCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoYmxvY2suZWxlbWVudCk7XG4gICAgICAgIGJsb2NrLmFuaW1hdGVDcmVhdGUoKTtcbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHRoaXMuY2FudmFzLmNsYXNzTmFtZSA9ICdmaWVsZF9fY2FudmFzJztcblxuICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIHRoaXMuY2FudmFzLndpZHRoID0gZ2FtZUNvbmZpZy5maWVsZC53aWR0aDtcbiAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSBnYW1lQ29uZmlnLmZpZWxkLmhlaWdodDtcbiAgICBmcmFnbWVudC5hcHBlbmRDaGlsZCh0aGlzLmNhbnZhcyk7XG5cbiAgICB1dGlsLmZvckVhY2godGhpcy5ibG9ja3MsIGZ1bmN0aW9uKGJsKSB7XG4gICAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGJsLmVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9ICdmaWVsZCcgK1xuICAgICAgICAnIF93aWR0aF8nICsgdGhpcy5zaXplWzBdICtcbiAgICAgICAgJyBfaGVpZ2h0XycgKyB0aGlzLnNpemVbMV07XG5cbiAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHV0aWwuaXNNb2JpbGUpIHtcbiAgICAgICAgdXRpbC5vbihkb2N1bWVudC5ib2R5LCAndG91Y2hlbmQnLCB0aGlzLl9tb3VzZVVwSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICAgICAgdXRpbC5vbihkb2N1bWVudC5ib2R5LCAndG91Y2htb3ZlJywgdGhpcy5fdG91Y2hNb3ZlSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1dGlsLm9uKGRvY3VtZW50LmJvZHksICdtb3VzZXVwJywgdGhpcy5fbW91c2VVcEhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLl90b3VjaE1vdmVIYW5kbGVyID0gZnVuY3Rpb24oZXYpIHtcbiAgICB2YXIgaXNCcmVhaywgYmxvY2ssIGtleXMsdG91Y2gsIHRhcmdldCwgaSwgajtcbiAgICB2YXIgYmxvY2tzID0gdGhpcy5ibG9ja3M7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgZXYuY2hhbmdlZFRvdWNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdG91Y2ggPSBldi5jaGFuZ2VkVG91Y2hlc1tpXTtcbiAgICAgICAgdGFyZ2V0ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh0b3VjaC5jbGllbnRYLCB0b3VjaC5jbGllbnRZKTtcblxuICAgICAgICBpZiAoIXRhcmdldCB8fCB0YXJnZXQuY2xhc3NOYW1lLmluZGV4T2YoJ2Jsb2NrX19hY3RpdmUnKSA9PSAtMSkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgIC8vINC00LXQu9Cw0LXQvCBmb3IsINCwINC90LUgZm9yRWFjaCwg0YfRgtC+0LHRiyDQvNC+0LbQvdC+INCx0YvQu9C+INGB0YLQvtC/0L3Rg9GC0YxcbiAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzKGJsb2Nrcyk7XG5cbiAgICAgICAgZm9yIChqID0gMDsgaiA8IGtleXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGJsb2NrID0gYmxvY2tzW2tleXNbal1dO1xuXG4gICAgICAgICAgICBpZiAoYmxvY2suYWN0aXZlRWxlbWVudCA9PT0gdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ibG9ja01vdXNlT3ZlcihibG9jay5pZCk7XG4gICAgICAgICAgICAgICAgaXNCcmVhayA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNCcmVhaykge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX21vdXNlVXBIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLnNlbGVjdGVkTW9kZSkgeyByZXR1cm47IH1cblxuICAgIHRoaXMuc2VsZWN0ZWRNb2RlID0gZmFsc2U7XG5cbiAgICB0aGlzLl9ydW5TZWxlY3RlZCgpO1xuXG4gICAgdXRpbC5mb3JFYWNoKHRoaXMuYmxvY2tzLCBmdW5jdGlvbihibG9jaykge1xuICAgICAgICBibG9jay51bnNlbGVjdCgpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5nYW1lLnVwZGF0ZUNoYWluU3VtKCk7XG5cbiAgICB0aGlzLl9jbGVhclBhdGgoKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5ibG9ja01vdXNlRG93biA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdGhpcy5zZWxlY3RlZE1vZGUgPSB0cnVlO1xuICAgIHRoaXMuc2VsZWN0ZWRCbG9ja3MgPSBbaWRdO1xuXG4gICAgdGhpcy5ibG9ja3NbaWRdLnNlbGVjdCgpO1xuXG4gICAgdGhpcy5nYW1lLnVwZGF0ZUNoYWluU3VtKCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2NoZWNrV2l0aExhc3QgPSBmdW5jdGlvbihpZCkge1xuICAgIHZhciBsYXN0QmwgPSB0aGlzLmJsb2Nrc1t0aGlzLnNlbGVjdGVkQmxvY2tzW3RoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoIC0gMV1dO1xuICAgIHZhciBuZXdCbCA9IHRoaXMuYmxvY2tzW2lkXTtcblxuICAgIHJldHVybiBsYXN0QmwudmFsdWUgPT0gbmV3QmwudmFsdWUgJiZcbiAgICAgICAgTWF0aC5hYnMobGFzdEJsLnggLSBuZXdCbC54KSA8PSAxICYmXG4gICAgICAgIE1hdGguYWJzKGxhc3RCbC55IC0gbmV3QmwueSkgPD0gMTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5ibG9ja01vdXNlT3ZlciA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgaWYgKCF0aGlzLnNlbGVjdGVkTW9kZSkgeyByZXR1cm47IH1cblxuICAgIHZhciBzZWxCbG9ja3MgPSB0aGlzLnNlbGVjdGVkQmxvY2tzO1xuXG4gICAgaWYgKHNlbEJsb2Nrcy5pbmRleE9mKGlkKSA9PSAtMSkge1xuICAgICAgICBpZiAodGhpcy5fY2hlY2tXaXRoTGFzdChpZCkpIHtcbiAgICAgICAgICAgIHNlbEJsb2Nrcy5wdXNoKGlkKTtcbiAgICAgICAgICAgIHRoaXMuYmxvY2tzW2lkXS5zZWxlY3QoKTtcblxuICAgICAgICAgICAgdGhpcy5nYW1lLnVwZGF0ZUNoYWluU3VtKCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVQYXRoKCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoc2VsQmxvY2tzW3NlbEJsb2Nrcy5sZW5ndGggLSAyXSA9PSBpZCkge1xuICAgICAgICAgICAgdmFyIGxhc3RCbElkID0gc2VsQmxvY2tzLnBvcCgpO1xuICAgICAgICAgICAgdGhpcy5ibG9ja3NbbGFzdEJsSWRdLnVuc2VsZWN0KCk7XG5cbiAgICAgICAgICAgIHRoaXMuZ2FtZS51cGRhdGVDaGFpblN1bSgpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlUGF0aCgpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLl91cGRhdGVQYXRoID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGN0eCA9IHRoaXMuY3R4O1xuICAgIHZhciBmaWVsZEhlaWdodCA9IGdhbWVDb25maWcuZmllbGQuaGVpZ2h0O1xuXG4gICAgdGhpcy5fY2xlYXJQYXRoKCk7XG5cbiAgICBjdHguYmVnaW5QYXRoKCk7XG5cbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBnYW1lQ29uZmlnLnBhdGguY29sb3I7XG4gICAgY3R4LmxpbmVXaWR0aCA9IGdhbWVDb25maWcucGF0aC53aWR0aDtcblxuICAgIHRoaXMuc2VsZWN0ZWRCbG9ja3MuZm9yRWFjaChmdW5jdGlvbihpZCwgaSkge1xuICAgICAgICB2YXIgYmxvY2sgPSB0aGlzLmJsb2Nrc1tpZF07XG4gICAgICAgIHZhciB4ID0gKGJsb2NrLnggKyAwLjUpICogYmxvY2sud2lkdGg7XG4gICAgICAgIHZhciB5ID0gZmllbGRIZWlnaHQgLSAoYmxvY2sueSArIDAuNSkgKiBibG9jay5oZWlnaHQ7XG5cbiAgICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAgIGN0eC5tb3ZlVG8oeCwgeSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdHgubGluZVRvKHgsIHkpO1xuICAgICAgICB9XG4gICAgfSwgdGhpcyk7XG5cbiAgICBjdHguc3Ryb2tlKCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2NsZWFyUGF0aCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCBnYW1lQ29uZmlnLmZpZWxkLndpZHRoLCBnYW1lQ29uZmlnLmZpZWxkLmhlaWdodCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuYmxvY2tNb3VzZU91dCA9IGZ1bmN0aW9uKGlkKSB7XG5cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fYmxvY2tSZW1vdmUgPSBmdW5jdGlvbihpZCkge1xuICAgIHZhciBibG9jayA9IHRoaXMuYmxvY2tzW2lkXTtcblxuICAgIHRoaXMuZWxlbWVudC5yZW1vdmVDaGlsZChibG9jay5lbGVtZW50KTtcblxuICAgIHRoaXMuX2Jsb2Nrc1hZW2Jsb2NrLnhdW2Jsb2NrLnldID0gbnVsbDtcbiAgICBkZWxldGUgdGhpcy5ibG9ja3NbaWRdO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9ydW5TZWxlY3RlZCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnNlbGVjdGVkQmxvY2tzLmxlbmd0aCA8IHRoaXMuY29uZmlnLmNoYWluLm1pbkxlbmd0aCkgeyByZXR1cm47IH1cblxuICAgIHRoaXMuZ2FtZS51cGRhdGVTY29yZSgpO1xuXG4gICAgdmFyIGxhc3RCbElkID0gdGhpcy5zZWxlY3RlZEJsb2Nrcy5wb3AoKTtcbiAgICB2YXIgbGFzdEJsID0gdGhpcy5ibG9ja3NbbGFzdEJsSWRdO1xuICAgIHZhciB2YWx1ZSA9IGxhc3RCbC52YWx1ZSAqICh0aGlzLnNlbGVjdGVkQmxvY2tzLmxlbmd0aCArIDEpOyAvLyArMSBiZWNhdXNlIHBvcCBhYm92ZVxuXG4gICAgbGFzdEJsLmNoYW5nZVZhbHVlKHZhbHVlKTtcblxuICAgIHRoaXMuc2VsZWN0ZWRCbG9ja3MuZm9yRWFjaCh0aGlzLl9ibG9ja1JlbW92ZSwgdGhpcyk7XG5cbiAgICB0aGlzLl9jaGVja1Bvc2l0aW9ucygpO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9jaGVja1Bvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHZhciBibG9ja3NYWSA9IHRoaXMuX2Jsb2Nrc1hZO1xuICAgIHZhciBibG9ja3MgPSB0aGlzLmJsb2NrcztcblxuICAgIHV0aWwuZm9yRWFjaChibG9ja3NYWSwgZnVuY3Rpb24oYmxvY2tzWSkge1xuICAgICAgICB2YXIgYXJyID0gW107XG5cbiAgICAgICAgLy8g0LTQvtCx0LDQstC70Y/QtdC8INCyINC80LDRgdGB0LjQsiDRgdGD0YnQtdGB0YLQstGD0Y7RidC40LUg0LLQtdGA0YLQuNC60LDQu9GM0L3Ri9C1INGN0LvQtdC80LXQvdGC0YtcbiAgICAgICAgdXRpbC5mb3JFYWNoKGJsb2Nrc1ksIGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICBpZiAoaWQpIHsgYXJyLnB1c2goaWQpOyB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vINC10YHQu9C4INC/0L7Qu9C90YvQuSDQuNC70Lgg0L/Rg9GB0YLQvtC5XG4gICAgICAgIGlmIChhcnIubGVuZ3RoID09IHNlbGYuc2l6ZVsxXSB8fCAhYXJyKSB7IHJldHVybjsgfVxuXG4gICAgICAgIC8vINGB0L7RgNGC0LjRgNGD0LXQvFxuICAgICAgICBhcnIuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYmxvY2tzW2FdLnkgPiBibG9ja3NbYl0ueTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g0YHQtNCy0LjQs9Cw0LXQvCDQvtGC0YHQvtGA0YLQuNGA0L7QstCw0L3QvdGL0Lkg0YHQv9C40YHQvtC6INC6INC90LjQt9GDXG4gICAgICAgIGFyci5mb3JFYWNoKGZ1bmN0aW9uKGlkLCB5KSB7XG4gICAgICAgICAgICB2YXIgYmxvY2sgPSBibG9ja3NbaWRdO1xuXG4gICAgICAgICAgICBpZiAoYmxvY2sueSAhPSB5KSB7XG4gICAgICAgICAgICAgICAgYmxvY2tzWVtibG9jay55XSA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICBibG9jay5jaGFuZ2VQb3NpdGlvbihibG9jay54LCB5KTtcblxuICAgICAgICAgICAgICAgIGJsb2Nrc1lbeV0gPSBpZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9hZGROZXdCbG9ja3MoKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fYWRkTmV3QmxvY2tzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGJsb2Nrc1hZID0gdGhpcy5fYmxvY2tzWFk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2l6ZVswXTsgaSsrKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5zaXplWzFdOyBqKyspIHtcbiAgICAgICAgICAgIGlmICghYmxvY2tzWFlbaV1bal0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUJsb2NrKGksIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGaWVsZDtcbiIsInZhciBGaWVsZCA9IHJlcXVpcmUoJy4vZmllbGQuanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG5mdW5jdGlvbiBHYW1lKG5hbWUsIHN0YXRlKSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWcubGV2ZWxzW25hbWVdO1xuICAgIHRoaXMuc2NvcmUgPSAwO1xuICAgIHRoaXMuX2lzV2luID0gQm9vbGVhbihzdGF0ZS53aW5MZXZlbHMuaW5kZXhPZihuYW1lKSAhPT0gLTEpO1xuXG4gICAgdGhpcy5maWVsZCA9IG5ldyBGaWVsZCh0aGlzKTtcblxuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbiAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XG59XG5cbkdhbWUucHJvdG90eXBlLl9jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBlbGVtZW50LmNsYXNzTmFtZSA9ICdnYW1lJztcblxuICAgIHZhciB0ZW1wbGF0ZSA9XG4gICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9faGVhZGVyXCI+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX3Njb3JlXCI+MDwvZGl2PicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19jaGFpblN1bVwiPjwvZGl2PicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19nb2FsXCI+e3tnb2FsfX08L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX2JvZHlcIj48L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19mb290ZXJcIj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9fYmFja0J1dHRvblwiPk1lbnU8L2Rpdj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9fcmVzdGFydEJ1dHRvblwiPlJlc3RhcnQ8L2Rpdj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9fbmV4dEJ1dHRvblwiPk5leHQ8L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2Pic7XG5cbiAgICBlbGVtZW50LmlubmVySFRNTCA9IHRlbXBsYXRlLnJlcGxhY2UoJ3t7Z29hbH19JywgdGhpcy5jb25maWcuZ29hbCk7XG5cbiAgICBpZiAodGhpcy5faXNXaW4pIHtcbiAgICAgICAgdXRpbC5hZGRDbGFzcyhlbGVtZW50LCAnX3dpbicpO1xuICAgIH1cblxuICAgIHRoaXMuYmFja0J1dHRvbiA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnZ2FtZV9fYmFja0J1dHRvbicpWzBdO1xuICAgIHRoaXMucmVzdGFydEJ1dHRvbiA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnZ2FtZV9fcmVzdGFydEJ1dHRvbicpWzBdO1xuICAgIHRoaXMubmV4dEJ1dHRvbiA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnZ2FtZV9fbmV4dEJ1dHRvbicpWzBdO1xuXG4gICAgdGhpcy5zY29yZUVsZW1lbnQgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dhbWVfX3Njb3JlJylbMF07XG4gICAgdGhpcy5jaGFpblN1bUVsZW1lbnQgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dhbWVfX2NoYWluU3VtJylbMF07XG5cbiAgICB0aGlzLmJvZHlFbGVtZW50ID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdnYW1lX19ib2R5JylbMF07XG4gICAgdGhpcy5ib2R5RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmZpZWxkLmVsZW1lbnQpO1xuXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbn07XG5cbkdhbWUucHJvdG90eXBlLl9iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5vbih0aGlzLnJlc3RhcnRCdXR0b24sICdjbGljaycsIHRoaXMucmVzdGFydC5iaW5kKHRoaXMpKTtcbiAgICB1dGlsLm9uKHRoaXMuYmFja0J1dHRvbiwgJ2NsaWNrJywgdGhpcy5fYmFja1RvTWVudS5iaW5kKHRoaXMpKTtcbiAgICB1dGlsLm9uKHRoaXMubmV4dEJ1dHRvbiwgJ2NsaWNrJywgdGhpcy5fbmV4dExldmVsLmJpbmQodGhpcykpO1xufTtcblxuR2FtZS5wcm90b3R5cGUuX25leHRMZXZlbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3RhdGUubmV4dEZyb21MZXZlbCgpO1xufTtcblxuR2FtZS5wcm90b3R5cGUucmVzdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXdGaWVsZCA9IG5ldyBGaWVsZCh0aGlzKTtcblxuICAgIHRoaXMuYm9keUVsZW1lbnQucmVwbGFjZUNoaWxkKG5ld0ZpZWxkLmVsZW1lbnQsIHRoaXMuZmllbGQuZWxlbWVudCk7XG5cbiAgICB0aGlzLnNjb3JlID0gMDtcbiAgICB0aGlzLnNjb3JlRWxlbWVudC5pbm5lckhUTUwgPSAwO1xuXG4gICAgdGhpcy5maWVsZCA9IG5ld0ZpZWxkO1xufTtcblxuR2FtZS5wcm90b3R5cGUuX2JhY2tUb01lbnUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN0YXRlLmJhY2tGcm9tTGV2ZWwoKTtcbn07XG5cbkdhbWUucHJvdG90eXBlLnVwZGF0ZUNoYWluU3VtID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLmZpZWxkLnNlbGVjdGVkTW9kZSkge1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuY2hhaW5TdW1FbGVtZW50LCAnX3Nob3dlZCcpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGZpZWxkID0gdGhpcy5maWVsZDtcblxuICAgIHZhciBibG9ja1ZhbHVlID0gZmllbGQuYmxvY2tzW2ZpZWxkLnNlbGVjdGVkQmxvY2tzWzBdXS52YWx1ZSB8fCAwO1xuICAgIHRoaXMuY2hhaW5TdW1FbGVtZW50LmlubmVySFRNTCA9IGJsb2NrVmFsdWUgKiBmaWVsZC5zZWxlY3RlZEJsb2Nrcy5sZW5ndGg7XG4gICAgdXRpbC5hZGRDbGFzcyh0aGlzLmNoYWluU3VtRWxlbWVudCwgJ19zaG93ZWQnKTtcbn07XG5cbkdhbWUucHJvdG90eXBlLnVwZGF0ZVNjb3JlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZpZWxkID0gdGhpcy5maWVsZDtcblxuICAgIHZhciBibG9ja1ZhbHVlID0gZmllbGQuYmxvY2tzW2ZpZWxkLnNlbGVjdGVkQmxvY2tzWzBdXS52YWx1ZSB8fCAwO1xuICAgIHZhciBrID0gMSArIDAuMiAqIChmaWVsZC5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggLSAzKTtcbiAgICB0aGlzLnNjb3JlICs9IE1hdGgucm91bmQoYmxvY2tWYWx1ZSAqIGZpZWxkLnNlbGVjdGVkQmxvY2tzLmxlbmd0aCAqIGspO1xuICAgIHRoaXMuc2NvcmVFbGVtZW50LmlubmVySFRNTCA9IHRoaXMuc2NvcmU7XG5cbiAgICB0aGlzLl9jaGVja1dpbigpO1xufTtcblxuR2FtZS5wcm90b3R5cGUuX2NoZWNrV2luID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLl9pc1dpbiAmJiB0aGlzLnNjb3JlID49IHRoaXMuY29uZmlnLndpbkNvbmRpdGlvbi5zY29yZSkge1xuICAgICAgICB0aGlzLl9pc1dpbiA9IHRydWU7XG4gICAgICAgIHRoaXMuc3RhdGUubGV2ZWxXaW4odGhpcy5uYW1lKTtcbiAgICAgICAgdXRpbC5hZGRDbGFzcyh0aGlzLmVsZW1lbnQsICdfd2luJyk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBHYW1lO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZmllbGQ6IHtcbiAgICAgICAgd2lkdGg6IDUwMCxcbiAgICAgICAgaGVpZ2h0OiA1MDBcbiAgICB9LFxuICAgIHBhdGg6IHtcbiAgICAgICAgY29sb3I6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMjUpJyxcbiAgICAgICAgd2lkdGg6IDEwXG4gICAgfSxcbiAgICBvcGVuTGV2ZWxzTGVuZ3RoOiA3LFxuICAgIGxldmVsczogWzEsIDIsIDMsIDQsIDUsIDYsIDcsIDhdXG59O1xuIiwidmFyIGdhbWVDb25maWcgPSByZXF1aXJlKCcuLi9nYW1lQ29uZmlnLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcblxuZnVuY3Rpb24gTGV2ZWxNZW51KHN0YXRlKSB7XG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuXG4gICAgdGhpcy5fbGV2ZWxCbG9ja3MgPSB7fTtcblxuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbiAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XG59XG5cbkxldmVsTWVudS5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2xldmVsTWVudSc7XG5cbiAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29udGFpbmVyLmNsYXNzTmFtZSA9ICdsZXZlbE1lbnVfX2NvbnRhaW5lcic7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuXG4gICAgdmFyIGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGhlYWRlci5jbGFzc05hbWUgPSAnbGV2ZWxNZW51X19oZWFkZXInO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChoZWFkZXIpO1xuXG4gICAgdmFyIGxldmVscyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGxldmVscy5jbGFzc05hbWUgPSAnbGV2ZWxNZW51X19oZWFkZXJMZXZlbHMnO1xuICAgIGxldmVscy5pbm5lckhUTUwgPSAnTGV2ZWxzOic7XG4gICAgaGVhZGVyLmFwcGVuZENoaWxkKGxldmVscyk7XG5cbiAgICB2YXIgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGJvZHkuY2xhc3NOYW1lID0gJ2xldmVsTWVudV9fYm9keSc7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGJvZHkpO1xuXG4gICAgdmFyIGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgZ2FtZUNvbmZpZy5sZXZlbHMuZm9yRWFjaChmdW5jdGlvbihuYW1lLCBpKSB7XG4gICAgICAgIHZhciBsZXZlbEJsb2NrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGxldmVsQmxvY2suY2xhc3NOYW1lID0gJ2xldmVsTWVudV9fbGV2ZWxCbG9jayBfbGV2ZWxfJyArIGkgJSAyO1xuICAgICAgICBsZXZlbEJsb2NrLmlubmVySFRNTCA9IG5hbWU7XG5cbiAgICAgICAgdXRpbC5vbihsZXZlbEJsb2NrLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuc3RhdGUucnVuTGV2ZWwobmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNlbGYuX2xldmVsQmxvY2tzW25hbWVdID0gbGV2ZWxCbG9jaztcblxuICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChsZXZlbEJsb2NrKTtcbiAgICB9KTtcblxuICAgIGJvZHkuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xuXG4gICAgdmFyIGZvb3RlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGZvb3Rlci5jbGFzc05hbWUgPSAnbGV2ZWxNZW51X19mb290ZXInO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChmb290ZXIpO1xuXG4gICAgdmFyIGJhY2tCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBiYWNrQnV0dG9uLmNsYXNzTmFtZSA9ICdsZXZlbE1lbnVfX2JhY2tCdXR0b24nO1xuICAgIGJhY2tCdXR0b24uaW5uZXJIVE1MID0gJ0JhY2snO1xuICAgIGZvb3Rlci5hcHBlbmRDaGlsZChiYWNrQnV0dG9uKTtcblxuICAgIHRoaXMuYmFja0J1dHRvbiA9IGJhY2tCdXR0b247XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbn07XG5cbkxldmVsTWVudS5wcm90b3R5cGUuX2JpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICB1dGlsLm9uKHRoaXMuYmFja0J1dHRvbiwgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc3RhdGUucnVuTWFpbk1lbnUoKTtcbiAgICB9LmJpbmQodGhpcykpO1xufTtcblxuTGV2ZWxNZW51LnByb3RvdHlwZS51cGRhdGVPcGVuTGV2ZWxzID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdGF0ZS5vcGVuTGV2ZWxzLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICB1dGlsLmFkZENsYXNzKHRoaXMuX2xldmVsQmxvY2tzW25hbWVdLCAnX29wZW4nKTtcbiAgICB9LCB0aGlzKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTGV2ZWxNZW51O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgMTogcmVxdWlyZSgnLi9sZXZlbHMvMScpLFxuICAgIDI6IHJlcXVpcmUoJy4vbGV2ZWxzLzInKSxcbiAgICAzOiByZXF1aXJlKCcuL2xldmVscy8yJyksXG4gICAgNDogcmVxdWlyZSgnLi9sZXZlbHMvMicpLFxuICAgIDU6IHJlcXVpcmUoJy4vbGV2ZWxzLzInKSxcbiAgICA2OiByZXF1aXJlKCcuL2xldmVscy8yJyksXG4gICAgNzogcmVxdWlyZSgnLi9sZXZlbHMvMicpLFxuICAgIDg6IHJlcXVpcmUoJy4vbGV2ZWxzLzInKVxufTtcbiIsInZhciBHYW1lID0gcmVxdWlyZSgnLi4vZ2FtZS9nYW1lLmpzJyk7XG5cbmZ1bmN0aW9uIExldmVsKG5hbWUsIGxldmVsTWVudSkge1xuICAgIEdhbWUuY2FsbCh0aGlzLCBuYW1lLCBsZXZlbE1lbnUpO1xufVxuXG5MZXZlbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEdhbWUucHJvdG90eXBlKTtcbkxldmVsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExldmVsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExldmVsO1xuIiwidmFyIEdhbWUgPSByZXF1aXJlKCcuLi9nYW1lL2dhbWUuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBHYW1lO1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsLmpzJyk7XG5cbmZ1bmN0aW9uIE1lbnUoc3RhdGUpIHtcbiAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG4gICAgdGhpcy5faXNSZXN1bWVBY3RpdmUgPSBmYWxzZTtcblxuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbiAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XG59XG5cbk1lbnUucHJvdG90eXBlLl9jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBlbGVtZW50LmNsYXNzTmFtZSA9ICdtYWluTWVudSc7XG4gICAgZWxlbWVudC5pbm5lckhUTUwgPVxuICAgICAgICAnPGRpdiBjbGFzcz1cIm1haW5NZW51X19oZWFkZXJcIj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwibWFpbk1lbnVfX3RpdGxlXCI+Q2hhaW51bWJlcjwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwibWFpbk1lbnVfX2JvZHlcIj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwibWFpbk1lbnVfX25ld0dhbWVcIj5OZXcgZ2FtZTwvZGl2PicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJtYWluTWVudV9fcmVzdW1lR2FtZVwiPlJlc3VtZSBnYW1lPC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJtYWluTWVudV9fZm9vdGVyXCI+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cIm1haW5NZW51X192ZXJzaW9uXCI+djAuMC4xPC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj4nO1xuXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm5ld0dhbWVCdXR0b24gPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ21haW5NZW51X19uZXdHYW1lJylbMF07XG4gICAgdGhpcy5yZXN1bWVHYW1lQnV0dG9uID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdtYWluTWVudV9fcmVzdW1lR2FtZScpWzBdO1xufTtcblxuTWVudS5wcm90b3R5cGUuX2JpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICB1dGlsLm9uKHRoaXMubmV3R2FtZUJ1dHRvbiwgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc3RhdGUucnVuTGV2ZWxNZW51KCk7XG4gICAgfS5iaW5kKHRoaXMpKTtcblxuICAgIHV0aWwub24odGhpcy5yZXN1bWVHYW1lQnV0dG9uLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zdGF0ZS5yZXN1bWVMZXZlbCgpO1xuICAgIH0uYmluZCh0aGlzKSk7XG59O1xuXG5NZW51LnByb3RvdHlwZS5yZXN1bWVMZXZlbEFjdGl2ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9pc1Jlc3VtZUFjdGl2ZSkgeyByZXR1cm47IH1cblxuICAgIHRoaXMuX2lzUmVzdW1lQWN0aXZlID0gdHJ1ZTtcbiAgICB1dGlsLmFkZENsYXNzKHRoaXMuZWxlbWVudCwgJ19hY3RpdmVMZXZlbCcpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZW51O1xuIiwidmFyIExldmVsTWVudSA9IHJlcXVpcmUoJy4vbGV2ZWxNZW51L2xldmVsTWVudScpO1xudmFyIE1haW5NZW51ID0gcmVxdWlyZSgnLi9tYWluTWVudS9tYWluTWVudScpO1xuXG52YXIgbGV2ZWxNb2R1bGVzID0gcmVxdWlyZSgnLi9sZXZlbE1vZHVsZXMnKTtcbnZhciBnYW1lQ29uZmlnID0gcmVxdWlyZSgnLi9nYW1lQ29uZmlnLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG5mdW5jdGlvbiBTdGF0ZSgpIHtcbiAgICB0aGlzLl9hY3RpdmVFbGVtZW50ID0gbnVsbDtcbiAgICB0aGlzLl9hY3RpdmVMZXZlbCA9IG51bGw7XG4gICAgdGhpcy53aW5MZXZlbHMgPSBbXTtcblxuICAgIHRoaXMub3BlbkxldmVscyA9IGdhbWVDb25maWcubGV2ZWxzLnNsaWNlKDAsIGdhbWVDb25maWcub3BlbkxldmVsc0xlbmd0aCk7XG5cbiAgICB0aGlzLmxldmVsTWVudSA9IG5ldyBMZXZlbE1lbnUodGhpcyk7XG4gICAgdGhpcy5tYWluTWVudSA9IG5ldyBNYWluTWVudSh0aGlzKTtcblxuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcblxuICAgIHRoaXMubGV2ZWxNZW51LnVwZGF0ZU9wZW5MZXZlbHMoKTtcbn1cblxuU3RhdGUucHJvdG90eXBlLl9jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9ICdzdGF0ZSc7XG4gICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9XG4gICAgICAgICc8ZGl2IGNsYXNzPVwic3RhdGVfX21haW5NZW51XCI+PC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwic3RhdGVfX2xldmVsTWVudVwiPjwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInN0YXRlX19hY3RpdmVMZXZlbFwiPjwvZGl2Pic7XG5cbiAgICB0aGlzLm1haW5NZW51RWxlbWVudCA9IHRoaXMuZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzdGF0ZV9fbWFpbk1lbnUnKVswXTtcbiAgICB0aGlzLm1haW5NZW51RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLm1haW5NZW51LmVsZW1lbnQpO1xuXG4gICAgdGhpcy5sZXZlbE1lbnVFbGVtZW50ID0gdGhpcy5lbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3N0YXRlX19sZXZlbE1lbnUnKVswXTtcbiAgICB0aGlzLmxldmVsTWVudUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5sZXZlbE1lbnUuZWxlbWVudCk7XG5cbiAgICB0aGlzLmFjdGl2ZUxldmVsRWxlbWVudCA9IHRoaXMuZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzdGF0ZV9fYWN0aXZlTGV2ZWwnKVswXTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5fYWN0aXZhdGUgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgaWYgKHRoaXMuX2FjdGl2ZUVsZW1lbnQgPT09IGVsZW1lbnQpIHsgcmV0dXJuOyB9XG5cbiAgICBpZiAodGhpcy5fYWN0aXZlRWxlbWVudCkge1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuX2FjdGl2ZUVsZW1lbnQsICdfc2hvd2VkJyk7XG4gICAgfVxuXG4gICAgdXRpbC5hZGRDbGFzcyhlbGVtZW50LCAnX3Nob3dlZCcpO1xuICAgIHRoaXMuX2FjdGl2ZUVsZW1lbnQgPSBlbGVtZW50O1xufTtcblxuU3RhdGUucHJvdG90eXBlLnJ1bkxldmVsTWVudSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX2FjdGl2YXRlKHRoaXMubGV2ZWxNZW51RWxlbWVudCk7XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUucnVuTWFpbk1lbnUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9hY3RpdmF0ZSh0aGlzLm1haW5NZW51RWxlbWVudCk7XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUucnVuTGV2ZWwgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIGlzT3BlbiA9IHRoaXMub3BlbkxldmVscy5pbmRleE9mKG5hbWUpICE9PSAtMTtcblxuICAgIGlmICghaXNPcGVuKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5tYWluTWVudS5yZXN1bWVMZXZlbEFjdGl2ZSgpO1xuXG4gICAgdmFyIG5ld0xldmVsID0gbmV3IGxldmVsTW9kdWxlc1tuYW1lXShuYW1lLCB0aGlzKTtcblxuICAgIGlmICh0aGlzLl9hY3RpdmVMZXZlbCkge1xuICAgICAgICB0aGlzLmFjdGl2ZUxldmVsRWxlbWVudC5yZXBsYWNlQ2hpbGQobmV3TGV2ZWwuZWxlbWVudCwgdGhpcy5fYWN0aXZlTGV2ZWwuZWxlbWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hY3RpdmVMZXZlbEVsZW1lbnQuYXBwZW5kQ2hpbGQobmV3TGV2ZWwuZWxlbWVudCk7XG4gICAgfVxuXG4gICAgdGhpcy5fYWN0aXZlTGV2ZWwgPSBuZXdMZXZlbDtcblxuICAgIHRoaXMuX2FjdGl2YXRlKHRoaXMuYWN0aXZlTGV2ZWxFbGVtZW50KTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5uZXh0RnJvbUxldmVsID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGN1cnJlbnROYW1lSW5kZXggPSB0aGlzLm9wZW5MZXZlbHMuaW5kZXhPZih0aGlzLl9hY3RpdmVMZXZlbC5uYW1lKTtcblxuICAgIHZhciBuZXh0TGV2ZWxOYW1lID0gdGhpcy5vcGVuTGV2ZWxzW2N1cnJlbnROYW1lSW5kZXggKyAxXTtcblxuICAgIGlmIChuZXh0TGV2ZWxOYW1lKSB7XG4gICAgICAgIHRoaXMucnVuTGV2ZWwobmV4dExldmVsTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5ydW5MZXZlbE1lbnUoKTtcbiAgICB9XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUubGV2ZWxXaW4gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdGhpcy53aW5MZXZlbHMucHVzaChuYW1lKTtcblxuICAgIHRoaXMuX29wZW5OZXh0TGV2ZWwoKTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5fb3Blbk5leHRMZXZlbCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXh0TGV2ZWxOYW1lID0gZ2FtZUNvbmZpZy5sZXZlbHNbdGhpcy5vcGVuTGV2ZWxzLmxlbmd0aF07XG5cbiAgICBpZiAobmV4dExldmVsTmFtZSkge1xuICAgICAgICB0aGlzLm9wZW5MZXZlbHMucHVzaChuZXh0TGV2ZWxOYW1lKTtcbiAgICB9XG5cbiAgICB0aGlzLmxldmVsTWVudS51cGRhdGVPcGVuTGV2ZWxzKCk7XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUuYmFja0Zyb21MZXZlbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucnVuTWFpbk1lbnUoKTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5yZXN1bWVMZXZlbCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9hY3RpdmVMZXZlbCkge1xuICAgICAgICB0aGlzLl9hY3RpdmF0ZSh0aGlzLmFjdGl2ZUxldmVsRWxlbWVudCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZTsiLCJ2YXIgdXRpbCA9IHt9O1xuXG51dGlsLmFkZENsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgIHZhciBpbmRleCA9IGNsYXNzTmFtZXMuaW5kZXhPZihuYW1lKTtcblxuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgY2xhc3NOYW1lcy5wdXNoKG5hbWUpO1xuICAgICAgICBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWVzLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWw7XG59O1xuXG51dGlsLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgIHZhciBpbmRleCA9IGNsYXNzTmFtZXMuaW5kZXhPZihuYW1lKTtcblxuICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgY2xhc3NOYW1lcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWVzLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWw7XG59O1xuXG51dGlsLmhhc0NsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuXG4gICAgcmV0dXJuIGNsYXNzTmFtZXMuaW5kZXhPZihuYW1lKSAhPSAtMTtcbn07XG5cbnV0aWwuZm9yRWFjaCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqLmxlbmd0aCkge1xuICAgICAgICBvYmouZm9yRWFjaChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5XSwga2V5KTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxudXRpbC5vbiA9IGZ1bmN0aW9uKG5vZGUsIHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGNhbGxiYWNrKTtcbn07XG5cbnV0aWwub2ZmID0gZnVuY3Rpb24obm9kZSwgdHlwZSwgY2FsbGJhY2spIHtcbiAgICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgY2FsbGJhY2spO1xufTtcblxuXG4vLyBTZWVtIGxlZ2l0XG52YXIgaXNNb2JpbGUgPSAoJ0RldmljZU9yaWVudGF0aW9uRXZlbnQnIGluIHdpbmRvdyB8fCAnb3JpZW50YXRpb24nIGluIHdpbmRvdyk7XG4vLyBCdXQgd2l0aCBteSBDaHJvbWUgb24gd2luZG93cywgRGV2aWNlT3JpZW50YXRpb25FdmVudCA9PSBmY3QoKVxuaWYgKC9XaW5kb3dzIE5UfE1hY2ludG9zaHxNYWMgT1MgWHxMaW51eC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIGlzTW9iaWxlID0gZmFsc2U7XG4vLyBNeSBhbmRyb2lkIGhhdmUgXCJsaW51eFwiIHRvb1xuaWYgKC9Nb2JpbGUvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSBpc01vYmlsZSA9IHRydWU7XG5cbnV0aWwuaXNNb2JpbGUgPSBpc01vYmlsZTtcblxudXRpbC5yZ2JTdW0gPSBmdW5jdGlvbihhcnIpIHtcbiAgICAvL1t7cmdiLCByYXRpb30sIC4uLl1cblxuICAgIHZhciBzdW0gPSBbMCwgMCwgMF07XG4gICAgdmFyIG4gPSAwO1xuICAgIHZhciBlbCwgaSwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZWwgPSBhcnJbaV07XG5cbiAgICAgICAgZm9yIChqID0gMDsgaiA8IDM7IGorKykge1xuICAgICAgICAgICAgc3VtW2pdICs9IGVsLnJnYltqXSAqIGVsLnJhdGlvO1xuICAgICAgICB9XG5cbiAgICAgICAgbiArPSBlbC5yYXRpbztcbiAgICB9XG5cbiAgICBmb3IgKGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICAgIHN1bVtqXSA9IE1hdGguZmxvb3Ioc3VtW2pdIC8gbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1bTtcbn07XG5cbnV0aWwubnVsbEZuID0gZnVuY3Rpb24oKSB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsO1xuIl19