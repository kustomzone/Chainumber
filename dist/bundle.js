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

},{"./state.js":14,"./util.js":15}],2:[function(require,module,exports){
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
    inner.innerHTML = this.value;
    element.appendChild(inner);

    var active = document.createElement('div');
    active.className = 'block__active';
    element.appendChild(active);

    this.innerElement = inner;
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
    this.innerElement.innerHTML = value;

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

},{"../util.js":15,"./colors.js":3}],3:[function(require,module,exports){
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
    this.config = game.store;

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

},{"../gameConfig":6,"../util":15,"./block.js":2}],5:[function(require,module,exports){
var levelStore = require('../levelStore.js');
var Field = require('./field.js');
var util = require('../util');

function Game(name, state) {
    this.name = name;
    this.state = state;
    this.store = levelStore.get(name);
    this.score = 0;

    this.field = new Field(this);

    this._createElement();
    this._bindEvents();
}

Game.prototype._createElement = function() {
    var element = document.createElement('div');
    element.className = 'game';

    var template =
        '<div class="game__header">' +
            '<div class="game__levelName">Level: {{name}}</div>' +
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

    element.innerHTML = template
        .replace('{{goal}}', this._getGoalText())
        .replace('{{name}}', this.name);

    if (this.store.currentGoal > 0) {
        util.addClass(element, '_win');
    }

    this.backButton = element.getElementsByClassName('game__backButton')[0];
    this.restartButton = element.getElementsByClassName('game__restartButton')[0];
    this.nextButton = element.getElementsByClassName('game__nextButton')[0];

    this.goalElement = element.getElementsByClassName('game__goal')[0];
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

Game.prototype._getGoalText = function() {
    if (this.store.currentGoal < 3) {
        return this.store.goals[this.store.currentGoal];
    }

    return '';
};

Game.prototype._nextLevel = function() {
    var nextLevel = levelStore.getNext(this.name);

    if (nextLevel && nextLevel.isOpen) {
        this.state.runLevel(nextLevel.name);
    }
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

    this._checkGoal();
};

Game.prototype._checkGoal = function() {
    if (this.store.currentGoal == 3) { return; }

    var store = this.store;

    if (this.score >= store.winConditions[store.currentGoal]) {
        store.currentGoal = Math.min(store.currentGoal + 1, 3);

        if (store.currentGoal == 1) { this._win(); }

        this.goalElement.innerHTML = this._getGoalText();
    }
};

Game.prototype._win = function() {
    util.addClass(this.element, '_win');
    levelStore.checkOpenLevels();
};

module.exports = Game;

},{"../levelStore.js":9,"../util":15,"./field.js":4}],6:[function(require,module,exports){
module.exports = {
    field: {
        width: 500,
        height: 500
    },
    path: {
        color: 'rgba(255, 255, 255, 0.25)',
        width: 10
    },
    levels: [1, 2, 3, 4, 5, 6, 7, 8],
    minOpenLevels: 5
};

},{}],7:[function(require,module,exports){
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

},{"../gameConfig.js":6,"../levelStore.js":9,"../util.js":15}],8:[function(require,module,exports){
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

},{"./levels/1":10,"./levels/2":11}],9:[function(require,module,exports){
var util = require('./util.js');
var saves = require('./saves.js');
var gameConfig = require('./gameConfig.js');

var levelConfig = config.levels;

var savedLevel = saves.getLevels();

var levelStore = {};

var levels = {};

function initLevels() {
    gameConfig.levels.forEach(function(name, i) {
        var level = levelConfig[name];
        level.name = name;
        level.currentGoal = savedLevel.currentGoal || 0;
        level.maxScore = savedLevel.maxScore || 0;

        levels[name] = level;
    });
}

levelStore.get = function(name) {
    return levels[name];
};

levelStore.getNext = function(name) {
    var nameIndex = gameConfig.levels.indexOf(name);

    if (nameIndex === -1) { return null; }

    var nextLevelName = gameConfig.levels[nameIndex + 1];

    if (!nextLevelName) { return null; }

    return levels[nextLevelName];
};

levelStore.checkOpenLevels = function() {
    var openLevelsLength = 0;

    gameConfig.levels.forEach(function(name, i) {
        var level = levels[name];

        if (level.currentGoal > 0) {
            openLevelsLength++;
        }

        level.isOpen = i < openLevelsLength + gameConfig.minOpenLevels;
    });
};

initLevels();
levelStore.checkOpenLevels();

module.exports = levelStore;

},{"./gameConfig.js":6,"./saves.js":13,"./util.js":15}],10:[function(require,module,exports){
var Game = require('../game/game.js');

function Level(name, levelMenu) {
    Game.call(this, name, levelMenu);
}

Level.prototype = Object.create(Game.prototype);
Level.prototype.constructor = Level;

module.exports = Level;

},{"../game/game.js":5}],11:[function(require,module,exports){
var Game = require('../game/game.js');

module.exports = Game;

},{"../game/game.js":5}],12:[function(require,module,exports){
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

},{"../util.js":15}],13:[function(require,module,exports){
var saves = {};

saves.getLevels = function() {
    var levelsJSON = localStorage.getItem('levels');
    var levels;

    if (levelsJSON) {
        try {
            levels = JSON.parse(levelsJSON);
        } catch (e) {
            levels = {};
        }
    } else {
        levels = {};
    }

    return levels;
};

module.exports = saves;

},{}],14:[function(require,module,exports){
var LevelMenu = require('./levelMenu/levelMenu');
var MainMenu = require('./mainMenu/mainMenu');

var levelModules = require('./levelModules');
var util = require('./util');

function State() {
    this._activeElement = null;
    this._activeLevel = null;

    this.levelMenu = new LevelMenu(this);
    this.mainMenu = new MainMenu(this);

    this._createElement();
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
    this.levelMenu.update();
    this._activate(this.levelMenuElement);
};

State.prototype.runMainMenu = function() {
    this._activate(this.mainMenuElement);
};

State.prototype.runLevel = function(name) {
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

State.prototype.backFromLevel = function() {
    this.runMainMenu();
};

State.prototype.resumeLevel = function() {
    if (this._activeLevel) {
        this._activate(this.activeLevelElement);
    }
};

module.exports = State;
},{"./levelMenu/levelMenu":7,"./levelModules":8,"./mainMenu/mainMenu":12,"./util":15}],15:[function(require,module,exports){
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


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvaW5kZXguanMiLCJzcmMvanMvZ2FtZS9ibG9jay5qcyIsInNyYy9qcy9nYW1lL2NvbG9ycy5qcyIsInNyYy9qcy9nYW1lL2ZpZWxkLmpzIiwic3JjL2pzL2dhbWUvZ2FtZS5qcyIsInNyYy9qcy9nYW1lQ29uZmlnLmpzIiwic3JjL2pzL2xldmVsTWVudS9sZXZlbE1lbnUuanMiLCJzcmMvanMvbGV2ZWxNb2R1bGVzLmpzIiwic3JjL2pzL2xldmVsU3RvcmUuanMiLCJzcmMvanMvbGV2ZWxzLzEuanMiLCJzcmMvanMvbGV2ZWxzLzIuanMiLCJzcmMvanMvbWFpbk1lbnUvbWFpbk1lbnUuanMiLCJzcmMvanMvc2F2ZXMuanMiLCJzcmMvanMvc3RhdGUuanMiLCJzcmMvanMvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgU3RhdGUgPSByZXF1aXJlKCcuL3N0YXRlLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG5pZiAoIXV0aWwuaXNNb2JpbGUpIHtcbiAgICB1dGlsLmFkZENsYXNzKGRvY3VtZW50LmJvZHksICduby10b3VjaCcpO1xufVxuXG52YXIgaHRtbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdnYW1lJyk7XG5cbnZhciBzdGF0ZSA9IG5ldyBTdGF0ZSgpO1xuXG5odG1sLmFwcGVuZENoaWxkKHN0YXRlLmVsZW1lbnQpO1xuXG5zdGF0ZS5ydW5NYWluTWVudSgpO1xuIiwidmFyIGNvbG9ycyA9IHJlcXVpcmUoJy4vY29sb3JzLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcblxudmFyIHByaW1lTnVtYmVycyA9IFsxLCAyLCAzLCA1LCA3LCAxMSwgMTNdO1xuXG52YXIgaWRDb3VudGVyID0gMDtcblxuLy8gY2FzaGUgb2YgY29sb3JzLCB2YWx1ZSAtPiByZ2IoLi4sLi4sLi4pXG52YXIgY29sb3JzQ2FjaGUgPSB7fTtcblxuZnVuY3Rpb24gQmxvY2soeCwgeSwgZmllbGQpIHtcbiAgICB0aGlzLmlkID0gKytpZENvdW50ZXI7XG5cbiAgICB0aGlzLmZpZWxkID0gZmllbGQ7XG4gICAgdGhpcy5jb25maWcgPSBmaWVsZC5jb25maWc7XG5cbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG5cbiAgICB0aGlzLnZhbHVlID0gbnVsbDtcbiAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuXG4gICAgdGhpcy53aWR0aCA9IDUwMCAvIHRoaXMuY29uZmlnLmZpZWxkLnNpemVbMF07XG4gICAgdGhpcy5oZWlnaHQgPSA1MDAgLyB0aGlzLmNvbmZpZy5maWVsZC5zaXplWzFdO1xuXG4gICAgdGhpcy5fc2V0UmFuZG9tVmFsdWUoKTtcbiAgICB0aGlzLl9jcmVhdGVFbGVtZW50KCk7XG4gICAgdGhpcy5fYmluZEV2ZW50cygpO1xufVxuXG5CbG9jay5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2Jsb2NrJztcblxuICAgIGVsZW1lbnQuc3R5bGUubGVmdCA9IE1hdGguZmxvb3IodGhpcy54ICogdGhpcy53aWR0aCkgKyAncHgnO1xuICAgIGVsZW1lbnQuc3R5bGUuYm90dG9tID0gTWF0aC5mbG9vcih0aGlzLnkgKiB0aGlzLmhlaWdodCkgKyAncHgnO1xuXG4gICAgdmFyIGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgaW5uZXIuY2xhc3NOYW1lID0gJ2Jsb2NrX19pbm5lcic7XG4gICAgaW5uZXIuaW5uZXJIVE1MID0gdGhpcy52YWx1ZTtcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGlubmVyKTtcblxuICAgIHZhciBhY3RpdmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBhY3RpdmUuY2xhc3NOYW1lID0gJ2Jsb2NrX19hY3RpdmUnO1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoYWN0aXZlKTtcblxuICAgIHRoaXMuaW5uZXJFbGVtZW50ID0gaW5uZXI7XG4gICAgdGhpcy5hY3RpdmVFbGVtZW50ID0gYWN0aXZlO1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cbiAgICB0aGlzLl91cGRhdGVDb2xvcnMoKTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5fc2V0UmFuZG9tVmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3VtbVJhdGlvbiA9IDA7XG4gICAgdmFyIHBvc3NpYmxlVmFsdWVzID0gdGhpcy5jb25maWcubnVtYmVycy5wb3NzaWJsZVZhbHVlcztcblxuICAgIHBvc3NpYmxlVmFsdWVzLmZvckVhY2goZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgc3VtbVJhdGlvbiArPSBlbFsxXTtcbiAgICB9KTtcblxuICAgIHZhciBzdW1tID0gMDtcblxuICAgIHZhciBjaGFuY2VBcnJheSA9IHBvc3NpYmxlVmFsdWVzLm1hcChmdW5jdGlvbihlbCkge1xuICAgICAgICB2YXIgdmFsID0gZWxbMV0gLyBzdW1tUmF0aW9uICsgc3VtbTtcblxuICAgICAgICBzdW1tID0gdmFsO1xuXG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSk7XG5cbiAgICB2YXIgcm9sbCA9IE1hdGgucmFuZG9tKCk7XG5cbiAgICB2YXIgdmFsdWUgPSAwO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGFuY2VBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocm9sbCA8PSBjaGFuY2VBcnJheVtpXSkge1xuICAgICAgICAgICAgdmFsdWUgPSBwb3NzaWJsZVZhbHVlc1tpXVswXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xufTtcblxuQmxvY2sucHJvdG90eXBlLl9iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHV0aWwuaXNNb2JpbGUpIHtcbiAgICAgICAgdXRpbC5vbih0aGlzLmVsZW1lbnQsICd0b3VjaHN0YXJ0JywgdGhpcy5fbW91c2VEb3duSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1dGlsLm9uKHRoaXMuZWxlbWVudCwgJ21vdXNlZG93bicsIHRoaXMuX21vdXNlRG93bkhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgICAgIHV0aWwub24odGhpcy5hY3RpdmVFbGVtZW50LCAnbW91c2VvdmVyJywgdGhpcy5fbW91c2VPdmVySGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICAgICAgLy91dGlsLm9uKHRoaXMuYWN0aXZlRWxlbWVudCwgJ21vdXNlb3V0JywgdGhpcy5fbW91c2VPdXRIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgIH1cbn07XG5cbkJsb2NrLnByb3RvdHlwZS5fbW91c2VEb3duSGFuZGxlciA9IGZ1bmN0aW9uKGV2KSB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcblxuICAgIHRoaXMuZmllbGQuYmxvY2tNb3VzZURvd24odGhpcy5pZCk7XG59O1xuXG5cbkJsb2NrLnByb3RvdHlwZS5fbW91c2VPdmVySGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZmllbGQuYmxvY2tNb3VzZU92ZXIodGhpcy5pZCk7XG59O1xuXG5cbkJsb2NrLnByb3RvdHlwZS5fbW91c2VPdXRIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5maWVsZC5ibG9ja01vdXNlT3V0KHRoaXMuaWQpO1xufTtcblxuQmxvY2sucHJvdG90eXBlLmNoYW5nZVBvc2l0aW9uID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcblxuICAgIHRoaXMuZWxlbWVudC5zdHlsZS5sZWZ0ID0gTWF0aC5mbG9vcih4ICogdGhpcy53aWR0aCkgKyAncHgnO1xuICAgIHRoaXMuZWxlbWVudC5zdHlsZS5ib3R0b20gPSBNYXRoLmZsb29yKHkgKiB0aGlzLmhlaWdodCkgKyAncHgnO1xufTtcblxuQmxvY2sucHJvdG90eXBlLl91cGRhdGVDb2xvcnMgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIWNvbG9yc0NhY2hlW3RoaXMudmFsdWVdKSB7XG4gICAgICAgIC8vIDcgLT4gMyAocHJpbWVOdW1iZXIgLT4gcmF0aW8pXG4gICAgICAgIHZhciBwcmltZUFycmF5ID0gW107XG4gICAgICAgIHZhciBpO1xuXG4gICAgICAgIGZvciAoaSA9IHByaW1lTnVtYmVycy5sZW5ndGggLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICAgICAgICBpZiAodGhpcy52YWx1ZSAlIHByaW1lTnVtYmVyc1tpXSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHByaW1lQXJyYXkucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwcmltZU51bWJlcnNbaV0sXG4gICAgICAgICAgICAgICAgICAgIHJnYjogY29sb3JzW2ldLnJnYixcbiAgICAgICAgICAgICAgICAgICAgcmF0aW86IHRoaXMudmFsdWUgLyBwcmltZU51bWJlcnNbaV1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjb2xvcjtcblxuICAgICAgICBpZiAocHJpbWVBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbG9yID0gdXRpbC5yZ2JTdW0ocHJpbWVBcnJheSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb2xvciA9IGNvbG9yc1swXS5yZ2I7XG4gICAgICAgIH1cblxuICAgICAgICBjb2xvcnNDYWNoZVt0aGlzLnZhbHVlXSA9ICdyZ2IoJyArIGNvbG9yLmpvaW4oJywnKSArICcpJztcbiAgICB9XG5cbiAgICB0aGlzLmlubmVyRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvcnNDYWNoZVt0aGlzLnZhbHVlXTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5jaGFuZ2VWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMuaW5uZXJFbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuXG4gICAgdGhpcy5fdXBkYXRlQ29sb3JzKCk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5hZGRDbGFzcyh0aGlzLmVsZW1lbnQsICdfc2VsZWN0ZWQnKTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS51bnNlbGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5lbGVtZW50LCAnX3NlbGVjdGVkJyk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuYW5pbWF0ZUNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5lbGVtZW50LCAnX2JsaW5rJyk7XG5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHNlbGYuZWxlbWVudCwgJ19ibGluaycpO1xuICAgIH0sIDApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCbG9jaztcbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICAgIHtcbiAgICAgICAgd2ViOiAnIzk5YjQzMycsXG4gICAgICAgIHJnYjogWzE1NCwgMTgwLCA1MV1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyNEQTUzMkMnLFxuICAgICAgICByZ2I6IFsyMTgsIDgzLCA0NF1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyMxZTcxNDUnLFxuICAgICAgICByZ2I6IFszMCwgMTEzLCA2OV1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyMyQzg5QTAnLFxuICAgICAgICByZ2I6IFs0NCwgMTM3LCAxNjBdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjMDBBQTg4JyxcbiAgICAgICAgcmdiOiBbMCwgMTcwLCAxMzZdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjMDBkNDU1JyxcbiAgICAgICAgcmdiOiBbMCwgMjEyLCA4NV1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyNmZjJhMmEnLFxuICAgICAgICByZ2I6IFsyNTUsIDQyLCA0Ml1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyNDQjUwMDAnLFxuICAgICAgICByZ2I6IFsyMDMsIDgwLCAwXVxuICAgIH1cbl07XG4iLCJ2YXIgQmxvY2sgPSByZXF1aXJlKCcuL2Jsb2NrLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcbnZhciBnYW1lQ29uZmlnID0gcmVxdWlyZSgnLi4vZ2FtZUNvbmZpZycpO1xuXG5mdW5jdGlvbiBGaWVsZChnYW1lKSB7XG4gICAgdGhpcy5nYW1lID0gZ2FtZTtcbiAgICB0aGlzLmNvbmZpZyA9IGdhbWUuc3RvcmU7XG5cbiAgICB0aGlzLmJsb2NrcyA9IHt9O1xuICAgIHRoaXMuX2Jsb2Nrc1hZID0ge307XG4gICAgdGhpcy5zaXplID0gdGhpcy5jb25maWcuZmllbGQuc2l6ZTtcblxuICAgIHRoaXMuc2VsZWN0ZWRCbG9ja3MgPSBbXTtcbiAgICB0aGlzLnNlbGVjdGVkTW9kZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLl9jcmVhdGVFbGVtZW50KCk7XG4gICAgdGhpcy5fYmluZEV2ZW50cygpO1xufVxuXG5GaWVsZC5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2l6ZVswXTsgaSsrKSB7XG4gICAgICAgIHRoaXMuX2Jsb2Nrc1hZW2ldID0ge307XG5cbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLnNpemVbMV07IGorKykge1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVCbG9jayhpLCBqLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5jcmVhdGVCbG9jayA9IGZ1bmN0aW9uKHgsIHksIGlzSW5pdCkge1xuICAgIHZhciBibG9jayA9IG5ldyBCbG9jayh4LCB5LCB0aGlzKTtcblxuICAgIHRoaXMuYmxvY2tzW2Jsb2NrLmlkXSA9IGJsb2NrO1xuXG4gICAgdGhpcy5fYmxvY2tzWFlbeF1beV0gPSBibG9jay5pZDtcblxuICAgIGlmICghaXNJbml0KSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChibG9jay5lbGVtZW50KTtcbiAgICAgICAgYmxvY2suYW5pbWF0ZUNyZWF0ZSgpO1xuICAgIH1cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdGhpcy5jYW52YXMuY2xhc3NOYW1lID0gJ2ZpZWxkX19jYW52YXMnO1xuXG4gICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgdGhpcy5jYW52YXMud2lkdGggPSBnYW1lQ29uZmlnLmZpZWxkLndpZHRoO1xuICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IGdhbWVDb25maWcuZmllbGQuaGVpZ2h0O1xuICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKHRoaXMuY2FudmFzKTtcblxuICAgIHV0aWwuZm9yRWFjaCh0aGlzLmJsb2NrcywgZnVuY3Rpb24oYmwpIHtcbiAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoYmwuZWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gJ2ZpZWxkJyArXG4gICAgICAgICcgX3dpZHRoXycgKyB0aGlzLnNpemVbMF0gK1xuICAgICAgICAnIF9oZWlnaHRfJyArIHRoaXMuc2l6ZVsxXTtcblxuICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChmcmFnbWVudCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2JpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodXRpbC5pc01vYmlsZSkge1xuICAgICAgICB1dGlsLm9uKGRvY3VtZW50LmJvZHksICd0b3VjaGVuZCcsIHRoaXMuX21vdXNlVXBIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgICAgICB1dGlsLm9uKGRvY3VtZW50LmJvZHksICd0b3VjaG1vdmUnLCB0aGlzLl90b3VjaE1vdmVIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHV0aWwub24oZG9jdW1lbnQuYm9keSwgJ21vdXNldXAnLCB0aGlzLl9tb3VzZVVwSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX3RvdWNoTW92ZUhhbmRsZXIgPSBmdW5jdGlvbihldikge1xuICAgIHZhciBpc0JyZWFrLCBibG9jaywga2V5cyx0b3VjaCwgdGFyZ2V0LCBpLCBqO1xuICAgIHZhciBibG9ja3MgPSB0aGlzLmJsb2NrcztcblxuICAgIGZvciAoaSA9IDA7IGkgPCBldi5jaGFuZ2VkVG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0b3VjaCA9IGV2LmNoYW5nZWRUb3VjaGVzW2ldO1xuICAgICAgICB0YXJnZXQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHRvdWNoLmNsaWVudFgsIHRvdWNoLmNsaWVudFkpO1xuXG4gICAgICAgIGlmICghdGFyZ2V0IHx8IHRhcmdldC5jbGFzc05hbWUuaW5kZXhPZignYmxvY2tfX2FjdGl2ZScpID09IC0xKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgLy8g0LTQtdC70LDQtdC8IGZvciwg0LAg0L3QtSBmb3JFYWNoLCDRh9GC0L7QsdGLINC80L7QttC90L4g0LHRi9C70L4g0YHRgtC+0L/QvdGD0YLRjFxuICAgICAgICBrZXlzID0gT2JqZWN0LmtleXMoYmxvY2tzKTtcblxuICAgICAgICBmb3IgKGogPSAwOyBqIDwga2V5cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgYmxvY2sgPSBibG9ja3Nba2V5c1tqXV07XG5cbiAgICAgICAgICAgIGlmIChibG9jay5hY3RpdmVFbGVtZW50ID09PSB0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJsb2NrTW91c2VPdmVyKGJsb2NrLmlkKTtcbiAgICAgICAgICAgICAgICBpc0JyZWFrID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0JyZWFrKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fbW91c2VVcEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuc2VsZWN0ZWRNb2RlKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5zZWxlY3RlZE1vZGUgPSBmYWxzZTtcblxuICAgIHRoaXMuX3J1blNlbGVjdGVkKCk7XG5cbiAgICB1dGlsLmZvckVhY2godGhpcy5ibG9ja3MsIGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgIGJsb2NrLnVuc2VsZWN0KCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW0oKTtcblxuICAgIHRoaXMuX2NsZWFyUGF0aCgpO1xufTtcblxuRmllbGQucHJvdG90eXBlLmJsb2NrTW91c2VEb3duID0gZnVuY3Rpb24oaWQpIHtcbiAgICB0aGlzLnNlbGVjdGVkTW9kZSA9IHRydWU7XG4gICAgdGhpcy5zZWxlY3RlZEJsb2NrcyA9IFtpZF07XG5cbiAgICB0aGlzLmJsb2Nrc1tpZF0uc2VsZWN0KCk7XG5cbiAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW0oKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY2hlY2tXaXRoTGFzdCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGxhc3RCbCA9IHRoaXMuYmxvY2tzW3RoaXMuc2VsZWN0ZWRCbG9ja3NbdGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggLSAxXV07XG4gICAgdmFyIG5ld0JsID0gdGhpcy5ibG9ja3NbaWRdO1xuXG4gICAgcmV0dXJuIGxhc3RCbC52YWx1ZSA9PSBuZXdCbC52YWx1ZSAmJlxuICAgICAgICBNYXRoLmFicyhsYXN0QmwueCAtIG5ld0JsLngpIDw9IDEgJiZcbiAgICAgICAgTWF0aC5hYnMobGFzdEJsLnkgLSBuZXdCbC55KSA8PSAxO1xufTtcblxuRmllbGQucHJvdG90eXBlLmJsb2NrTW91c2VPdmVyID0gZnVuY3Rpb24oaWQpIHtcbiAgICBpZiAoIXRoaXMuc2VsZWN0ZWRNb2RlKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIHNlbEJsb2NrcyA9IHRoaXMuc2VsZWN0ZWRCbG9ja3M7XG5cbiAgICBpZiAoc2VsQmxvY2tzLmluZGV4T2YoaWQpID09IC0xKSB7XG4gICAgICAgIGlmICh0aGlzLl9jaGVja1dpdGhMYXN0KGlkKSkge1xuICAgICAgICAgICAgc2VsQmxvY2tzLnB1c2goaWQpO1xuICAgICAgICAgICAgdGhpcy5ibG9ja3NbaWRdLnNlbGVjdCgpO1xuXG4gICAgICAgICAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW0oKTtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVBhdGgoKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChzZWxCbG9ja3Nbc2VsQmxvY2tzLmxlbmd0aCAtIDJdID09IGlkKSB7XG4gICAgICAgICAgICB2YXIgbGFzdEJsSWQgPSBzZWxCbG9ja3MucG9wKCk7XG4gICAgICAgICAgICB0aGlzLmJsb2Nrc1tsYXN0QmxJZF0udW5zZWxlY3QoKTtcblxuICAgICAgICAgICAgdGhpcy5nYW1lLnVwZGF0ZUNoYWluU3VtKCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVQYXRoKCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX3VwZGF0ZVBhdGggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgY3R4ID0gdGhpcy5jdHg7XG4gICAgdmFyIGZpZWxkSGVpZ2h0ID0gZ2FtZUNvbmZpZy5maWVsZC5oZWlnaHQ7XG5cbiAgICB0aGlzLl9jbGVhclBhdGgoKTtcblxuICAgIGN0eC5iZWdpblBhdGgoKTtcblxuICAgIGN0eC5zdHJva2VTdHlsZSA9IGdhbWVDb25maWcucGF0aC5jb2xvcjtcbiAgICBjdHgubGluZVdpZHRoID0gZ2FtZUNvbmZpZy5wYXRoLndpZHRoO1xuXG4gICAgdGhpcy5zZWxlY3RlZEJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uKGlkLCBpKSB7XG4gICAgICAgIHZhciBibG9jayA9IHRoaXMuYmxvY2tzW2lkXTtcbiAgICAgICAgdmFyIHggPSAoYmxvY2sueCArIDAuNSkgKiBibG9jay53aWR0aDtcbiAgICAgICAgdmFyIHkgPSBmaWVsZEhlaWdodCAtIChibG9jay55ICsgMC41KSAqIGJsb2NrLmhlaWdodDtcblxuICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgY3R4Lm1vdmVUbyh4LCB5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN0eC5saW5lVG8oeCwgeSk7XG4gICAgICAgIH1cbiAgICB9LCB0aGlzKTtcblxuICAgIGN0eC5zdHJva2UoKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY2xlYXJQYXRoID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIGdhbWVDb25maWcuZmllbGQud2lkdGgsIGdhbWVDb25maWcuZmllbGQuaGVpZ2h0KTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5ibG9ja01vdXNlT3V0ID0gZnVuY3Rpb24oaWQpIHtcblxufTtcblxuRmllbGQucHJvdG90eXBlLl9ibG9ja1JlbW92ZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGJsb2NrID0gdGhpcy5ibG9ja3NbaWRdO1xuXG4gICAgdGhpcy5lbGVtZW50LnJlbW92ZUNoaWxkKGJsb2NrLmVsZW1lbnQpO1xuXG4gICAgdGhpcy5fYmxvY2tzWFlbYmxvY2sueF1bYmxvY2sueV0gPSBudWxsO1xuICAgIGRlbGV0ZSB0aGlzLmJsb2Nrc1tpZF07XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX3J1blNlbGVjdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoIDwgdGhpcy5jb25maWcuY2hhaW4ubWluTGVuZ3RoKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5nYW1lLnVwZGF0ZVNjb3JlKCk7XG5cbiAgICB2YXIgbGFzdEJsSWQgPSB0aGlzLnNlbGVjdGVkQmxvY2tzLnBvcCgpO1xuICAgIHZhciBsYXN0QmwgPSB0aGlzLmJsb2Nrc1tsYXN0QmxJZF07XG4gICAgdmFyIHZhbHVlID0gbGFzdEJsLnZhbHVlICogKHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoICsgMSk7IC8vICsxIGJlY2F1c2UgcG9wIGFib3ZlXG5cbiAgICBsYXN0QmwuY2hhbmdlVmFsdWUodmFsdWUpO1xuXG4gICAgdGhpcy5zZWxlY3RlZEJsb2Nrcy5mb3JFYWNoKHRoaXMuX2Jsb2NrUmVtb3ZlLCB0aGlzKTtcblxuICAgIHRoaXMuX2NoZWNrUG9zaXRpb25zKCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2NoZWNrUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIGJsb2Nrc1hZID0gdGhpcy5fYmxvY2tzWFk7XG4gICAgdmFyIGJsb2NrcyA9IHRoaXMuYmxvY2tzO1xuXG4gICAgdXRpbC5mb3JFYWNoKGJsb2Nrc1hZLCBmdW5jdGlvbihibG9ja3NZKSB7XG4gICAgICAgIHZhciBhcnIgPSBbXTtcblxuICAgICAgICAvLyDQtNC+0LHQsNCy0LvRj9C10Lwg0LIg0LzQsNGB0YHQuNCyINGB0YPRidC10YHRgtCy0YPRjtGJ0LjQtSDQstC10YDRgtC40LrQsNC70YzQvdGL0LUg0Y3Qu9C10LzQtdC90YLRi1xuICAgICAgICB1dGlsLmZvckVhY2goYmxvY2tzWSwgZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIGlmIChpZCkgeyBhcnIucHVzaChpZCk7IH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g0LXRgdC70Lgg0L/QvtC70L3Ri9C5INC40LvQuCDQv9GD0YHRgtC+0LlcbiAgICAgICAgaWYgKGFyci5sZW5ndGggPT0gc2VsZi5zaXplWzFdIHx8ICFhcnIpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgLy8g0YHQvtGA0YLQuNGA0YPQtdC8XG4gICAgICAgIGFyci5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBibG9ja3NbYV0ueSA+IGJsb2Nrc1tiXS55O1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDRgdC00LLQuNCz0LDQtdC8INC+0YLRgdC+0YDRgtC40YDQvtCy0LDQvdC90YvQuSDRgdC/0LjRgdC+0Log0Log0L3QuNC30YNcbiAgICAgICAgYXJyLmZvckVhY2goZnVuY3Rpb24oaWQsIHkpIHtcbiAgICAgICAgICAgIHZhciBibG9jayA9IGJsb2Nrc1tpZF07XG5cbiAgICAgICAgICAgIGlmIChibG9jay55ICE9IHkpIHtcbiAgICAgICAgICAgICAgICBibG9ja3NZW2Jsb2NrLnldID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIGJsb2NrLmNoYW5nZVBvc2l0aW9uKGJsb2NrLngsIHkpO1xuXG4gICAgICAgICAgICAgICAgYmxvY2tzWVt5XSA9IGlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRoaXMuX2FkZE5ld0Jsb2NrcygpO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9hZGROZXdCbG9ja3MgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYmxvY2tzWFkgPSB0aGlzLl9ibG9ja3NYWTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zaXplWzBdOyBpKyspIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLnNpemVbMV07IGorKykge1xuICAgICAgICAgICAgaWYgKCFibG9ja3NYWVtpXVtqXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlQmxvY2soaSwgaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpZWxkO1xuIiwidmFyIGxldmVsU3RvcmUgPSByZXF1aXJlKCcuLi9sZXZlbFN0b3JlLmpzJyk7XG52YXIgRmllbGQgPSByZXF1aXJlKCcuL2ZpZWxkLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuZnVuY3Rpb24gR2FtZShuYW1lLCBzdGF0ZSkge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgIHRoaXMuc3RvcmUgPSBsZXZlbFN0b3JlLmdldChuYW1lKTtcbiAgICB0aGlzLnNjb3JlID0gMDtcblxuICAgIHRoaXMuZmllbGQgPSBuZXcgRmllbGQodGhpcyk7XG5cbiAgICB0aGlzLl9jcmVhdGVFbGVtZW50KCk7XG4gICAgdGhpcy5fYmluZEV2ZW50cygpO1xufVxuXG5HYW1lLnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWxlbWVudC5jbGFzc05hbWUgPSAnZ2FtZSc7XG5cbiAgICB2YXIgdGVtcGxhdGUgPVxuICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX2hlYWRlclwiPicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19sZXZlbE5hbWVcIj5MZXZlbDoge3tuYW1lfX08L2Rpdj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9fc2NvcmVcIj4wPC9kaXY+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX2NoYWluU3VtXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX2dvYWxcIj57e2dvYWx9fTwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9fYm9keVwiPjwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX2Zvb3RlclwiPicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19iYWNrQnV0dG9uXCI+TWVudTwvZGl2PicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19yZXN0YXJ0QnV0dG9uXCI+UmVzdGFydDwvZGl2PicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19uZXh0QnV0dG9uXCI+TmV4dDwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JztcblxuICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gdGVtcGxhdGVcbiAgICAgICAgLnJlcGxhY2UoJ3t7Z29hbH19JywgdGhpcy5fZ2V0R29hbFRleHQoKSlcbiAgICAgICAgLnJlcGxhY2UoJ3t7bmFtZX19JywgdGhpcy5uYW1lKTtcblxuICAgIGlmICh0aGlzLnN0b3JlLmN1cnJlbnRHb2FsID4gMCkge1xuICAgICAgICB1dGlsLmFkZENsYXNzKGVsZW1lbnQsICdfd2luJyk7XG4gICAgfVxuXG4gICAgdGhpcy5iYWNrQnV0dG9uID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdnYW1lX19iYWNrQnV0dG9uJylbMF07XG4gICAgdGhpcy5yZXN0YXJ0QnV0dG9uID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdnYW1lX19yZXN0YXJ0QnV0dG9uJylbMF07XG4gICAgdGhpcy5uZXh0QnV0dG9uID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdnYW1lX19uZXh0QnV0dG9uJylbMF07XG5cbiAgICB0aGlzLmdvYWxFbGVtZW50ID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdnYW1lX19nb2FsJylbMF07XG4gICAgdGhpcy5zY29yZUVsZW1lbnQgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dhbWVfX3Njb3JlJylbMF07XG4gICAgdGhpcy5jaGFpblN1bUVsZW1lbnQgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dhbWVfX2NoYWluU3VtJylbMF07XG5cbiAgICB0aGlzLmJvZHlFbGVtZW50ID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdnYW1lX19ib2R5JylbMF07XG4gICAgdGhpcy5ib2R5RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmZpZWxkLmVsZW1lbnQpO1xuXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbn07XG5cbkdhbWUucHJvdG90eXBlLl9iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5vbih0aGlzLnJlc3RhcnRCdXR0b24sICdjbGljaycsIHRoaXMucmVzdGFydC5iaW5kKHRoaXMpKTtcbiAgICB1dGlsLm9uKHRoaXMuYmFja0J1dHRvbiwgJ2NsaWNrJywgdGhpcy5fYmFja1RvTWVudS5iaW5kKHRoaXMpKTtcbiAgICB1dGlsLm9uKHRoaXMubmV4dEJ1dHRvbiwgJ2NsaWNrJywgdGhpcy5fbmV4dExldmVsLmJpbmQodGhpcykpO1xufTtcblxuR2FtZS5wcm90b3R5cGUuX2dldEdvYWxUZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuc3RvcmUuY3VycmVudEdvYWwgPCAzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0b3JlLmdvYWxzW3RoaXMuc3RvcmUuY3VycmVudEdvYWxdO1xuICAgIH1cblxuICAgIHJldHVybiAnJztcbn07XG5cbkdhbWUucHJvdG90eXBlLl9uZXh0TGV2ZWwgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbmV4dExldmVsID0gbGV2ZWxTdG9yZS5nZXROZXh0KHRoaXMubmFtZSk7XG5cbiAgICBpZiAobmV4dExldmVsICYmIG5leHRMZXZlbC5pc09wZW4pIHtcbiAgICAgICAgdGhpcy5zdGF0ZS5ydW5MZXZlbChuZXh0TGV2ZWwubmFtZSk7XG4gICAgfVxufTtcblxuR2FtZS5wcm90b3R5cGUucmVzdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXdGaWVsZCA9IG5ldyBGaWVsZCh0aGlzKTtcblxuICAgIHRoaXMuYm9keUVsZW1lbnQucmVwbGFjZUNoaWxkKG5ld0ZpZWxkLmVsZW1lbnQsIHRoaXMuZmllbGQuZWxlbWVudCk7XG5cbiAgICB0aGlzLnNjb3JlID0gMDtcbiAgICB0aGlzLnNjb3JlRWxlbWVudC5pbm5lckhUTUwgPSAwO1xuXG4gICAgdGhpcy5maWVsZCA9IG5ld0ZpZWxkO1xufTtcblxuR2FtZS5wcm90b3R5cGUuX2JhY2tUb01lbnUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN0YXRlLmJhY2tGcm9tTGV2ZWwoKTtcbn07XG5cbkdhbWUucHJvdG90eXBlLnVwZGF0ZUNoYWluU3VtID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLmZpZWxkLnNlbGVjdGVkTW9kZSkge1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuY2hhaW5TdW1FbGVtZW50LCAnX3Nob3dlZCcpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGZpZWxkID0gdGhpcy5maWVsZDtcblxuICAgIHZhciBibG9ja1ZhbHVlID0gZmllbGQuYmxvY2tzW2ZpZWxkLnNlbGVjdGVkQmxvY2tzWzBdXS52YWx1ZSB8fCAwO1xuICAgIHRoaXMuY2hhaW5TdW1FbGVtZW50LmlubmVySFRNTCA9IGJsb2NrVmFsdWUgKiBmaWVsZC5zZWxlY3RlZEJsb2Nrcy5sZW5ndGg7XG4gICAgdXRpbC5hZGRDbGFzcyh0aGlzLmNoYWluU3VtRWxlbWVudCwgJ19zaG93ZWQnKTtcbn07XG5cbkdhbWUucHJvdG90eXBlLnVwZGF0ZVNjb3JlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZpZWxkID0gdGhpcy5maWVsZDtcblxuICAgIHZhciBibG9ja1ZhbHVlID0gZmllbGQuYmxvY2tzW2ZpZWxkLnNlbGVjdGVkQmxvY2tzWzBdXS52YWx1ZSB8fCAwO1xuICAgIHZhciBrID0gMSArIDAuMiAqIChmaWVsZC5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggLSAzKTtcbiAgICB0aGlzLnNjb3JlICs9IE1hdGgucm91bmQoYmxvY2tWYWx1ZSAqIGZpZWxkLnNlbGVjdGVkQmxvY2tzLmxlbmd0aCAqIGspO1xuICAgIHRoaXMuc2NvcmVFbGVtZW50LmlubmVySFRNTCA9IHRoaXMuc2NvcmU7XG5cbiAgICB0aGlzLl9jaGVja0dvYWwoKTtcbn07XG5cbkdhbWUucHJvdG90eXBlLl9jaGVja0dvYWwgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zdG9yZS5jdXJyZW50R29hbCA9PSAzKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIHN0b3JlID0gdGhpcy5zdG9yZTtcblxuICAgIGlmICh0aGlzLnNjb3JlID49IHN0b3JlLndpbkNvbmRpdGlvbnNbc3RvcmUuY3VycmVudEdvYWxdKSB7XG4gICAgICAgIHN0b3JlLmN1cnJlbnRHb2FsID0gTWF0aC5taW4oc3RvcmUuY3VycmVudEdvYWwgKyAxLCAzKTtcblxuICAgICAgICBpZiAoc3RvcmUuY3VycmVudEdvYWwgPT0gMSkgeyB0aGlzLl93aW4oKTsgfVxuXG4gICAgICAgIHRoaXMuZ29hbEVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5fZ2V0R29hbFRleHQoKTtcbiAgICB9XG59O1xuXG5HYW1lLnByb3RvdHlwZS5fd2luID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5hZGRDbGFzcyh0aGlzLmVsZW1lbnQsICdfd2luJyk7XG4gICAgbGV2ZWxTdG9yZS5jaGVja09wZW5MZXZlbHMoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR2FtZTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGZpZWxkOiB7XG4gICAgICAgIHdpZHRoOiA1MDAsXG4gICAgICAgIGhlaWdodDogNTAwXG4gICAgfSxcbiAgICBwYXRoOiB7XG4gICAgICAgIGNvbG9yOiAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjI1KScsXG4gICAgICAgIHdpZHRoOiAxMFxuICAgIH0sXG4gICAgbGV2ZWxzOiBbMSwgMiwgMywgNCwgNSwgNiwgNywgOF0sXG4gICAgbWluT3BlbkxldmVsczogNVxufTtcbiIsInZhciBnYW1lQ29uZmlnID0gcmVxdWlyZSgnLi4vZ2FtZUNvbmZpZy5qcycpO1xudmFyIGxldmVsU3RvcmUgPSByZXF1aXJlKCcuLi9sZXZlbFN0b3JlLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcblxuZnVuY3Rpb24gTGV2ZWwobGV2ZWxNZW51LCBuYW1lLCBvcmRlcikge1xuICAgIHRoaXMubGV2ZWxNZW51ID0gbGV2ZWxNZW51O1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG5cbiAgICB0aGlzLnN0b3JlID0gbGV2ZWxTdG9yZS5nZXQodGhpcy5uYW1lKTtcblxuICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSAnbGV2ZWxNZW51X19sZXZlbEJsb2NrICcgK1xuICAgICAgICAnX2xldmVsXycgKyBvcmRlciAlIDI7XG5cbiAgICB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MID0gbmFtZTtcbiAgICB0aGlzLmdvYWwgPSBudWxsO1xuXG4gICAgdGhpcy5pc09wZW4gPSBmYWxzZTtcblxuICAgIHV0aWwub24odGhpcy5lbGVtZW50LCAnY2xpY2snLCB0aGlzLl9vbkNsaWNrLmJpbmQodGhpcykpO1xufVxuXG5MZXZlbC5wcm90b3R5cGUuX29uQ2xpY2sgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmxldmVsTWVudS5ydW5MZXZlbCh0aGlzLm5hbWUpO1xufTtcblxuTGV2ZWwucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXdHb2FsID0gdGhpcy5zdG9yZS5jdXJyZW50R29hbDtcblxuICAgIGlmICh0aGlzLmdvYWwgIT09IG5ld0dvYWwpIHtcbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyh0aGlzLmVsZW1lbnQsICdfZ29hbF8nICsgdGhpcy5nb2FsKTtcbiAgICAgICAgdXRpbC5hZGRDbGFzcyh0aGlzLmVsZW1lbnQsICdfZ29hbF8nICsgbmV3R29hbCk7XG4gICAgICAgIHRoaXMuZ29hbCA9IG5ld0dvYWw7XG4gICAgfVxuXG4gICAgdmFyIG5ld0lzT3BlbiA9IHRoaXMuc3RvcmUuaXNPcGVuO1xuXG4gICAgaWYgKHRoaXMuaXNPcGVuICE9PSBuZXdJc09wZW4pIHtcbiAgICAgICAgdXRpbC5hZGRDbGFzcyh0aGlzLmVsZW1lbnQsICdfb3BlbicpO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIExldmVsTWVudShzdGF0ZSkge1xuICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB0aGlzLmxldmVscyA9IHt9O1xuXG4gICAgdGhpcy5fY3JlYXRlRWxlbWVudCgpO1xuICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcbn1cblxuTGV2ZWxNZW51LnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWxlbWVudC5jbGFzc05hbWUgPSAnbGV2ZWxNZW51JztcblxuICAgIHZhciBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBoZWFkZXIuY2xhc3NOYW1lID0gJ2xldmVsTWVudV9faGVhZGVyJztcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGhlYWRlcik7XG5cbiAgICB2YXIgbGV2ZWxzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbGV2ZWxzLmNsYXNzTmFtZSA9ICdsZXZlbE1lbnVfX2hlYWRlckxldmVscyc7XG4gICAgbGV2ZWxzLmlubmVySFRNTCA9ICdMZXZlbHM6JztcbiAgICBoZWFkZXIuYXBwZW5kQ2hpbGQobGV2ZWxzKTtcblxuICAgIHZhciBib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgYm9keS5jbGFzc05hbWUgPSAnbGV2ZWxNZW51X19ib2R5JztcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGJvZHkpO1xuXG4gICAgdmFyIGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgZ2FtZUNvbmZpZy5sZXZlbHMuZm9yRWFjaChmdW5jdGlvbihuYW1lLCBpKSB7XG4gICAgICAgIHZhciBsZXZlbCA9IG5ldyBMZXZlbCh0aGlzLCBuYW1lLCBpKTtcblxuICAgICAgICB0aGlzLmxldmVsc1tuYW1lXSA9IGxldmVsO1xuXG4gICAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGxldmVsLmVsZW1lbnQpO1xuICAgIH0sIHRoaXMpO1xuXG4gICAgYm9keS5hcHBlbmRDaGlsZChmcmFnbWVudCk7XG5cbiAgICB2YXIgZm9vdGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZm9vdGVyLmNsYXNzTmFtZSA9ICdsZXZlbE1lbnVfX2Zvb3Rlcic7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChmb290ZXIpO1xuXG4gICAgdmFyIGJhY2tCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBiYWNrQnV0dG9uLmNsYXNzTmFtZSA9ICdsZXZlbE1lbnVfX2JhY2tCdXR0b24nO1xuICAgIGJhY2tCdXR0b24uaW5uZXJIVE1MID0gJ0JhY2snO1xuICAgIGZvb3Rlci5hcHBlbmRDaGlsZChiYWNrQnV0dG9uKTtcblxuICAgIHRoaXMuYmFja0J1dHRvbiA9IGJhY2tCdXR0b247XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbn07XG5cbkxldmVsTWVudS5wcm90b3R5cGUuX2JpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICB1dGlsLm9uKHRoaXMuYmFja0J1dHRvbiwgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc3RhdGUucnVuTWFpbk1lbnUoKTtcbiAgICB9LmJpbmQodGhpcykpO1xufTtcblxuTGV2ZWxNZW51LnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB1dGlsLmZvckVhY2godGhpcy5sZXZlbHMsIGZ1bmN0aW9uKGxldmVsKSB7XG4gICAgICAgIGxldmVsLnVwZGF0ZSgpO1xuICAgIH0sIHRoaXMpO1xufTtcblxuTGV2ZWxNZW51LnByb3RvdHlwZS5ydW5MZXZlbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAobGV2ZWxTdG9yZS5nZXQobmFtZSkuaXNPcGVuKSB7XG4gICAgICAgIHRoaXMuc3RhdGUucnVuTGV2ZWwobmFtZSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBMZXZlbE1lbnU7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAxOiByZXF1aXJlKCcuL2xldmVscy8xJyksXG4gICAgMjogcmVxdWlyZSgnLi9sZXZlbHMvMicpLFxuICAgIDM6IHJlcXVpcmUoJy4vbGV2ZWxzLzInKSxcbiAgICA0OiByZXF1aXJlKCcuL2xldmVscy8yJyksXG4gICAgNTogcmVxdWlyZSgnLi9sZXZlbHMvMicpLFxuICAgIDY6IHJlcXVpcmUoJy4vbGV2ZWxzLzInKSxcbiAgICA3OiByZXF1aXJlKCcuL2xldmVscy8yJyksXG4gICAgODogcmVxdWlyZSgnLi9sZXZlbHMvMicpXG59O1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcbnZhciBzYXZlcyA9IHJlcXVpcmUoJy4vc2F2ZXMuanMnKTtcbnZhciBnYW1lQ29uZmlnID0gcmVxdWlyZSgnLi9nYW1lQ29uZmlnLmpzJyk7XG5cbnZhciBsZXZlbENvbmZpZyA9IGNvbmZpZy5sZXZlbHM7XG5cbnZhciBzYXZlZExldmVsID0gc2F2ZXMuZ2V0TGV2ZWxzKCk7XG5cbnZhciBsZXZlbFN0b3JlID0ge307XG5cbnZhciBsZXZlbHMgPSB7fTtcblxuZnVuY3Rpb24gaW5pdExldmVscygpIHtcbiAgICBnYW1lQ29uZmlnLmxldmVscy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUsIGkpIHtcbiAgICAgICAgdmFyIGxldmVsID0gbGV2ZWxDb25maWdbbmFtZV07XG4gICAgICAgIGxldmVsLm5hbWUgPSBuYW1lO1xuICAgICAgICBsZXZlbC5jdXJyZW50R29hbCA9IHNhdmVkTGV2ZWwuY3VycmVudEdvYWwgfHwgMDtcbiAgICAgICAgbGV2ZWwubWF4U2NvcmUgPSBzYXZlZExldmVsLm1heFNjb3JlIHx8IDA7XG5cbiAgICAgICAgbGV2ZWxzW25hbWVdID0gbGV2ZWw7XG4gICAgfSk7XG59XG5cbmxldmVsU3RvcmUuZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiBsZXZlbHNbbmFtZV07XG59O1xuXG5sZXZlbFN0b3JlLmdldE5leHQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG5hbWVJbmRleCA9IGdhbWVDb25maWcubGV2ZWxzLmluZGV4T2YobmFtZSk7XG5cbiAgICBpZiAobmFtZUluZGV4ID09PSAtMSkgeyByZXR1cm4gbnVsbDsgfVxuXG4gICAgdmFyIG5leHRMZXZlbE5hbWUgPSBnYW1lQ29uZmlnLmxldmVsc1tuYW1lSW5kZXggKyAxXTtcblxuICAgIGlmICghbmV4dExldmVsTmFtZSkgeyByZXR1cm4gbnVsbDsgfVxuXG4gICAgcmV0dXJuIGxldmVsc1tuZXh0TGV2ZWxOYW1lXTtcbn07XG5cbmxldmVsU3RvcmUuY2hlY2tPcGVuTGV2ZWxzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG9wZW5MZXZlbHNMZW5ndGggPSAwO1xuXG4gICAgZ2FtZUNvbmZpZy5sZXZlbHMuZm9yRWFjaChmdW5jdGlvbihuYW1lLCBpKSB7XG4gICAgICAgIHZhciBsZXZlbCA9IGxldmVsc1tuYW1lXTtcblxuICAgICAgICBpZiAobGV2ZWwuY3VycmVudEdvYWwgPiAwKSB7XG4gICAgICAgICAgICBvcGVuTGV2ZWxzTGVuZ3RoKys7XG4gICAgICAgIH1cblxuICAgICAgICBsZXZlbC5pc09wZW4gPSBpIDwgb3BlbkxldmVsc0xlbmd0aCArIGdhbWVDb25maWcubWluT3BlbkxldmVscztcbiAgICB9KTtcbn07XG5cbmluaXRMZXZlbHMoKTtcbmxldmVsU3RvcmUuY2hlY2tPcGVuTGV2ZWxzKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gbGV2ZWxTdG9yZTtcbiIsInZhciBHYW1lID0gcmVxdWlyZSgnLi4vZ2FtZS9nYW1lLmpzJyk7XG5cbmZ1bmN0aW9uIExldmVsKG5hbWUsIGxldmVsTWVudSkge1xuICAgIEdhbWUuY2FsbCh0aGlzLCBuYW1lLCBsZXZlbE1lbnUpO1xufVxuXG5MZXZlbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEdhbWUucHJvdG90eXBlKTtcbkxldmVsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExldmVsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExldmVsO1xuIiwidmFyIEdhbWUgPSByZXF1aXJlKCcuLi9nYW1lL2dhbWUuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBHYW1lO1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsLmpzJyk7XG5cbmZ1bmN0aW9uIE1lbnUoc3RhdGUpIHtcbiAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG4gICAgdGhpcy5faXNSZXN1bWVBY3RpdmUgPSBmYWxzZTtcblxuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbiAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XG59XG5cbk1lbnUucHJvdG90eXBlLl9jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBlbGVtZW50LmNsYXNzTmFtZSA9ICdtYWluTWVudSc7XG4gICAgZWxlbWVudC5pbm5lckhUTUwgPVxuICAgICAgICAnPGRpdiBjbGFzcz1cIm1haW5NZW51X19oZWFkZXJcIj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwibWFpbk1lbnVfX3RpdGxlXCI+Q2hhaW51bWJlcjwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwibWFpbk1lbnVfX2JvZHlcIj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwibWFpbk1lbnVfX25ld0dhbWVcIj5OZXcgZ2FtZTwvZGl2PicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJtYWluTWVudV9fcmVzdW1lR2FtZVwiPlJlc3VtZSBnYW1lPC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJtYWluTWVudV9fZm9vdGVyXCI+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cIm1haW5NZW51X192ZXJzaW9uXCI+djAuMC4xPC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj4nO1xuXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm5ld0dhbWVCdXR0b24gPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ21haW5NZW51X19uZXdHYW1lJylbMF07XG4gICAgdGhpcy5yZXN1bWVHYW1lQnV0dG9uID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdtYWluTWVudV9fcmVzdW1lR2FtZScpWzBdO1xufTtcblxuTWVudS5wcm90b3R5cGUuX2JpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICB1dGlsLm9uKHRoaXMubmV3R2FtZUJ1dHRvbiwgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc3RhdGUucnVuTGV2ZWxNZW51KCk7XG4gICAgfS5iaW5kKHRoaXMpKTtcblxuICAgIHV0aWwub24odGhpcy5yZXN1bWVHYW1lQnV0dG9uLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zdGF0ZS5yZXN1bWVMZXZlbCgpO1xuICAgIH0uYmluZCh0aGlzKSk7XG59O1xuXG5NZW51LnByb3RvdHlwZS5yZXN1bWVMZXZlbEFjdGl2ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9pc1Jlc3VtZUFjdGl2ZSkgeyByZXR1cm47IH1cblxuICAgIHRoaXMuX2lzUmVzdW1lQWN0aXZlID0gdHJ1ZTtcbiAgICB1dGlsLmFkZENsYXNzKHRoaXMuZWxlbWVudCwgJ19hY3RpdmVMZXZlbCcpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZW51O1xuIiwidmFyIHNhdmVzID0ge307XG5cbnNhdmVzLmdldExldmVscyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsZXZlbHNKU09OID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2xldmVscycpO1xuICAgIHZhciBsZXZlbHM7XG5cbiAgICBpZiAobGV2ZWxzSlNPTikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV2ZWxzID0gSlNPTi5wYXJzZShsZXZlbHNKU09OKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgbGV2ZWxzID0ge307XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBsZXZlbHMgPSB7fTtcbiAgICB9XG5cbiAgICByZXR1cm4gbGV2ZWxzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzYXZlcztcbiIsInZhciBMZXZlbE1lbnUgPSByZXF1aXJlKCcuL2xldmVsTWVudS9sZXZlbE1lbnUnKTtcbnZhciBNYWluTWVudSA9IHJlcXVpcmUoJy4vbWFpbk1lbnUvbWFpbk1lbnUnKTtcblxudmFyIGxldmVsTW9kdWxlcyA9IHJlcXVpcmUoJy4vbGV2ZWxNb2R1bGVzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG5mdW5jdGlvbiBTdGF0ZSgpIHtcbiAgICB0aGlzLl9hY3RpdmVFbGVtZW50ID0gbnVsbDtcbiAgICB0aGlzLl9hY3RpdmVMZXZlbCA9IG51bGw7XG5cbiAgICB0aGlzLmxldmVsTWVudSA9IG5ldyBMZXZlbE1lbnUodGhpcyk7XG4gICAgdGhpcy5tYWluTWVudSA9IG5ldyBNYWluTWVudSh0aGlzKTtcblxuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbn1cblxuU3RhdGUucHJvdG90eXBlLl9jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9ICdzdGF0ZSc7XG4gICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9XG4gICAgICAgICc8ZGl2IGNsYXNzPVwic3RhdGVfX21haW5NZW51XCI+PC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwic3RhdGVfX2xldmVsTWVudVwiPjwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInN0YXRlX19hY3RpdmVMZXZlbFwiPjwvZGl2Pic7XG5cbiAgICB0aGlzLm1haW5NZW51RWxlbWVudCA9IHRoaXMuZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzdGF0ZV9fbWFpbk1lbnUnKVswXTtcbiAgICB0aGlzLm1haW5NZW51RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLm1haW5NZW51LmVsZW1lbnQpO1xuXG4gICAgdGhpcy5sZXZlbE1lbnVFbGVtZW50ID0gdGhpcy5lbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3N0YXRlX19sZXZlbE1lbnUnKVswXTtcbiAgICB0aGlzLmxldmVsTWVudUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5sZXZlbE1lbnUuZWxlbWVudCk7XG5cbiAgICB0aGlzLmFjdGl2ZUxldmVsRWxlbWVudCA9IHRoaXMuZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzdGF0ZV9fYWN0aXZlTGV2ZWwnKVswXTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5fYWN0aXZhdGUgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgaWYgKHRoaXMuX2FjdGl2ZUVsZW1lbnQgPT09IGVsZW1lbnQpIHsgcmV0dXJuOyB9XG5cbiAgICBpZiAodGhpcy5fYWN0aXZlRWxlbWVudCkge1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuX2FjdGl2ZUVsZW1lbnQsICdfc2hvd2VkJyk7XG4gICAgfVxuXG4gICAgdXRpbC5hZGRDbGFzcyhlbGVtZW50LCAnX3Nob3dlZCcpO1xuICAgIHRoaXMuX2FjdGl2ZUVsZW1lbnQgPSBlbGVtZW50O1xufTtcblxuU3RhdGUucHJvdG90eXBlLnJ1bkxldmVsTWVudSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMubGV2ZWxNZW51LnVwZGF0ZSgpO1xuICAgIHRoaXMuX2FjdGl2YXRlKHRoaXMubGV2ZWxNZW51RWxlbWVudCk7XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUucnVuTWFpbk1lbnUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9hY3RpdmF0ZSh0aGlzLm1haW5NZW51RWxlbWVudCk7XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUucnVuTGV2ZWwgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdGhpcy5tYWluTWVudS5yZXN1bWVMZXZlbEFjdGl2ZSgpO1xuXG4gICAgdmFyIG5ld0xldmVsID0gbmV3IGxldmVsTW9kdWxlc1tuYW1lXShuYW1lLCB0aGlzKTtcblxuICAgIGlmICh0aGlzLl9hY3RpdmVMZXZlbCkge1xuICAgICAgICB0aGlzLmFjdGl2ZUxldmVsRWxlbWVudC5yZXBsYWNlQ2hpbGQobmV3TGV2ZWwuZWxlbWVudCwgdGhpcy5fYWN0aXZlTGV2ZWwuZWxlbWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hY3RpdmVMZXZlbEVsZW1lbnQuYXBwZW5kQ2hpbGQobmV3TGV2ZWwuZWxlbWVudCk7XG4gICAgfVxuXG4gICAgdGhpcy5fYWN0aXZlTGV2ZWwgPSBuZXdMZXZlbDtcblxuICAgIHRoaXMuX2FjdGl2YXRlKHRoaXMuYWN0aXZlTGV2ZWxFbGVtZW50KTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5iYWNrRnJvbUxldmVsID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5ydW5NYWluTWVudSgpO1xufTtcblxuU3RhdGUucHJvdG90eXBlLnJlc3VtZUxldmVsID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX2FjdGl2ZUxldmVsKSB7XG4gICAgICAgIHRoaXMuX2FjdGl2YXRlKHRoaXMuYWN0aXZlTGV2ZWxFbGVtZW50KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRlOyIsInZhciB1dGlsID0ge307XG5cbnV0aWwuYWRkQ2xhc3MgPSBmdW5jdGlvbihlbCwgbmFtZSkge1xuICAgIHZhciBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG4gICAgdmFyIGluZGV4ID0gY2xhc3NOYW1lcy5pbmRleE9mKG5hbWUpO1xuXG4gICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICBjbGFzc05hbWVzLnB1c2gobmFtZSk7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZXMuam9pbignICcpO1xuICAgIH1cblxuICAgIHJldHVybiBlbDtcbn07XG5cbnV0aWwucmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbihlbCwgbmFtZSkge1xuICAgIHZhciBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG4gICAgdmFyIGluZGV4ID0gY2xhc3NOYW1lcy5pbmRleE9mKG5hbWUpO1xuXG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICBjbGFzc05hbWVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZXMuam9pbignICcpO1xuICAgIH1cblxuICAgIHJldHVybiBlbDtcbn07XG5cbnV0aWwuaGFzQ2xhc3MgPSBmdW5jdGlvbihlbCwgbmFtZSkge1xuICAgIHZhciBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG5cbiAgICByZXR1cm4gY2xhc3NOYW1lcy5pbmRleE9mKG5hbWUpICE9IC0xO1xufTtcblxudXRpbC5mb3JFYWNoID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChvYmoubGVuZ3RoKSB7XG4gICAgICAgIG9iai5mb3JFYWNoKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtrZXldLCBrZXkpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG51dGlsLm9uID0gZnVuY3Rpb24obm9kZSwgdHlwZSwgY2FsbGJhY2spIHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgY2FsbGJhY2spO1xufTtcblxudXRpbC5vZmYgPSBmdW5jdGlvbihub2RlLCB0eXBlLCBjYWxsYmFjaykge1xuICAgIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBjYWxsYmFjayk7XG59O1xuXG5cbi8vIFNlZW0gbGVnaXRcbnZhciBpc01vYmlsZSA9ICgnRGV2aWNlT3JpZW50YXRpb25FdmVudCcgaW4gd2luZG93IHx8ICdvcmllbnRhdGlvbicgaW4gd2luZG93KTtcbi8vIEJ1dCB3aXRoIG15IENocm9tZSBvbiB3aW5kb3dzLCBEZXZpY2VPcmllbnRhdGlvbkV2ZW50ID09IGZjdCgpXG5pZiAoL1dpbmRvd3MgTlR8TWFjaW50b3NofE1hYyBPUyBYfExpbnV4L2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkgaXNNb2JpbGUgPSBmYWxzZTtcbi8vIE15IGFuZHJvaWQgaGF2ZSBcImxpbnV4XCIgdG9vXG5pZiAoL01vYmlsZS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIGlzTW9iaWxlID0gdHJ1ZTtcblxudXRpbC5pc01vYmlsZSA9IGlzTW9iaWxlO1xuXG51dGlsLnJnYlN1bSA9IGZ1bmN0aW9uKGFycikge1xuICAgIC8vW3tyZ2IsIHJhdGlvfSwgLi4uXVxuXG4gICAgdmFyIHN1bSA9IFswLCAwLCAwXTtcbiAgICB2YXIgbiA9IDA7XG4gICAgdmFyIGVsLCBpLCBqO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICBlbCA9IGFycltpXTtcblxuICAgICAgICBmb3IgKGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICAgICAgICBzdW1bal0gKz0gZWwucmdiW2pdICogZWwucmF0aW87XG4gICAgICAgIH1cblxuICAgICAgICBuICs9IGVsLnJhdGlvO1xuICAgIH1cblxuICAgIGZvciAoaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgICAgc3VtW2pdID0gTWF0aC5mbG9vcihzdW1bal0gLyBuKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3VtO1xufTtcblxudXRpbC5udWxsRm4gPSBmdW5jdGlvbigpIHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWw7XG4iXX0=