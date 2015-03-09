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
    // TODO: включить простой шаблонизатор

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

        summ += val;

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

    this.innerElement.style.backgroundColor = 'rgb(' + color.join(',') + ')';
};

/*Block.prototype._updateColors = function() {

    for (var i = primeNumbers.length - 1; i >=0; i--) {
        if (this.value % primeNumbers[i] === 0) {
            this.innerElement.style.backgroundColor = 'rgb(' + colors[i].rgb.join(',') + ')';
            break;
        }
    }
};*/

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

    this.game.updateChainSum(0);

    this._clearPath();
};

Field.prototype.blockMouseDown = function(id) {
    this.selectedMode = true;
    this.selectedBlocks = [id];

    this.blocks[id].select();

    this.game.updateChainSum(this._calcChainSum());
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

            this.game.updateChainSum(this._calcChainSum());
            this._updatePath();
        }
    } else {
        if (selBlocks[selBlocks.length - 2] == id) {
            var lastBlId = selBlocks.pop();
            this.blocks[lastBlId].unselect();

            this.game.updateChainSum(this._calcChainSum());
            this._updatePath();
        }
    }
};

Field.prototype._updatePath = function() {
    var ctx = this.ctx;

    this._clearPath();

    ctx.beginPath();

    ctx.strokeStyle = gameConfig.path.color;
    ctx.lineWidth = gameConfig.path.width;

    this.selectedBlocks.forEach(function(id, i) {
        var block = this.blocks[id];
        var x = (block.x + 0.5) * block.width;
        var y = gameConfig.field.height - (block.y + 0.5) * block.height;

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

Field.prototype._calcChainSum = function() {
    var value = this.blocks[this.selectedBlocks[0]].value || 0;

    return value * this.selectedBlocks.length;
};

Field.prototype._calcUpdateScore = function() {
    var value = this.blocks[this.selectedBlocks[0]].value;

    var k = 1 + 0.2 * (this.selectedBlocks.length - 3);

    return Math.round(value * this.selectedBlocks.length * k);
};

Field.prototype._blockRemove = function(id) {
    var block = this.blocks[id];

    this.element.removeChild(block.element);

    this._blocksXY[block.x][block.y] = null;
    delete this.blocks[id];
};

Field.prototype._runSelected = function() {
    if (this.selectedBlocks.length < this.config.chain.minLength) { return; }

    this.game.updateScore(this._calcUpdateScore());

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

    var gameHeader = document.createElement('div');
    gameHeader.className = 'game__header';
    element.appendChild(gameHeader);

    var score = document.createElement('div');
    score.className = 'game__score';
    score.innerHTML = '0';
    gameHeader.appendChild(score);

    var chainSum = document.createElement('div');
    chainSum.className = 'game__chainSum';
    gameHeader.appendChild(chainSum);

    var goal = document.createElement('div');
    goal.className = 'game__goal';
    gameHeader.appendChild(goal);

    var gameBody = document.createElement('div');
    gameBody.className = 'game__body';
    goal.innerHTML = 'Goal: ' + this.config.goal;
    element.appendChild(gameBody);

    gameBody.appendChild(this.field.element);

    var gameFooter = document.createElement('div');
    gameFooter.className = 'game__footer';
    element.appendChild(gameFooter);

    var backButton = document.createElement('div');
    backButton.className = 'game__backButton';
    backButton.innerHTML = 'Menu';
    gameFooter.appendChild(backButton);

    var restartButton = document.createElement('div');
    restartButton.className = 'game__restartButton';
    restartButton.innerHTML = 'Restart';
    gameFooter.appendChild(restartButton);

    var nextButton = document.createElement('div');
    nextButton.className = 'game__nextButton';
    nextButton.innerHTML = 'Next';
    gameFooter.appendChild(nextButton);

    if (this._isWin) {
        util.addClass(element, '_win');
    }

    this.backButton = backButton;
    this.restartButton = restartButton;
    this.nextButton = nextButton;

    this.scoreElement = score;
    this.chainSumElement = chainSum;

    this.bodyElement = gameBody;
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

Game.prototype.updateChainSum = function(value) {
    if (value) {
        this.chainSumElement.innerHTML = value;
        util.addClass(this.chainSumElement, '_showed');
    } else {
        util.removeClass(this.chainSumElement, '_showed');
    }
};

Game.prototype.updateScore = function(value) {
    this.score += value;
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
    levels: [1, 2]
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
    2: require('./levels/2')
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


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvaW5kZXguanMiLCJzcmMvanMvZ2FtZS9ibG9jay5qcyIsInNyYy9qcy9nYW1lL2NvbG9ycy5qcyIsInNyYy9qcy9nYW1lL2ZpZWxkLmpzIiwic3JjL2pzL2dhbWUvZ2FtZS5qcyIsInNyYy9qcy9nYW1lQ29uZmlnLmpzIiwic3JjL2pzL2xldmVsTWVudS9sZXZlbE1lbnUuanMiLCJzcmMvanMvbGV2ZWxNb2R1bGVzLmpzIiwic3JjL2pzL2xldmVscy8xLmpzIiwic3JjL2pzL2xldmVscy8yLmpzIiwic3JjL2pzL21haW5NZW51L21haW5NZW51LmpzIiwic3JjL2pzL3N0YXRlLmpzIiwic3JjL2pzL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBTdGF0ZSA9IHJlcXVpcmUoJy4vc3RhdGUuanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbmlmICghdXRpbC5pc01vYmlsZSkge1xuICAgIHV0aWwuYWRkQ2xhc3MoZG9jdW1lbnQuYm9keSwgJ25vLXRvdWNoJyk7XG59XG5cbnZhciBodG1sID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dhbWUnKTtcblxudmFyIHN0YXRlID0gbmV3IFN0YXRlKCk7XG5cbmh0bWwuYXBwZW5kQ2hpbGQoc3RhdGUuZWxlbWVudCk7XG5cbnN0YXRlLnJ1bk1haW5NZW51KCk7XG4iLCJ2YXIgY29sb3JzID0gcmVxdWlyZSgnLi9jb2xvcnMuanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xuXG52YXIgcHJpbWVOdW1iZXJzID0gWzEsIDIsIDMsIDUsIDcsIDExLCAxM107XG5cbnZhciBpZENvdW50ZXIgPSAwO1xuXG5mdW5jdGlvbiBCbG9jayh4LCB5LCBmaWVsZCkge1xuICAgIHRoaXMuaWQgPSArK2lkQ291bnRlcjtcblxuICAgIHRoaXMuZmllbGQgPSBmaWVsZDtcbiAgICB0aGlzLmNvbmZpZyA9IGZpZWxkLmNvbmZpZztcblxuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcblxuICAgIHRoaXMudmFsdWUgPSBudWxsO1xuICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG5cbiAgICB0aGlzLndpZHRoID0gNTAwIC8gdGhpcy5jb25maWcuZmllbGQuc2l6ZVswXTtcbiAgICB0aGlzLmhlaWdodCA9IDUwMCAvIHRoaXMuY29uZmlnLmZpZWxkLnNpemVbMV07XG5cbiAgICB0aGlzLl9zZXRSYW5kb21WYWx1ZSgpO1xuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbiAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XG59XG5cbkJsb2NrLnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFRPRE86INCy0LrQu9GO0YfQuNGC0Ywg0L/RgNC+0YHRgtC+0Lkg0YjQsNCx0LvQvtC90LjQt9Cw0YLQvtGAXG5cbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2Jsb2NrJztcblxuICAgIGVsZW1lbnQuc3R5bGUubGVmdCA9IE1hdGguZmxvb3IodGhpcy54ICogdGhpcy53aWR0aCkgKyAncHgnO1xuICAgIGVsZW1lbnQuc3R5bGUuYm90dG9tID0gTWF0aC5mbG9vcih0aGlzLnkgKiB0aGlzLmhlaWdodCkgKyAncHgnO1xuXG4gICAgdmFyIGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgaW5uZXIuY2xhc3NOYW1lID0gJ2Jsb2NrX19pbm5lcic7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChpbm5lcik7XG5cbiAgICB2YXIgYWN0aXZlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgYWN0aXZlLmNsYXNzTmFtZSA9ICdibG9ja19fYWN0aXZlJztcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGFjdGl2ZSk7XG5cbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRleHQuY2xhc3NOYW1lID0gJ2Jsb2NrX190ZXh0JztcbiAgICB0ZXh0LmlubmVySFRNTCA9IHRoaXMudmFsdWU7XG4gICAgaW5uZXIuYXBwZW5kQ2hpbGQodGV4dCk7XG5cbiAgICB0aGlzLmlubmVyRWxlbWVudCA9IGlubmVyO1xuICAgIHRoaXMudGV4dEVsZW1lbnQgPSB0ZXh0O1xuICAgIHRoaXMuYWN0aXZlRWxlbWVudCA9IGFjdGl2ZTtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXG4gICAgdGhpcy5fdXBkYXRlQ29sb3JzKCk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuX3NldFJhbmRvbVZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN1bW1SYXRpb24gPSAwO1xuICAgIHZhciBwb3NzaWJsZVZhbHVlcyA9IHRoaXMuY29uZmlnLm51bWJlcnMucG9zc2libGVWYWx1ZXM7XG5cbiAgICBwb3NzaWJsZVZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgIHN1bW1SYXRpb24gKz0gZWxbMV07XG4gICAgfSk7XG5cbiAgICB2YXIgc3VtbSA9IDA7XG5cbiAgICB2YXIgY2hhbmNlQXJyYXkgPSBwb3NzaWJsZVZhbHVlcy5tYXAoZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgdmFyIHZhbCA9IGVsWzFdIC8gc3VtbVJhdGlvbiArIHN1bW07XG5cbiAgICAgICAgc3VtbSArPSB2YWw7XG5cbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9KTtcblxuICAgIHZhciByb2xsID0gTWF0aC5yYW5kb20oKTtcblxuICAgIHZhciB2YWx1ZSA9IDA7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoYW5jZUFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChyb2xsIDw9IGNoYW5jZUFycmF5W2ldKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHBvc3NpYmxlVmFsdWVzW2ldWzBdO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuX2JpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodXRpbC5pc01vYmlsZSkge1xuICAgICAgICB1dGlsLm9uKHRoaXMuZWxlbWVudCwgJ3RvdWNoc3RhcnQnLCB0aGlzLl9tb3VzZURvd25IYW5kbGVyLmJpbmQodGhpcykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHV0aWwub24odGhpcy5lbGVtZW50LCAnbW91c2Vkb3duJywgdGhpcy5fbW91c2VEb3duSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICAgICAgdXRpbC5vbih0aGlzLmFjdGl2ZUVsZW1lbnQsICdtb3VzZW92ZXInLCB0aGlzLl9tb3VzZU92ZXJIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgICAgICAvL3V0aWwub24odGhpcy5hY3RpdmVFbGVtZW50LCAnbW91c2VvdXQnLCB0aGlzLl9tb3VzZU91dEhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgfVxufTtcblxuQmxvY2sucHJvdG90eXBlLl9tb3VzZURvd25IYW5kbGVyID0gZnVuY3Rpb24oZXYpIHtcbiAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdGhpcy5maWVsZC5ibG9ja01vdXNlRG93bih0aGlzLmlkKTtcbn07XG5cblxuQmxvY2sucHJvdG90eXBlLl9tb3VzZU92ZXJIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5maWVsZC5ibG9ja01vdXNlT3Zlcih0aGlzLmlkKTtcbn07XG5cblxuQmxvY2sucHJvdG90eXBlLl9tb3VzZU91dEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmZpZWxkLmJsb2NrTW91c2VPdXQodGhpcy5pZCk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuY2hhbmdlUG9zaXRpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuXG4gICAgdGhpcy5lbGVtZW50LnN0eWxlLmxlZnQgPSBNYXRoLmZsb29yKHggKiB0aGlzLndpZHRoKSArICdweCc7XG4gICAgdGhpcy5lbGVtZW50LnN0eWxlLmJvdHRvbSA9IE1hdGguZmxvb3IoeSAqIHRoaXMuaGVpZ2h0KSArICdweCc7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuX3VwZGF0ZUNvbG9ycyA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIDcgLT4gMyAocHJpbWVOdW1iZXIgLT4gcmF0aW8pXG4gICAgdmFyIHByaW1lQXJyYXkgPSBbXTtcbiAgICB2YXIgaTtcblxuICAgIGZvciAoaSA9IHByaW1lTnVtYmVycy5sZW5ndGggLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICAgIGlmICh0aGlzLnZhbHVlICUgcHJpbWVOdW1iZXJzW2ldID09PSAwKSB7XG4gICAgICAgICAgICBwcmltZUFycmF5LnB1c2goe1xuICAgICAgICAgICAgICAgIHZhbHVlOiBwcmltZU51bWJlcnNbaV0sXG4gICAgICAgICAgICAgICAgcmdiOiBjb2xvcnNbaV0ucmdiLFxuICAgICAgICAgICAgICAgIHJhdGlvOiB0aGlzLnZhbHVlIC8gcHJpbWVOdW1iZXJzW2ldXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBjb2xvcjtcblxuICAgIGlmIChwcmltZUFycmF5Lmxlbmd0aCkge1xuICAgICAgICBjb2xvciA9IHV0aWwucmdiU3VtKHByaW1lQXJyYXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbG9yID0gY29sb3JzWzBdLnJnYjtcbiAgICB9XG5cbiAgICB0aGlzLmlubmVyRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncmdiKCcgKyBjb2xvci5qb2luKCcsJykgKyAnKSc7XG59O1xuXG4vKkJsb2NrLnByb3RvdHlwZS5fdXBkYXRlQ29sb3JzID0gZnVuY3Rpb24oKSB7XG5cbiAgICBmb3IgKHZhciBpID0gcHJpbWVOdW1iZXJzLmxlbmd0aCAtIDE7IGkgPj0wOyBpLS0pIHtcbiAgICAgICAgaWYgKHRoaXMudmFsdWUgJSBwcmltZU51bWJlcnNbaV0gPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuaW5uZXJFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZ2IoJyArIGNvbG9yc1tpXS5yZ2Iuam9pbignLCcpICsgJyknO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG59OyovXG5cbkJsb2NrLnByb3RvdHlwZS5jaGFuZ2VWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMudGV4dEVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XG5cbiAgICB0aGlzLl91cGRhdGVDb2xvcnMoKTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbigpIHtcbiAgICB1dGlsLmFkZENsYXNzKHRoaXMuZWxlbWVudCwgJ19zZWxlY3RlZCcpO1xufTtcblxuQmxvY2sucHJvdG90eXBlLnVuc2VsZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5yZW1vdmVDbGFzcyh0aGlzLmVsZW1lbnQsICdfc2VsZWN0ZWQnKTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5hbmltYXRlQ3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdXRpbC5hZGRDbGFzcyh0aGlzLmVsZW1lbnQsICdfYmxpbmsnKTtcblxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3Moc2VsZi5lbGVtZW50LCAnX2JsaW5rJyk7XG4gICAgfSwgMCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJsb2NrO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG4gICAge1xuICAgICAgICB3ZWI6ICcjOTliNDMzJyxcbiAgICAgICAgcmdiOiBbMTU0LCAxODAsIDUxXVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnI0RBNTMyQycsXG4gICAgICAgIHJnYjogWzIxOCwgODMsIDQ0XVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnIzFlNzE0NScsXG4gICAgICAgIHJnYjogWzMwLCAxMTMsIDY5XVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnIzJDODlBMCcsXG4gICAgICAgIHJnYjogWzQ0LCAxMzcsIDE2MF1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyMwMEFBODgnLFxuICAgICAgICByZ2I6IFswLCAxNzAsIDEzNl1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyMwMGQ0NTUnLFxuICAgICAgICByZ2I6IFswLCAyMTIsIDg1XVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnI2ZmMmEyYScsXG4gICAgICAgIHJnYjogWzI1NSwgNDIsIDQyXVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnI0NCNTAwMCcsXG4gICAgICAgIHJnYjogWzIwMywgODAsIDBdXG4gICAgfVxuXTtcbiIsInZhciBCbG9jayA9IHJlcXVpcmUoJy4vYmxvY2suanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xudmFyIGdhbWVDb25maWcgPSByZXF1aXJlKCcuLi9nYW1lQ29uZmlnJyk7XG5cbmZ1bmN0aW9uIEZpZWxkKGdhbWUpIHtcbiAgICB0aGlzLmdhbWUgPSBnYW1lO1xuICAgIHRoaXMuY29uZmlnID0gZ2FtZS5jb25maWc7XG5cbiAgICB0aGlzLmJsb2NrcyA9IHt9O1xuICAgIHRoaXMuX2Jsb2Nrc1hZID0ge307XG4gICAgdGhpcy5zaXplID0gdGhpcy5jb25maWcuZmllbGQuc2l6ZTtcblxuICAgIHRoaXMuc2VsZWN0ZWRCbG9ja3MgPSBbXTtcbiAgICB0aGlzLnNlbGVjdGVkTW9kZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLl9jcmVhdGVFbGVtZW50KCk7XG4gICAgdGhpcy5fYmluZEV2ZW50cygpO1xufVxuXG5GaWVsZC5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2l6ZVswXTsgaSsrKSB7XG4gICAgICAgIHRoaXMuX2Jsb2Nrc1hZW2ldID0ge307XG5cbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLnNpemVbMV07IGorKykge1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVCbG9jayhpLCBqLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5jcmVhdGVCbG9jayA9IGZ1bmN0aW9uKHgsIHksIGlzSW5pdCkge1xuICAgIHZhciBibG9jayA9IG5ldyBCbG9jayh4LCB5LCB0aGlzKTtcblxuICAgIHRoaXMuYmxvY2tzW2Jsb2NrLmlkXSA9IGJsb2NrO1xuXG4gICAgdGhpcy5fYmxvY2tzWFlbeF1beV0gPSBibG9jay5pZDtcblxuICAgIGlmICghaXNJbml0KSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChibG9jay5lbGVtZW50KTtcbiAgICAgICAgYmxvY2suYW5pbWF0ZUNyZWF0ZSgpO1xuICAgIH1cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdGhpcy5jYW52YXMuY2xhc3NOYW1lID0gJ2ZpZWxkX19jYW52YXMnO1xuXG4gICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgdGhpcy5jYW52YXMud2lkdGggPSBnYW1lQ29uZmlnLmZpZWxkLndpZHRoO1xuICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IGdhbWVDb25maWcuZmllbGQuaGVpZ2h0O1xuICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKHRoaXMuY2FudmFzKTtcblxuICAgIHV0aWwuZm9yRWFjaCh0aGlzLmJsb2NrcywgZnVuY3Rpb24oYmwpIHtcbiAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoYmwuZWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gJ2ZpZWxkJyArXG4gICAgICAgICcgX3dpZHRoXycgKyB0aGlzLnNpemVbMF0gK1xuICAgICAgICAnIF9oZWlnaHRfJyArIHRoaXMuc2l6ZVsxXTtcblxuICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChmcmFnbWVudCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2JpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodXRpbC5pc01vYmlsZSkge1xuICAgICAgICB1dGlsLm9uKGRvY3VtZW50LmJvZHksICd0b3VjaGVuZCcsIHRoaXMuX21vdXNlVXBIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgICAgICB1dGlsLm9uKGRvY3VtZW50LmJvZHksICd0b3VjaG1vdmUnLCB0aGlzLl90b3VjaE1vdmVIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHV0aWwub24oZG9jdW1lbnQuYm9keSwgJ21vdXNldXAnLCB0aGlzLl9tb3VzZVVwSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX3RvdWNoTW92ZUhhbmRsZXIgPSBmdW5jdGlvbihldikge1xuICAgIHZhciBpc0JyZWFrLCBibG9jaywga2V5cyx0b3VjaCwgdGFyZ2V0LCBpLCBqO1xuICAgIHZhciBibG9ja3MgPSB0aGlzLmJsb2NrcztcblxuICAgIGZvciAoaSA9IDA7IGkgPCBldi5jaGFuZ2VkVG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0b3VjaCA9IGV2LmNoYW5nZWRUb3VjaGVzW2ldO1xuICAgICAgICB0YXJnZXQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHRvdWNoLmNsaWVudFgsIHRvdWNoLmNsaWVudFkpO1xuXG4gICAgICAgIGlmICghdGFyZ2V0IHx8IHRhcmdldC5jbGFzc05hbWUuaW5kZXhPZignYmxvY2tfX2FjdGl2ZScpID09IC0xKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgLy8g0LTQtdC70LDQtdC8IGZvciwg0LAg0L3QtSBmb3JFYWNoLCDRh9GC0L7QsdGLINC80L7QttC90L4g0LHRi9C70L4g0YHRgtC+0L/QvdGD0YLRjFxuICAgICAgICBrZXlzID0gT2JqZWN0LmtleXMoYmxvY2tzKTtcblxuICAgICAgICBmb3IgKGogPSAwOyBqIDwga2V5cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgYmxvY2sgPSBibG9ja3Nba2V5c1tqXV07XG5cbiAgICAgICAgICAgIGlmIChibG9jay5hY3RpdmVFbGVtZW50ID09PSB0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJsb2NrTW91c2VPdmVyKGJsb2NrLmlkKTtcbiAgICAgICAgICAgICAgICBpc0JyZWFrID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0JyZWFrKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fbW91c2VVcEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuc2VsZWN0ZWRNb2RlKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5zZWxlY3RlZE1vZGUgPSBmYWxzZTtcblxuICAgIHRoaXMuX3J1blNlbGVjdGVkKCk7XG5cbiAgICB1dGlsLmZvckVhY2godGhpcy5ibG9ja3MsIGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgIGJsb2NrLnVuc2VsZWN0KCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW0oMCk7XG5cbiAgICB0aGlzLl9jbGVhclBhdGgoKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5ibG9ja01vdXNlRG93biA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdGhpcy5zZWxlY3RlZE1vZGUgPSB0cnVlO1xuICAgIHRoaXMuc2VsZWN0ZWRCbG9ja3MgPSBbaWRdO1xuXG4gICAgdGhpcy5ibG9ja3NbaWRdLnNlbGVjdCgpO1xuXG4gICAgdGhpcy5nYW1lLnVwZGF0ZUNoYWluU3VtKHRoaXMuX2NhbGNDaGFpblN1bSgpKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY2hlY2tXaXRoTGFzdCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGxhc3RCbCA9IHRoaXMuYmxvY2tzW3RoaXMuc2VsZWN0ZWRCbG9ja3NbdGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggLSAxXV07XG4gICAgdmFyIG5ld0JsID0gdGhpcy5ibG9ja3NbaWRdO1xuXG4gICAgcmV0dXJuIGxhc3RCbC52YWx1ZSA9PSBuZXdCbC52YWx1ZSAmJlxuICAgICAgICBNYXRoLmFicyhsYXN0QmwueCAtIG5ld0JsLngpIDw9IDEgJiZcbiAgICAgICAgTWF0aC5hYnMobGFzdEJsLnkgLSBuZXdCbC55KSA8PSAxO1xufTtcblxuRmllbGQucHJvdG90eXBlLmJsb2NrTW91c2VPdmVyID0gZnVuY3Rpb24oaWQpIHtcbiAgICBpZiAoIXRoaXMuc2VsZWN0ZWRNb2RlKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIHNlbEJsb2NrcyA9IHRoaXMuc2VsZWN0ZWRCbG9ja3M7XG5cbiAgICBpZiAoc2VsQmxvY2tzLmluZGV4T2YoaWQpID09IC0xKSB7XG4gICAgICAgIGlmICh0aGlzLl9jaGVja1dpdGhMYXN0KGlkKSkge1xuICAgICAgICAgICAgc2VsQmxvY2tzLnB1c2goaWQpO1xuICAgICAgICAgICAgdGhpcy5ibG9ja3NbaWRdLnNlbGVjdCgpO1xuXG4gICAgICAgICAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW0odGhpcy5fY2FsY0NoYWluU3VtKCkpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlUGF0aCgpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHNlbEJsb2Nrc1tzZWxCbG9ja3MubGVuZ3RoIC0gMl0gPT0gaWQpIHtcbiAgICAgICAgICAgIHZhciBsYXN0QmxJZCA9IHNlbEJsb2Nrcy5wb3AoKTtcbiAgICAgICAgICAgIHRoaXMuYmxvY2tzW2xhc3RCbElkXS51bnNlbGVjdCgpO1xuXG4gICAgICAgICAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW0odGhpcy5fY2FsY0NoYWluU3VtKCkpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlUGF0aCgpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLl91cGRhdGVQYXRoID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGN0eCA9IHRoaXMuY3R4O1xuXG4gICAgdGhpcy5fY2xlYXJQYXRoKCk7XG5cbiAgICBjdHguYmVnaW5QYXRoKCk7XG5cbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBnYW1lQ29uZmlnLnBhdGguY29sb3I7XG4gICAgY3R4LmxpbmVXaWR0aCA9IGdhbWVDb25maWcucGF0aC53aWR0aDtcblxuICAgIHRoaXMuc2VsZWN0ZWRCbG9ja3MuZm9yRWFjaChmdW5jdGlvbihpZCwgaSkge1xuICAgICAgICB2YXIgYmxvY2sgPSB0aGlzLmJsb2Nrc1tpZF07XG4gICAgICAgIHZhciB4ID0gKGJsb2NrLnggKyAwLjUpICogYmxvY2sud2lkdGg7XG4gICAgICAgIHZhciB5ID0gZ2FtZUNvbmZpZy5maWVsZC5oZWlnaHQgLSAoYmxvY2sueSArIDAuNSkgKiBibG9jay5oZWlnaHQ7XG5cbiAgICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAgIGN0eC5tb3ZlVG8oeCwgeSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdHgubGluZVRvKHgsIHkpO1xuICAgICAgICB9XG4gICAgfSwgdGhpcyk7XG5cbiAgICBjdHguc3Ryb2tlKCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2NsZWFyUGF0aCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCBnYW1lQ29uZmlnLmZpZWxkLndpZHRoLCBnYW1lQ29uZmlnLmZpZWxkLmhlaWdodCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuYmxvY2tNb3VzZU91dCA9IGZ1bmN0aW9uKGlkKSB7XG5cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY2FsY0NoYWluU3VtID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZhbHVlID0gdGhpcy5ibG9ja3NbdGhpcy5zZWxlY3RlZEJsb2Nrc1swXV0udmFsdWUgfHwgMDtcblxuICAgIHJldHVybiB2YWx1ZSAqIHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9jYWxjVXBkYXRlU2NvcmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLmJsb2Nrc1t0aGlzLnNlbGVjdGVkQmxvY2tzWzBdXS52YWx1ZTtcblxuICAgIHZhciBrID0gMSArIDAuMiAqICh0aGlzLnNlbGVjdGVkQmxvY2tzLmxlbmd0aCAtIDMpO1xuXG4gICAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgKiB0aGlzLnNlbGVjdGVkQmxvY2tzLmxlbmd0aCAqIGspO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9ibG9ja1JlbW92ZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGJsb2NrID0gdGhpcy5ibG9ja3NbaWRdO1xuXG4gICAgdGhpcy5lbGVtZW50LnJlbW92ZUNoaWxkKGJsb2NrLmVsZW1lbnQpO1xuXG4gICAgdGhpcy5fYmxvY2tzWFlbYmxvY2sueF1bYmxvY2sueV0gPSBudWxsO1xuICAgIGRlbGV0ZSB0aGlzLmJsb2Nrc1tpZF07XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX3J1blNlbGVjdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoIDwgdGhpcy5jb25maWcuY2hhaW4ubWluTGVuZ3RoKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5nYW1lLnVwZGF0ZVNjb3JlKHRoaXMuX2NhbGNVcGRhdGVTY29yZSgpKTtcblxuICAgIHZhciBsYXN0QmxJZCA9IHRoaXMuc2VsZWN0ZWRCbG9ja3MucG9wKCk7XG4gICAgdmFyIGxhc3RCbCA9IHRoaXMuYmxvY2tzW2xhc3RCbElkXTtcbiAgICB2YXIgdmFsdWUgPSBsYXN0QmwudmFsdWUgKiAodGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggKyAxKTsgLy8gKzEgYmVjYXVzZSBwb3AgYWJvdmVcblxuICAgIGxhc3RCbC5jaGFuZ2VWYWx1ZSh2YWx1ZSk7XG5cbiAgICB0aGlzLnNlbGVjdGVkQmxvY2tzLmZvckVhY2godGhpcy5fYmxvY2tSZW1vdmUsIHRoaXMpO1xuXG4gICAgdGhpcy5fY2hlY2tQb3NpdGlvbnMoKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY2hlY2tQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB2YXIgYmxvY2tzWFkgPSB0aGlzLl9ibG9ja3NYWTtcbiAgICB2YXIgYmxvY2tzID0gdGhpcy5ibG9ja3M7XG5cbiAgICB1dGlsLmZvckVhY2goYmxvY2tzWFksIGZ1bmN0aW9uKGJsb2Nrc1kpIHtcbiAgICAgICAgdmFyIGFyciA9IFtdO1xuXG4gICAgICAgIC8vINC00L7QsdCw0LLQu9GP0LXQvCDQsiDQvNCw0YHRgdC40LIg0YHRg9GJ0LXRgdGC0LLRg9GO0YnQuNC1INCy0LXRgNGC0LjQutCw0LvRjNC90YvQtSDRjdC70LXQvNC10L3RgtGLXG4gICAgICAgIHV0aWwuZm9yRWFjaChibG9ja3NZLCBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgaWYgKGlkKSB7IGFyci5wdXNoKGlkKTsgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyDQtdGB0LvQuCDQv9C+0LvQvdGL0Lkg0LjQu9C4INC/0YPRgdGC0L7QuVxuICAgICAgICBpZiAoYXJyLmxlbmd0aCA9PSBzZWxmLnNpemVbMV0gfHwgIWFycikgeyByZXR1cm47IH1cblxuICAgICAgICAvLyDRgdC+0YDRgtC40YDRg9C10LxcbiAgICAgICAgYXJyLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGJsb2Nrc1thXS55ID4gYmxvY2tzW2JdLnk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vINGB0LTQstC40LPQsNC10Lwg0L7RgtGB0L7RgNGC0LjRgNC+0LLQsNC90L3Ri9C5INGB0L/QuNGB0L7QuiDQuiDQvdC40LfRg1xuICAgICAgICBhcnIuZm9yRWFjaChmdW5jdGlvbihpZCwgeSkge1xuICAgICAgICAgICAgdmFyIGJsb2NrID0gYmxvY2tzW2lkXTtcblxuICAgICAgICAgICAgaWYgKGJsb2NrLnkgIT0geSkge1xuICAgICAgICAgICAgICAgIGJsb2Nrc1lbYmxvY2sueV0gPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgYmxvY2suY2hhbmdlUG9zaXRpb24oYmxvY2sueCwgeSk7XG5cbiAgICAgICAgICAgICAgICBibG9ja3NZW3ldID0gaWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fYWRkTmV3QmxvY2tzKCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2FkZE5ld0Jsb2NrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBibG9ja3NYWSA9IHRoaXMuX2Jsb2Nrc1hZO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNpemVbMF07IGkrKykge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuc2l6ZVsxXTsgaisrKSB7XG4gICAgICAgICAgICBpZiAoIWJsb2Nrc1hZW2ldW2pdKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVCbG9jayhpLCBqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRmllbGQ7XG4iLCJ2YXIgRmllbGQgPSByZXF1aXJlKCcuL2ZpZWxkLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuZnVuY3Rpb24gR2FtZShuYW1lLCBzdGF0ZSkge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnLmxldmVsc1tuYW1lXTtcbiAgICB0aGlzLnNjb3JlID0gMDtcbiAgICB0aGlzLl9pc1dpbiA9IEJvb2xlYW4oc3RhdGUud2luTGV2ZWxzLmluZGV4T2YobmFtZSkgIT09IC0xKTtcblxuICAgIHRoaXMuZmllbGQgPSBuZXcgRmllbGQodGhpcyk7XG5cbiAgICB0aGlzLl9jcmVhdGVFbGVtZW50KCk7XG4gICAgdGhpcy5fYmluZEV2ZW50cygpO1xufVxuXG5HYW1lLnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWxlbWVudC5jbGFzc05hbWUgPSAnZ2FtZSc7XG5cbiAgICB2YXIgZ2FtZUhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGdhbWVIZWFkZXIuY2xhc3NOYW1lID0gJ2dhbWVfX2hlYWRlcic7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChnYW1lSGVhZGVyKTtcblxuICAgIHZhciBzY29yZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHNjb3JlLmNsYXNzTmFtZSA9ICdnYW1lX19zY29yZSc7XG4gICAgc2NvcmUuaW5uZXJIVE1MID0gJzAnO1xuICAgIGdhbWVIZWFkZXIuYXBwZW5kQ2hpbGQoc2NvcmUpO1xuXG4gICAgdmFyIGNoYWluU3VtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY2hhaW5TdW0uY2xhc3NOYW1lID0gJ2dhbWVfX2NoYWluU3VtJztcbiAgICBnYW1lSGVhZGVyLmFwcGVuZENoaWxkKGNoYWluU3VtKTtcblxuICAgIHZhciBnb2FsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZ29hbC5jbGFzc05hbWUgPSAnZ2FtZV9fZ29hbCc7XG4gICAgZ2FtZUhlYWRlci5hcHBlbmRDaGlsZChnb2FsKTtcblxuICAgIHZhciBnYW1lQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGdhbWVCb2R5LmNsYXNzTmFtZSA9ICdnYW1lX19ib2R5JztcbiAgICBnb2FsLmlubmVySFRNTCA9ICdHb2FsOiAnICsgdGhpcy5jb25maWcuZ29hbDtcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGdhbWVCb2R5KTtcblxuICAgIGdhbWVCb2R5LmFwcGVuZENoaWxkKHRoaXMuZmllbGQuZWxlbWVudCk7XG5cbiAgICB2YXIgZ2FtZUZvb3RlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGdhbWVGb290ZXIuY2xhc3NOYW1lID0gJ2dhbWVfX2Zvb3Rlcic7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChnYW1lRm9vdGVyKTtcblxuICAgIHZhciBiYWNrQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgYmFja0J1dHRvbi5jbGFzc05hbWUgPSAnZ2FtZV9fYmFja0J1dHRvbic7XG4gICAgYmFja0J1dHRvbi5pbm5lckhUTUwgPSAnTWVudSc7XG4gICAgZ2FtZUZvb3Rlci5hcHBlbmRDaGlsZChiYWNrQnV0dG9uKTtcblxuICAgIHZhciByZXN0YXJ0QnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgcmVzdGFydEJ1dHRvbi5jbGFzc05hbWUgPSAnZ2FtZV9fcmVzdGFydEJ1dHRvbic7XG4gICAgcmVzdGFydEJ1dHRvbi5pbm5lckhUTUwgPSAnUmVzdGFydCc7XG4gICAgZ2FtZUZvb3Rlci5hcHBlbmRDaGlsZChyZXN0YXJ0QnV0dG9uKTtcblxuICAgIHZhciBuZXh0QnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbmV4dEJ1dHRvbi5jbGFzc05hbWUgPSAnZ2FtZV9fbmV4dEJ1dHRvbic7XG4gICAgbmV4dEJ1dHRvbi5pbm5lckhUTUwgPSAnTmV4dCc7XG4gICAgZ2FtZUZvb3Rlci5hcHBlbmRDaGlsZChuZXh0QnV0dG9uKTtcblxuICAgIGlmICh0aGlzLl9pc1dpbikge1xuICAgICAgICB1dGlsLmFkZENsYXNzKGVsZW1lbnQsICdfd2luJyk7XG4gICAgfVxuXG4gICAgdGhpcy5iYWNrQnV0dG9uID0gYmFja0J1dHRvbjtcbiAgICB0aGlzLnJlc3RhcnRCdXR0b24gPSByZXN0YXJ0QnV0dG9uO1xuICAgIHRoaXMubmV4dEJ1dHRvbiA9IG5leHRCdXR0b247XG5cbiAgICB0aGlzLnNjb3JlRWxlbWVudCA9IHNjb3JlO1xuICAgIHRoaXMuY2hhaW5TdW1FbGVtZW50ID0gY2hhaW5TdW07XG5cbiAgICB0aGlzLmJvZHlFbGVtZW50ID0gZ2FtZUJvZHk7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbn07XG5cbkdhbWUucHJvdG90eXBlLl9iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5vbih0aGlzLnJlc3RhcnRCdXR0b24sICdjbGljaycsIHRoaXMucmVzdGFydC5iaW5kKHRoaXMpKTtcbiAgICB1dGlsLm9uKHRoaXMuYmFja0J1dHRvbiwgJ2NsaWNrJywgdGhpcy5fYmFja1RvTWVudS5iaW5kKHRoaXMpKTtcbiAgICB1dGlsLm9uKHRoaXMubmV4dEJ1dHRvbiwgJ2NsaWNrJywgdGhpcy5fbmV4dExldmVsLmJpbmQodGhpcykpO1xufTtcblxuR2FtZS5wcm90b3R5cGUuX25leHRMZXZlbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3RhdGUubmV4dEZyb21MZXZlbCgpO1xufTtcblxuR2FtZS5wcm90b3R5cGUucmVzdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXdGaWVsZCA9IG5ldyBGaWVsZCh0aGlzKTtcblxuICAgIHRoaXMuYm9keUVsZW1lbnQucmVwbGFjZUNoaWxkKG5ld0ZpZWxkLmVsZW1lbnQsIHRoaXMuZmllbGQuZWxlbWVudCk7XG5cbiAgICB0aGlzLnNjb3JlID0gMDtcbiAgICB0aGlzLnNjb3JlRWxlbWVudC5pbm5lckhUTUwgPSAwO1xuXG4gICAgdGhpcy5maWVsZCA9IG5ld0ZpZWxkO1xufTtcblxuR2FtZS5wcm90b3R5cGUuX2JhY2tUb01lbnUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN0YXRlLmJhY2tGcm9tTGV2ZWwoKTtcbn07XG5cbkdhbWUucHJvdG90eXBlLnVwZGF0ZUNoYWluU3VtID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy5jaGFpblN1bUVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XG4gICAgICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5jaGFpblN1bUVsZW1lbnQsICdfc2hvd2VkJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyh0aGlzLmNoYWluU3VtRWxlbWVudCwgJ19zaG93ZWQnKTtcbiAgICB9XG59O1xuXG5HYW1lLnByb3RvdHlwZS51cGRhdGVTY29yZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdGhpcy5zY29yZSArPSB2YWx1ZTtcbiAgICB0aGlzLnNjb3JlRWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLnNjb3JlO1xuXG4gICAgdGhpcy5fY2hlY2tXaW4oKTtcbn07XG5cbkdhbWUucHJvdG90eXBlLl9jaGVja1dpbiA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5faXNXaW4gJiYgdGhpcy5zY29yZSA+PSB0aGlzLmNvbmZpZy53aW5Db25kaXRpb24uc2NvcmUpIHtcbiAgICAgICAgdGhpcy5faXNXaW4gPSB0cnVlO1xuICAgICAgICB0aGlzLnN0YXRlLmxldmVsV2luKHRoaXMubmFtZSk7XG4gICAgICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5lbGVtZW50LCAnX3dpbicpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR2FtZTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGZpZWxkOiB7XG4gICAgICAgIHdpZHRoOiA1MDAsXG4gICAgICAgIGhlaWdodDogNTAwXG4gICAgfSxcbiAgICBwYXRoOiB7XG4gICAgICAgIGNvbG9yOiAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjI1KScsXG4gICAgICAgIHdpZHRoOiAxMFxuICAgIH0sXG4gICAgbGV2ZWxzOiBbMSwgMl1cbn07XG4iLCJ2YXIgZ2FtZUNvbmZpZyA9IHJlcXVpcmUoJy4uL2dhbWVDb25maWcuanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xuXG5mdW5jdGlvbiBMZXZlbE1lbnUoc3RhdGUpIHtcbiAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG5cbiAgICB0aGlzLl9sZXZlbEJsb2NrcyA9IHt9O1xuXG4gICAgdGhpcy5fY3JlYXRlRWxlbWVudCgpO1xuICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcbn1cblxuTGV2ZWxNZW51LnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWxlbWVudC5jbGFzc05hbWUgPSAnbGV2ZWxNZW51JztcblxuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb250YWluZXIuY2xhc3NOYW1lID0gJ2xldmVsTWVudV9fY29udGFpbmVyJztcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG5cbiAgICB2YXIgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgaGVhZGVyLmNsYXNzTmFtZSA9ICdsZXZlbE1lbnVfX2hlYWRlcic7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGhlYWRlcik7XG5cbiAgICB2YXIgbGV2ZWxzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbGV2ZWxzLmNsYXNzTmFtZSA9ICdsZXZlbE1lbnVfX2hlYWRlckxldmVscyc7XG4gICAgbGV2ZWxzLmlubmVySFRNTCA9ICdMZXZlbHM6JztcbiAgICBoZWFkZXIuYXBwZW5kQ2hpbGQobGV2ZWxzKTtcblxuICAgIHZhciBib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgYm9keS5jbGFzc05hbWUgPSAnbGV2ZWxNZW51X19ib2R5JztcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoYm9keSk7XG5cbiAgICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICBnYW1lQ29uZmlnLmxldmVscy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUsIGkpIHtcbiAgICAgICAgdmFyIGxldmVsQmxvY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgbGV2ZWxCbG9jay5jbGFzc05hbWUgPSAnbGV2ZWxNZW51X19sZXZlbEJsb2NrIF9sZXZlbF8nICsgaSAlIDI7XG4gICAgICAgIGxldmVsQmxvY2suaW5uZXJIVE1MID0gbmFtZTtcblxuICAgICAgICB1dGlsLm9uKGxldmVsQmxvY2ssICdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5zdGF0ZS5ydW5MZXZlbChuYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2VsZi5fbGV2ZWxCbG9ja3NbbmFtZV0gPSBsZXZlbEJsb2NrO1xuXG4gICAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGxldmVsQmxvY2spO1xuICAgIH0pO1xuXG4gICAgYm9keS5hcHBlbmRDaGlsZChmcmFnbWVudCk7XG5cbiAgICB2YXIgZm9vdGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZm9vdGVyLmNsYXNzTmFtZSA9ICdsZXZlbE1lbnVfX2Zvb3Rlcic7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGZvb3Rlcik7XG5cbiAgICB2YXIgYmFja0J1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGJhY2tCdXR0b24uY2xhc3NOYW1lID0gJ2xldmVsTWVudV9fYmFja0J1dHRvbic7XG4gICAgYmFja0J1dHRvbi5pbm5lckhUTUwgPSAnQmFjayc7XG4gICAgZm9vdGVyLmFwcGVuZENoaWxkKGJhY2tCdXR0b24pO1xuXG4gICAgdGhpcy5iYWNrQnV0dG9uID0gYmFja0J1dHRvbjtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xufTtcblxuTGV2ZWxNZW51LnByb3RvdHlwZS5fYmluZEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwub24odGhpcy5iYWNrQnV0dG9uLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zdGF0ZS5ydW5NYWluTWVudSgpO1xuICAgIH0uYmluZCh0aGlzKSk7XG59O1xuXG5MZXZlbE1lbnUucHJvdG90eXBlLnVwZGF0ZU9wZW5MZXZlbHMgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN0YXRlLm9wZW5MZXZlbHMuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5fbGV2ZWxCbG9ja3NbbmFtZV0sICdfb3BlbicpO1xuICAgIH0sIHRoaXMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBMZXZlbE1lbnU7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAxOiByZXF1aXJlKCcuL2xldmVscy8xJyksXG4gICAgMjogcmVxdWlyZSgnLi9sZXZlbHMvMicpXG59O1xuIiwidmFyIEdhbWUgPSByZXF1aXJlKCcuLi9nYW1lL2dhbWUuanMnKTtcblxuZnVuY3Rpb24gTGV2ZWwobmFtZSwgbGV2ZWxNZW51KSB7XG4gICAgR2FtZS5jYWxsKHRoaXMsIG5hbWUsIGxldmVsTWVudSk7XG59XG5cbkxldmVsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoR2FtZS5wcm90b3R5cGUpO1xuTGV2ZWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTGV2ZWw7XG5cbm1vZHVsZS5leHBvcnRzID0gTGV2ZWw7XG4iLCJ2YXIgR2FtZSA9IHJlcXVpcmUoJy4uL2dhbWUvZ2FtZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWU7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcblxuZnVuY3Rpb24gTWVudShzdGF0ZSkge1xuICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB0aGlzLl9pc1Jlc3VtZUFjdGl2ZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5fY3JlYXRlRWxlbWVudCgpO1xuICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcbn1cblxuTWVudS5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ21haW5NZW51JztcbiAgICBlbGVtZW50LmlubmVySFRNTCA9XG4gICAgICAgICc8ZGl2IGNsYXNzPVwibWFpbk1lbnVfX2hlYWRlclwiPicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJtYWluTWVudV9fdGl0bGVcIj5DaGFpbnVtYmVyPC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJtYWluTWVudV9fYm9keVwiPicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJtYWluTWVudV9fbmV3R2FtZVwiPk5ldyBnYW1lPC9kaXY+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cIm1haW5NZW51X19yZXN1bWVHYW1lXCI+UmVzdW1lIGdhbWU8L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cIm1haW5NZW51X19mb290ZXJcIj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwibWFpbk1lbnVfX3ZlcnNpb25cIj52MC4wLjE8L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2Pic7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMubmV3R2FtZUJ1dHRvbiA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbWFpbk1lbnVfX25ld0dhbWUnKVswXTtcbiAgICB0aGlzLnJlc3VtZUdhbWVCdXR0b24gPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ21haW5NZW51X19yZXN1bWVHYW1lJylbMF07XG59O1xuXG5NZW51LnByb3RvdHlwZS5fYmluZEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwub24odGhpcy5uZXdHYW1lQnV0dG9uLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zdGF0ZS5ydW5MZXZlbE1lbnUoKTtcbiAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgdXRpbC5vbih0aGlzLnJlc3VtZUdhbWVCdXR0b24sICdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnN0YXRlLnJlc3VtZUxldmVsKCk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbn07XG5cbk1lbnUucHJvdG90eXBlLnJlc3VtZUxldmVsQWN0aXZlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX2lzUmVzdW1lQWN0aXZlKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5faXNSZXN1bWVBY3RpdmUgPSB0cnVlO1xuICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5lbGVtZW50LCAnX2FjdGl2ZUxldmVsJyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbnU7XG4iLCJ2YXIgTGV2ZWxNZW51ID0gcmVxdWlyZSgnLi9sZXZlbE1lbnUvbGV2ZWxNZW51Jyk7XG52YXIgTWFpbk1lbnUgPSByZXF1aXJlKCcuL21haW5NZW51L21haW5NZW51Jyk7XG5cbnZhciBsZXZlbE1vZHVsZXMgPSByZXF1aXJlKCcuL2xldmVsTW9kdWxlcycpO1xudmFyIGdhbWVDb25maWcgPSByZXF1aXJlKCcuL2dhbWVDb25maWcuanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbmZ1bmN0aW9uIFN0YXRlKCkge1xuICAgIHRoaXMuX2FjdGl2ZUVsZW1lbnQgPSBudWxsO1xuICAgIHRoaXMuX2FjdGl2ZUxldmVsID0gbnVsbDtcbiAgICB0aGlzLndpbkxldmVscyA9IFtdO1xuICAgIHRoaXMub3BlbkxldmVscyA9IFtnYW1lQ29uZmlnLmxldmVsc1swXV07XG5cbiAgICB0aGlzLmxldmVsTWVudSA9IG5ldyBMZXZlbE1lbnUodGhpcyk7XG4gICAgdGhpcy5tYWluTWVudSA9IG5ldyBNYWluTWVudSh0aGlzKTtcblxuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcblxuICAgIHRoaXMubGV2ZWxNZW51LnVwZGF0ZU9wZW5MZXZlbHMoKTtcbn1cblxuU3RhdGUucHJvdG90eXBlLl9jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9ICdzdGF0ZSc7XG4gICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9XG4gICAgICAgICc8ZGl2IGNsYXNzPVwic3RhdGVfX21haW5NZW51XCI+PC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwic3RhdGVfX2xldmVsTWVudVwiPjwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInN0YXRlX19hY3RpdmVMZXZlbFwiPjwvZGl2Pic7XG5cbiAgICB0aGlzLm1haW5NZW51RWxlbWVudCA9IHRoaXMuZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzdGF0ZV9fbWFpbk1lbnUnKVswXTtcbiAgICB0aGlzLm1haW5NZW51RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLm1haW5NZW51LmVsZW1lbnQpO1xuXG4gICAgdGhpcy5sZXZlbE1lbnVFbGVtZW50ID0gdGhpcy5lbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3N0YXRlX19sZXZlbE1lbnUnKVswXTtcbiAgICB0aGlzLmxldmVsTWVudUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5sZXZlbE1lbnUuZWxlbWVudCk7XG5cbiAgICB0aGlzLmFjdGl2ZUxldmVsRWxlbWVudCA9IHRoaXMuZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzdGF0ZV9fYWN0aXZlTGV2ZWwnKVswXTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5fYWN0aXZhdGUgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgaWYgKHRoaXMuX2FjdGl2ZUVsZW1lbnQgPT09IGVsZW1lbnQpIHsgcmV0dXJuOyB9XG5cbiAgICBpZiAodGhpcy5fYWN0aXZlRWxlbWVudCkge1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuX2FjdGl2ZUVsZW1lbnQsICdfc2hvd2VkJyk7XG4gICAgfVxuXG4gICAgdXRpbC5hZGRDbGFzcyhlbGVtZW50LCAnX3Nob3dlZCcpO1xuICAgIHRoaXMuX2FjdGl2ZUVsZW1lbnQgPSBlbGVtZW50O1xufTtcblxuU3RhdGUucHJvdG90eXBlLnJ1bkxldmVsTWVudSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX2FjdGl2YXRlKHRoaXMubGV2ZWxNZW51RWxlbWVudCk7XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUucnVuTWFpbk1lbnUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9hY3RpdmF0ZSh0aGlzLm1haW5NZW51RWxlbWVudCk7XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUucnVuTGV2ZWwgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIGlzT3BlbiA9IHRoaXMub3BlbkxldmVscy5pbmRleE9mKG5hbWUpICE9PSAtMTtcblxuICAgIGlmICghaXNPcGVuKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5tYWluTWVudS5yZXN1bWVMZXZlbEFjdGl2ZSgpO1xuXG4gICAgdmFyIG5ld0xldmVsID0gbmV3IGxldmVsTW9kdWxlc1tuYW1lXShuYW1lLCB0aGlzKTtcblxuICAgIGlmICh0aGlzLl9hY3RpdmVMZXZlbCkge1xuICAgICAgICB0aGlzLmFjdGl2ZUxldmVsRWxlbWVudC5yZXBsYWNlQ2hpbGQobmV3TGV2ZWwuZWxlbWVudCwgdGhpcy5fYWN0aXZlTGV2ZWwuZWxlbWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hY3RpdmVMZXZlbEVsZW1lbnQuYXBwZW5kQ2hpbGQobmV3TGV2ZWwuZWxlbWVudCk7XG4gICAgfVxuXG4gICAgdGhpcy5fYWN0aXZlTGV2ZWwgPSBuZXdMZXZlbDtcblxuICAgIHRoaXMuX2FjdGl2YXRlKHRoaXMuYWN0aXZlTGV2ZWxFbGVtZW50KTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5uZXh0RnJvbUxldmVsID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGN1cnJlbnROYW1lSW5kZXggPSB0aGlzLm9wZW5MZXZlbHMuaW5kZXhPZih0aGlzLl9hY3RpdmVMZXZlbC5uYW1lKTtcblxuICAgIHZhciBuZXh0TGV2ZWxOYW1lID0gdGhpcy5vcGVuTGV2ZWxzW2N1cnJlbnROYW1lSW5kZXggKyAxXTtcblxuICAgIGlmIChuZXh0TGV2ZWxOYW1lKSB7XG4gICAgICAgIHRoaXMucnVuTGV2ZWwobmV4dExldmVsTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5ydW5MZXZlbE1lbnUoKTtcbiAgICB9XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUubGV2ZWxXaW4gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdGhpcy53aW5MZXZlbHMucHVzaChuYW1lKTtcblxuICAgIHRoaXMuX29wZW5OZXh0TGV2ZWwoKTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5fb3Blbk5leHRMZXZlbCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXh0TGV2ZWxOYW1lID0gZ2FtZUNvbmZpZy5sZXZlbHNbdGhpcy5vcGVuTGV2ZWxzLmxlbmd0aF07XG5cbiAgICBpZiAobmV4dExldmVsTmFtZSkge1xuICAgICAgICB0aGlzLm9wZW5MZXZlbHMucHVzaChuZXh0TGV2ZWxOYW1lKTtcbiAgICB9XG5cbiAgICB0aGlzLmxldmVsTWVudS51cGRhdGVPcGVuTGV2ZWxzKCk7XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUuYmFja0Zyb21MZXZlbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucnVuTWFpbk1lbnUoKTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5yZXN1bWVMZXZlbCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9hY3RpdmVMZXZlbCkge1xuICAgICAgICB0aGlzLl9hY3RpdmF0ZSh0aGlzLmFjdGl2ZUxldmVsRWxlbWVudCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZTsiLCJ2YXIgdXRpbCA9IHt9O1xuXG51dGlsLmFkZENsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgIHZhciBpbmRleCA9IGNsYXNzTmFtZXMuaW5kZXhPZihuYW1lKTtcblxuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgY2xhc3NOYW1lcy5wdXNoKG5hbWUpO1xuICAgICAgICBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWVzLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWw7XG59O1xuXG51dGlsLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgIHZhciBpbmRleCA9IGNsYXNzTmFtZXMuaW5kZXhPZihuYW1lKTtcblxuICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgY2xhc3NOYW1lcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWVzLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWw7XG59O1xuXG51dGlsLmhhc0NsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuXG4gICAgcmV0dXJuIGNsYXNzTmFtZXMuaW5kZXhPZihuYW1lKSAhPSAtMTtcbn07XG5cbnV0aWwuZm9yRWFjaCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqLmxlbmd0aCkge1xuICAgICAgICBvYmouZm9yRWFjaChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5XSwga2V5KTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxudXRpbC5vbiA9IGZ1bmN0aW9uKG5vZGUsIHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGNhbGxiYWNrKTtcbn07XG5cbnV0aWwub2ZmID0gZnVuY3Rpb24obm9kZSwgdHlwZSwgY2FsbGJhY2spIHtcbiAgICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgY2FsbGJhY2spO1xufTtcblxuXG4vLyBTZWVtIGxlZ2l0XG52YXIgaXNNb2JpbGUgPSAoJ0RldmljZU9yaWVudGF0aW9uRXZlbnQnIGluIHdpbmRvdyB8fCAnb3JpZW50YXRpb24nIGluIHdpbmRvdyk7XG4vLyBCdXQgd2l0aCBteSBDaHJvbWUgb24gd2luZG93cywgRGV2aWNlT3JpZW50YXRpb25FdmVudCA9PSBmY3QoKVxuaWYgKC9XaW5kb3dzIE5UfE1hY2ludG9zaHxNYWMgT1MgWHxMaW51eC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIGlzTW9iaWxlID0gZmFsc2U7XG4vLyBNeSBhbmRyb2lkIGhhdmUgXCJsaW51eFwiIHRvb1xuaWYgKC9Nb2JpbGUvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSBpc01vYmlsZSA9IHRydWU7XG5cbnV0aWwuaXNNb2JpbGUgPSBpc01vYmlsZTtcblxudXRpbC5yZ2JTdW0gPSBmdW5jdGlvbihhcnIpIHtcbiAgICAvL1t7cmdiLCByYXRpb30sIC4uLl1cblxuICAgIHZhciBzdW0gPSBbMCwgMCwgMF07XG4gICAgdmFyIG4gPSAwO1xuICAgIHZhciBlbCwgaSwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZWwgPSBhcnJbaV07XG5cbiAgICAgICAgZm9yIChqID0gMDsgaiA8IDM7IGorKykge1xuICAgICAgICAgICAgc3VtW2pdICs9IGVsLnJnYltqXSAqIGVsLnJhdGlvO1xuICAgICAgICB9XG5cbiAgICAgICAgbiArPSBlbC5yYXRpbztcbiAgICB9XG5cbiAgICBmb3IgKGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICAgIHN1bVtqXSA9IE1hdGguZmxvb3Ioc3VtW2pdIC8gbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1bTtcbn07XG5cbnV0aWwubnVsbEZuID0gZnVuY3Rpb24oKSB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsO1xuIl19