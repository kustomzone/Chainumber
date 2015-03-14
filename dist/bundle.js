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

    this.widthText = null;

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

    var textLength = this.value.toString().length;

    if (textLength >= 5 && textLength <= 10 && this.widthText !== textLength) {
        if (this.widthText) {
            util.removeClass(this.element, '_len_' + textLength);
        }

        util.addClass(this.element, '_len_' + textLength);
    }

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
    }, 15);
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

function Field(game, restoreData) {
    restoreData = restoreData || {};

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
    this._restoreData(restoreData);
}

Field.prototype._init = function() {
    for (var i = 0; i < this.size[0]; i++) {
        this._blocksXY[i] = {};

        for (var j = 0; j < this.size[1]; j++) {
            this.createBlock(i, j, true);
        }
    }
};

Field.prototype._restoreData = function(restoreData) {
    if (restoreData.blocks) {
        for (var i = 0; i < this.size[0]; i++) {
            for (var j = 0; j < this.size[1]; j++) {
                this.blocks[this._blocksXY[i][j]].changeValue(restoreData.blocks[i][j].value);
            }
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

Field.prototype.getState = function() {
    var state = {
        blocks: {}
    };

    for (var i = 0; i < this.size[0]; i++) {
        state.blocks[i] = {};

        for (var j = 0; j < this.size[1]; j++) {
            state.blocks[i][j] = {
                value: this.blocks[this._blocksXY[i][j]].value
            };
        }
    }

    return state;
};

module.exports = Field;

},{"../gameConfig":6,"../util":15,"./block.js":2}],5:[function(require,module,exports){
var levelStore = require('../levelStore.js');
var Field = require('./field.js');
var util = require('../util');

function Game(name, state, restoreData) {
    restoreData = restoreData || {};

    this.name = name;
    this.state = state;
    this.store = levelStore.get(name);

    this.score = restoreData.score || 0;

    this.field = new Field(this, restoreData.field);

    this._createElement();
    this._bindEvents();
}

Game.prototype._createElement = function() {
    var element = document.createElement('div');
    element.className = 'game';

    var template =
        '<div class="game__header">' +
            '<div class="game__levelName">Level: {{name}}</div>' +
            '<div class="game__score">{{score}}</div>' +
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
        .replace('{{score}}', this.score)
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
    this.state.runLevelMenu();
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

    this.store.maxScore = this.score;

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

Game.prototype.getState = function() {
    return {
        field: this.field.getState(),
        name: this.name,
        score: this.score
    }
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

var savedLevels = saves.getLevels();

var levelStore = {};

var levels = {};

function initLevels() {
    gameConfig.levels.forEach(function(name) {
        var level = levelConfig[name];
        level.name = name;

        if (savedLevels[name]) {
            level.currentGoal = Number(savedLevels[name].currentGoal) || 0;
            level.maxScore = Number(savedLevels[name].maxScore) || 0;
        } else {
            level.currentGoal = 0;
            level.maxScore = 0;
        }

        levels[name] = level;
    });

    util.on(window, 'beforeunload', onCloseHandler);
}

function onCloseHandler() {
    var dataToSave = {};

    util.forEach(levels, function(level, name) {
        dataToSave[name] = {
            maxScore: level.maxScore,
            currentGoal: level.currentGoal
        }
    });

    saves.setLevels(dataToSave);
}

levelStore.get = function(name) {
    return levels[name];
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

function Level(name, state, restoreData) {
    Game.call(this, name, state, restoreData);
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

function getFromLocalStorage(name) {
    var levelsJSON = localStorage.getItem(name);
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
}

function setToLocalStorage(name, data) {
    localStorage.setItem(name, JSON.stringify(data));
}

saves.getLevels = function() {
    return getFromLocalStorage('levels');
};

saves.setLevels = function(data) {
    setToLocalStorage('levels', data);
};

saves.setActiveLevel = function(data) {
    setToLocalStorage('activeLevel', data);
};

saves.getActiveLevel = function() {
    return getFromLocalStorage('activeLevel');
};

module.exports = saves;

},{}],14:[function(require,module,exports){
var LevelMenu = require('./levelMenu/levelMenu');
var MainMenu = require('./mainMenu/mainMenu');
var saves = require('./saves');

var levelModules = require('./levelModules');
var util = require('./util');

function State() {
    this._activeElement = null;
    this._activeLevel = null;

    this.levelMenu = new LevelMenu(this);
    this.mainMenu = new MainMenu(this);

    this._createElement();
    this._bindEvents();
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
        '<div class="state__levelMenu"></div>' +
        '<div class="state__activeLevel"></div>';

    this.mainMenuElement = this.element.getElementsByClassName('state__mainMenu')[0];
    this.mainMenuElement.appendChild(this.mainMenu.element);

    this.levelMenuElement = this.element.getElementsByClassName('state__levelMenu')[0];
    this.levelMenuElement.appendChild(this.levelMenu.element);

    this.activeLevelElement = this.element.getElementsByClassName('state__activeLevel')[0];
};

State.prototype._bindEvents = function() {
    util.on(window, 'beforeunload', this._onCloseHandler.bind(this));

    window.go = this._onCloseHandler.bind(this);
};

State.prototype._onCloseHandler = function() {
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
};

State.prototype.runLevelMenu = function() {
    this.levelMenu.update();
    this._activate(this.levelMenuElement);
};

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
},{"./levelMenu/levelMenu":7,"./levelModules":8,"./mainMenu/mainMenu":12,"./saves":13,"./util":15}],15:[function(require,module,exports){
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


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvaW5kZXguanMiLCJzcmMvanMvZ2FtZS9ibG9jay5qcyIsInNyYy9qcy9nYW1lL2NvbG9ycy5qcyIsInNyYy9qcy9nYW1lL2ZpZWxkLmpzIiwic3JjL2pzL2dhbWUvZ2FtZS5qcyIsInNyYy9qcy9nYW1lQ29uZmlnLmpzIiwic3JjL2pzL2xldmVsTWVudS9sZXZlbE1lbnUuanMiLCJzcmMvanMvbGV2ZWxNb2R1bGVzLmpzIiwic3JjL2pzL2xldmVsU3RvcmUuanMiLCJzcmMvanMvbGV2ZWxzLzEuanMiLCJzcmMvanMvbGV2ZWxzLzIuanMiLCJzcmMvanMvbWFpbk1lbnUvbWFpbk1lbnUuanMiLCJzcmMvanMvc2F2ZXMuanMiLCJzcmMvanMvc3RhdGUuanMiLCJzcmMvanMvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImJ1bmRsZS5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFN0YXRlID0gcmVxdWlyZSgnLi9zdGF0ZS5qcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxuaWYgKCF1dGlsLmlzTW9iaWxlKSB7XG4gICAgdXRpbC5hZGRDbGFzcyhkb2N1bWVudC5ib2R5LCAnbm8tdG91Y2gnKTtcbn1cblxudmFyIGh0bWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ2FtZScpO1xuXG52YXIgc3RhdGUgPSBuZXcgU3RhdGUoKTtcblxuaHRtbC5hcHBlbmRDaGlsZChzdGF0ZS5lbGVtZW50KTtcblxuc3RhdGUucnVuTWFpbk1lbnUoKTtcbiIsInZhciBjb2xvcnMgPSByZXF1aXJlKCcuL2NvbG9ycy5qcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsLmpzJyk7XG5cbnZhciBwcmltZU51bWJlcnMgPSBbMSwgMiwgMywgNSwgNywgMTEsIDEzXTtcblxudmFyIGlkQ291bnRlciA9IDA7XG5cbi8vIGNhc2hlIG9mIGNvbG9ycywgdmFsdWUgLT4gcmdiKC4uLC4uLC4uKVxudmFyIGNvbG9yc0NhY2hlID0ge307XG5cbmZ1bmN0aW9uIEJsb2NrKHgsIHksIGZpZWxkKSB7XG4gICAgdGhpcy5pZCA9ICsraWRDb3VudGVyO1xuXG4gICAgdGhpcy5maWVsZCA9IGZpZWxkO1xuICAgIHRoaXMuY29uZmlnID0gZmllbGQuY29uZmlnO1xuXG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuXG4gICAgdGhpcy52YWx1ZSA9IG51bGw7XG4gICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcblxuICAgIHRoaXMud2lkdGggPSA1MDAgLyB0aGlzLmNvbmZpZy5maWVsZC5zaXplWzBdO1xuICAgIHRoaXMuaGVpZ2h0ID0gNTAwIC8gdGhpcy5jb25maWcuZmllbGQuc2l6ZVsxXTtcblxuICAgIHRoaXMud2lkdGhUZXh0ID0gbnVsbDtcblxuICAgIHRoaXMuX3NldFJhbmRvbVZhbHVlKCk7XG4gICAgdGhpcy5fY3JlYXRlRWxlbWVudCgpO1xuICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcbn1cblxuQmxvY2sucHJvdG90eXBlLl9jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBlbGVtZW50LmNsYXNzTmFtZSA9ICdibG9jayc7XG5cbiAgICBlbGVtZW50LnN0eWxlLmxlZnQgPSBNYXRoLmZsb29yKHRoaXMueCAqIHRoaXMud2lkdGgpICsgJ3B4JztcbiAgICBlbGVtZW50LnN0eWxlLmJvdHRvbSA9IE1hdGguZmxvb3IodGhpcy55ICogdGhpcy5oZWlnaHQpICsgJ3B4JztcblxuICAgIHZhciBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGlubmVyLmNsYXNzTmFtZSA9ICdibG9ja19faW5uZXInO1xuICAgIGlubmVyLmlubmVySFRNTCA9IHRoaXMudmFsdWU7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChpbm5lcik7XG5cbiAgICB2YXIgYWN0aXZlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgYWN0aXZlLmNsYXNzTmFtZSA9ICdibG9ja19fYWN0aXZlJztcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGFjdGl2ZSk7XG5cbiAgICB0aGlzLmlubmVyRWxlbWVudCA9IGlubmVyO1xuICAgIHRoaXMuYWN0aXZlRWxlbWVudCA9IGFjdGl2ZTtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXG4gICAgdGhpcy5fdXBkYXRlQ29sb3JzKCk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuX3NldFJhbmRvbVZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN1bW1SYXRpb24gPSAwO1xuICAgIHZhciBwb3NzaWJsZVZhbHVlcyA9IHRoaXMuY29uZmlnLm51bWJlcnMucG9zc2libGVWYWx1ZXM7XG5cbiAgICBwb3NzaWJsZVZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgIHN1bW1SYXRpb24gKz0gZWxbMV07XG4gICAgfSk7XG5cbiAgICB2YXIgc3VtbSA9IDA7XG5cbiAgICB2YXIgY2hhbmNlQXJyYXkgPSBwb3NzaWJsZVZhbHVlcy5tYXAoZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgdmFyIHZhbCA9IGVsWzFdIC8gc3VtbVJhdGlvbiArIHN1bW07XG5cbiAgICAgICAgc3VtbSA9IHZhbDtcblxuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0pO1xuXG4gICAgdmFyIHJvbGwgPSBNYXRoLnJhbmRvbSgpO1xuXG4gICAgdmFyIHZhbHVlID0gMDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hhbmNlQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHJvbGwgPD0gY2hhbmNlQXJyYXlbaV0pIHtcbiAgICAgICAgICAgIHZhbHVlID0gcG9zc2libGVWYWx1ZXNbaV1bMF07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5fYmluZEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh1dGlsLmlzTW9iaWxlKSB7XG4gICAgICAgIHV0aWwub24odGhpcy5lbGVtZW50LCAndG91Y2hzdGFydCcsIHRoaXMuX21vdXNlRG93bkhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXRpbC5vbih0aGlzLmVsZW1lbnQsICdtb3VzZWRvd24nLCB0aGlzLl9tb3VzZURvd25IYW5kbGVyLmJpbmQodGhpcykpO1xuICAgICAgICB1dGlsLm9uKHRoaXMuYWN0aXZlRWxlbWVudCwgJ21vdXNlb3ZlcicsIHRoaXMuX21vdXNlT3ZlckhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgICAgIC8vdXRpbC5vbih0aGlzLmFjdGl2ZUVsZW1lbnQsICdtb3VzZW91dCcsIHRoaXMuX21vdXNlT3V0SGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9XG59O1xuXG5CbG9jay5wcm90b3R5cGUuX21vdXNlRG93bkhhbmRsZXIgPSBmdW5jdGlvbihldikge1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB0aGlzLmZpZWxkLmJsb2NrTW91c2VEb3duKHRoaXMuaWQpO1xufTtcblxuXG5CbG9jay5wcm90b3R5cGUuX21vdXNlT3ZlckhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmZpZWxkLmJsb2NrTW91c2VPdmVyKHRoaXMuaWQpO1xufTtcblxuXG5CbG9jay5wcm90b3R5cGUuX21vdXNlT3V0SGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZmllbGQuYmxvY2tNb3VzZU91dCh0aGlzLmlkKTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5jaGFuZ2VQb3NpdGlvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG5cbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUubGVmdCA9IE1hdGguZmxvb3IoeCAqIHRoaXMud2lkdGgpICsgJ3B4JztcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUuYm90dG9tID0gTWF0aC5mbG9vcih5ICogdGhpcy5oZWlnaHQpICsgJ3B4Jztcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5fdXBkYXRlQ29sb3JzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCFjb2xvcnNDYWNoZVt0aGlzLnZhbHVlXSkge1xuICAgICAgICAvLyA3IC0+IDMgKHByaW1lTnVtYmVyIC0+IHJhdGlvKVxuICAgICAgICB2YXIgcHJpbWVBcnJheSA9IFtdO1xuICAgICAgICB2YXIgaTtcblxuICAgICAgICBmb3IgKGkgPSBwcmltZU51bWJlcnMubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgJSBwcmltZU51bWJlcnNbaV0gPT09IDApIHtcbiAgICAgICAgICAgICAgICBwcmltZUFycmF5LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJpbWVOdW1iZXJzW2ldLFxuICAgICAgICAgICAgICAgICAgICByZ2I6IGNvbG9yc1tpXS5yZ2IsXG4gICAgICAgICAgICAgICAgICAgIHJhdGlvOiB0aGlzLnZhbHVlIC8gcHJpbWVOdW1iZXJzW2ldXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY29sb3I7XG5cbiAgICAgICAgaWYgKHByaW1lQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb2xvciA9IHV0aWwucmdiU3VtKHByaW1lQXJyYXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29sb3IgPSBjb2xvcnNbMF0ucmdiO1xuICAgICAgICB9XG5cbiAgICAgICAgY29sb3JzQ2FjaGVbdGhpcy52YWx1ZV0gPSAncmdiKCcgKyBjb2xvci5qb2luKCcsJykgKyAnKSc7XG4gICAgfVxuXG4gICAgdGhpcy5pbm5lckVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3JzQ2FjaGVbdGhpcy52YWx1ZV07XG59O1xuXG5CbG9jay5wcm90b3R5cGUuY2hhbmdlVmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLmlubmVyRWxlbWVudC5pbm5lckhUTUwgPSB2YWx1ZTtcblxuICAgIHZhciB0ZXh0TGVuZ3RoID0gdGhpcy52YWx1ZS50b1N0cmluZygpLmxlbmd0aDtcblxuICAgIGlmICh0ZXh0TGVuZ3RoID49IDUgJiYgdGV4dExlbmd0aCA8PSAxMCAmJiB0aGlzLndpZHRoVGV4dCAhPT0gdGV4dExlbmd0aCkge1xuICAgICAgICBpZiAodGhpcy53aWR0aFRleHQpIHtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5lbGVtZW50LCAnX2xlbl8nICsgdGV4dExlbmd0aCk7XG4gICAgICAgIH1cblxuICAgICAgICB1dGlsLmFkZENsYXNzKHRoaXMuZWxlbWVudCwgJ19sZW5fJyArIHRleHRMZW5ndGgpO1xuICAgIH1cblxuICAgIHRoaXMuX3VwZGF0ZUNvbG9ycygpO1xufTtcblxuQmxvY2sucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5lbGVtZW50LCAnX3NlbGVjdGVkJyk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUudW5zZWxlY3QgPSBmdW5jdGlvbigpIHtcbiAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuZWxlbWVudCwgJ19zZWxlY3RlZCcpO1xufTtcblxuQmxvY2sucHJvdG90eXBlLmFuaW1hdGVDcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB1dGlsLmFkZENsYXNzKHRoaXMuZWxlbWVudCwgJ19ibGluaycpO1xuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhzZWxmLmVsZW1lbnQsICdfYmxpbmsnKTtcbiAgICB9LCAxNSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJsb2NrO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG4gICAge1xuICAgICAgICB3ZWI6ICcjOTliNDMzJyxcbiAgICAgICAgcmdiOiBbMTU0LCAxODAsIDUxXVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnI0RBNTMyQycsXG4gICAgICAgIHJnYjogWzIxOCwgODMsIDQ0XVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnIzFlNzE0NScsXG4gICAgICAgIHJnYjogWzMwLCAxMTMsIDY5XVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnIzJDODlBMCcsXG4gICAgICAgIHJnYjogWzQ0LCAxMzcsIDE2MF1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyMwMEFBODgnLFxuICAgICAgICByZ2I6IFswLCAxNzAsIDEzNl1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyMwMGQ0NTUnLFxuICAgICAgICByZ2I6IFswLCAyMTIsIDg1XVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnI2ZmMmEyYScsXG4gICAgICAgIHJnYjogWzI1NSwgNDIsIDQyXVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnI0NCNTAwMCcsXG4gICAgICAgIHJnYjogWzIwMywgODAsIDBdXG4gICAgfVxuXTtcbiIsInZhciBCbG9jayA9IHJlcXVpcmUoJy4vYmxvY2suanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xudmFyIGdhbWVDb25maWcgPSByZXF1aXJlKCcuLi9nYW1lQ29uZmlnJyk7XG5cbmZ1bmN0aW9uIEZpZWxkKGdhbWUsIHJlc3RvcmVEYXRhKSB7XG4gICAgcmVzdG9yZURhdGEgPSByZXN0b3JlRGF0YSB8fCB7fTtcblxuICAgIHRoaXMuZ2FtZSA9IGdhbWU7XG4gICAgdGhpcy5jb25maWcgPSBnYW1lLnN0b3JlO1xuXG4gICAgdGhpcy5ibG9ja3MgPSB7fTtcbiAgICB0aGlzLl9ibG9ja3NYWSA9IHt9O1xuICAgIHRoaXMuc2l6ZSA9IHRoaXMuY29uZmlnLmZpZWxkLnNpemU7XG5cbiAgICB0aGlzLnNlbGVjdGVkQmxvY2tzID0gW107XG4gICAgdGhpcy5zZWxlY3RlZE1vZGUgPSBmYWxzZTtcblxuICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fY3JlYXRlRWxlbWVudCgpO1xuICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcbiAgICB0aGlzLl9yZXN0b3JlRGF0YShyZXN0b3JlRGF0YSk7XG59XG5cbkZpZWxkLnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zaXplWzBdOyBpKyspIHtcbiAgICAgICAgdGhpcy5fYmxvY2tzWFlbaV0gPSB7fTtcblxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuc2l6ZVsxXTsgaisrKSB7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUJsb2NrKGksIGosIHRydWUpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLl9yZXN0b3JlRGF0YSA9IGZ1bmN0aW9uKHJlc3RvcmVEYXRhKSB7XG4gICAgaWYgKHJlc3RvcmVEYXRhLmJsb2Nrcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2l6ZVswXTsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuc2l6ZVsxXTsgaisrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ibG9ja3NbdGhpcy5fYmxvY2tzWFlbaV1bal1dLmNoYW5nZVZhbHVlKHJlc3RvcmVEYXRhLmJsb2Nrc1tpXVtqXS52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuY3JlYXRlQmxvY2sgPSBmdW5jdGlvbih4LCB5LCBpc0luaXQpIHtcbiAgICB2YXIgYmxvY2sgPSBuZXcgQmxvY2soeCwgeSwgdGhpcyk7XG5cbiAgICB0aGlzLmJsb2Nrc1tibG9jay5pZF0gPSBibG9jaztcblxuICAgIHRoaXMuX2Jsb2Nrc1hZW3hdW3ldID0gYmxvY2suaWQ7XG5cbiAgICBpZiAoIWlzSW5pdCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoYmxvY2suZWxlbWVudCk7XG4gICAgICAgIGJsb2NrLmFuaW1hdGVDcmVhdGUoKTtcbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHRoaXMuY2FudmFzLmNsYXNzTmFtZSA9ICdmaWVsZF9fY2FudmFzJztcblxuICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIHRoaXMuY2FudmFzLndpZHRoID0gZ2FtZUNvbmZpZy5maWVsZC53aWR0aDtcbiAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSBnYW1lQ29uZmlnLmZpZWxkLmhlaWdodDtcbiAgICBmcmFnbWVudC5hcHBlbmRDaGlsZCh0aGlzLmNhbnZhcyk7XG5cbiAgICB1dGlsLmZvckVhY2godGhpcy5ibG9ja3MsIGZ1bmN0aW9uKGJsKSB7XG4gICAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGJsLmVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9ICdmaWVsZCcgK1xuICAgICAgICAnIF93aWR0aF8nICsgdGhpcy5zaXplWzBdICtcbiAgICAgICAgJyBfaGVpZ2h0XycgKyB0aGlzLnNpemVbMV07XG5cbiAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHV0aWwuaXNNb2JpbGUpIHtcbiAgICAgICAgdXRpbC5vbihkb2N1bWVudC5ib2R5LCAndG91Y2hlbmQnLCB0aGlzLl9tb3VzZVVwSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICAgICAgdXRpbC5vbihkb2N1bWVudC5ib2R5LCAndG91Y2htb3ZlJywgdGhpcy5fdG91Y2hNb3ZlSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1dGlsLm9uKGRvY3VtZW50LmJvZHksICdtb3VzZXVwJywgdGhpcy5fbW91c2VVcEhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLl90b3VjaE1vdmVIYW5kbGVyID0gZnVuY3Rpb24oZXYpIHtcbiAgICB2YXIgaXNCcmVhaywgYmxvY2ssIGtleXMsdG91Y2gsIHRhcmdldCwgaSwgajtcbiAgICB2YXIgYmxvY2tzID0gdGhpcy5ibG9ja3M7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgZXYuY2hhbmdlZFRvdWNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdG91Y2ggPSBldi5jaGFuZ2VkVG91Y2hlc1tpXTtcbiAgICAgICAgdGFyZ2V0ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh0b3VjaC5jbGllbnRYLCB0b3VjaC5jbGllbnRZKTtcblxuICAgICAgICBpZiAoIXRhcmdldCB8fCB0YXJnZXQuY2xhc3NOYW1lLmluZGV4T2YoJ2Jsb2NrX19hY3RpdmUnKSA9PSAtMSkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgIC8vINC00LXQu9Cw0LXQvCBmb3IsINCwINC90LUgZm9yRWFjaCwg0YfRgtC+0LHRiyDQvNC+0LbQvdC+INCx0YvQu9C+INGB0YLQvtC/0L3Rg9GC0YxcbiAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzKGJsb2Nrcyk7XG5cbiAgICAgICAgZm9yIChqID0gMDsgaiA8IGtleXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGJsb2NrID0gYmxvY2tzW2tleXNbal1dO1xuXG4gICAgICAgICAgICBpZiAoYmxvY2suYWN0aXZlRWxlbWVudCA9PT0gdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ibG9ja01vdXNlT3ZlcihibG9jay5pZCk7XG4gICAgICAgICAgICAgICAgaXNCcmVhayA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNCcmVhaykge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX21vdXNlVXBIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLnNlbGVjdGVkTW9kZSkgeyByZXR1cm47IH1cblxuICAgIHRoaXMuc2VsZWN0ZWRNb2RlID0gZmFsc2U7XG5cbiAgICB0aGlzLl9ydW5TZWxlY3RlZCgpO1xuXG4gICAgdXRpbC5mb3JFYWNoKHRoaXMuYmxvY2tzLCBmdW5jdGlvbihibG9jaykge1xuICAgICAgICBibG9jay51bnNlbGVjdCgpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5nYW1lLnVwZGF0ZUNoYWluU3VtKCk7XG5cbiAgICB0aGlzLl9jbGVhclBhdGgoKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5ibG9ja01vdXNlRG93biA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdGhpcy5zZWxlY3RlZE1vZGUgPSB0cnVlO1xuICAgIHRoaXMuc2VsZWN0ZWRCbG9ja3MgPSBbaWRdO1xuXG4gICAgdGhpcy5ibG9ja3NbaWRdLnNlbGVjdCgpO1xuXG4gICAgdGhpcy5nYW1lLnVwZGF0ZUNoYWluU3VtKCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2NoZWNrV2l0aExhc3QgPSBmdW5jdGlvbihpZCkge1xuICAgIHZhciBsYXN0QmwgPSB0aGlzLmJsb2Nrc1t0aGlzLnNlbGVjdGVkQmxvY2tzW3RoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoIC0gMV1dO1xuICAgIHZhciBuZXdCbCA9IHRoaXMuYmxvY2tzW2lkXTtcblxuICAgIHJldHVybiBsYXN0QmwudmFsdWUgPT0gbmV3QmwudmFsdWUgJiZcbiAgICAgICAgTWF0aC5hYnMobGFzdEJsLnggLSBuZXdCbC54KSA8PSAxICYmXG4gICAgICAgIE1hdGguYWJzKGxhc3RCbC55IC0gbmV3QmwueSkgPD0gMTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5ibG9ja01vdXNlT3ZlciA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgaWYgKCF0aGlzLnNlbGVjdGVkTW9kZSkgeyByZXR1cm47IH1cblxuICAgIHZhciBzZWxCbG9ja3MgPSB0aGlzLnNlbGVjdGVkQmxvY2tzO1xuXG4gICAgaWYgKHNlbEJsb2Nrcy5pbmRleE9mKGlkKSA9PSAtMSkge1xuICAgICAgICBpZiAodGhpcy5fY2hlY2tXaXRoTGFzdChpZCkpIHtcbiAgICAgICAgICAgIHNlbEJsb2Nrcy5wdXNoKGlkKTtcbiAgICAgICAgICAgIHRoaXMuYmxvY2tzW2lkXS5zZWxlY3QoKTtcblxuICAgICAgICAgICAgdGhpcy5nYW1lLnVwZGF0ZUNoYWluU3VtKCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVQYXRoKCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoc2VsQmxvY2tzW3NlbEJsb2Nrcy5sZW5ndGggLSAyXSA9PSBpZCkge1xuICAgICAgICAgICAgdmFyIGxhc3RCbElkID0gc2VsQmxvY2tzLnBvcCgpO1xuICAgICAgICAgICAgdGhpcy5ibG9ja3NbbGFzdEJsSWRdLnVuc2VsZWN0KCk7XG5cbiAgICAgICAgICAgIHRoaXMuZ2FtZS51cGRhdGVDaGFpblN1bSgpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlUGF0aCgpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLl91cGRhdGVQYXRoID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGN0eCA9IHRoaXMuY3R4O1xuICAgIHZhciBmaWVsZEhlaWdodCA9IGdhbWVDb25maWcuZmllbGQuaGVpZ2h0O1xuXG4gICAgdGhpcy5fY2xlYXJQYXRoKCk7XG5cbiAgICBjdHguYmVnaW5QYXRoKCk7XG5cbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBnYW1lQ29uZmlnLnBhdGguY29sb3I7XG4gICAgY3R4LmxpbmVXaWR0aCA9IGdhbWVDb25maWcucGF0aC53aWR0aDtcblxuICAgIHRoaXMuc2VsZWN0ZWRCbG9ja3MuZm9yRWFjaChmdW5jdGlvbihpZCwgaSkge1xuICAgICAgICB2YXIgYmxvY2sgPSB0aGlzLmJsb2Nrc1tpZF07XG4gICAgICAgIHZhciB4ID0gKGJsb2NrLnggKyAwLjUpICogYmxvY2sud2lkdGg7XG4gICAgICAgIHZhciB5ID0gZmllbGRIZWlnaHQgLSAoYmxvY2sueSArIDAuNSkgKiBibG9jay5oZWlnaHQ7XG5cbiAgICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAgIGN0eC5tb3ZlVG8oeCwgeSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdHgubGluZVRvKHgsIHkpO1xuICAgICAgICB9XG4gICAgfSwgdGhpcyk7XG5cbiAgICBjdHguc3Ryb2tlKCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2NsZWFyUGF0aCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCBnYW1lQ29uZmlnLmZpZWxkLndpZHRoLCBnYW1lQ29uZmlnLmZpZWxkLmhlaWdodCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuYmxvY2tNb3VzZU91dCA9IGZ1bmN0aW9uKGlkKSB7XG5cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fYmxvY2tSZW1vdmUgPSBmdW5jdGlvbihpZCkge1xuICAgIHZhciBibG9jayA9IHRoaXMuYmxvY2tzW2lkXTtcblxuICAgIHRoaXMuZWxlbWVudC5yZW1vdmVDaGlsZChibG9jay5lbGVtZW50KTtcblxuICAgIHRoaXMuX2Jsb2Nrc1hZW2Jsb2NrLnhdW2Jsb2NrLnldID0gbnVsbDtcbiAgICBkZWxldGUgdGhpcy5ibG9ja3NbaWRdO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9ydW5TZWxlY3RlZCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnNlbGVjdGVkQmxvY2tzLmxlbmd0aCA8IHRoaXMuY29uZmlnLmNoYWluLm1pbkxlbmd0aCkgeyByZXR1cm47IH1cblxuICAgIHRoaXMuZ2FtZS51cGRhdGVTY29yZSgpO1xuXG4gICAgdmFyIGxhc3RCbElkID0gdGhpcy5zZWxlY3RlZEJsb2Nrcy5wb3AoKTtcbiAgICB2YXIgbGFzdEJsID0gdGhpcy5ibG9ja3NbbGFzdEJsSWRdO1xuICAgIHZhciB2YWx1ZSA9IGxhc3RCbC52YWx1ZSAqICh0aGlzLnNlbGVjdGVkQmxvY2tzLmxlbmd0aCArIDEpOyAvLyArMSBiZWNhdXNlIHBvcCBhYm92ZVxuXG4gICAgbGFzdEJsLmNoYW5nZVZhbHVlKHZhbHVlKTtcblxuICAgIHRoaXMuc2VsZWN0ZWRCbG9ja3MuZm9yRWFjaCh0aGlzLl9ibG9ja1JlbW92ZSwgdGhpcyk7XG5cbiAgICB0aGlzLl9jaGVja1Bvc2l0aW9ucygpO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9jaGVja1Bvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHZhciBibG9ja3NYWSA9IHRoaXMuX2Jsb2Nrc1hZO1xuICAgIHZhciBibG9ja3MgPSB0aGlzLmJsb2NrcztcblxuICAgIHV0aWwuZm9yRWFjaChibG9ja3NYWSwgZnVuY3Rpb24oYmxvY2tzWSkge1xuICAgICAgICB2YXIgYXJyID0gW107XG5cbiAgICAgICAgLy8g0LTQvtCx0LDQstC70Y/QtdC8INCyINC80LDRgdGB0LjQsiDRgdGD0YnQtdGB0YLQstGD0Y7RidC40LUg0LLQtdGA0YLQuNC60LDQu9GM0L3Ri9C1INGN0LvQtdC80LXQvdGC0YtcbiAgICAgICAgdXRpbC5mb3JFYWNoKGJsb2Nrc1ksIGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICBpZiAoaWQpIHsgYXJyLnB1c2goaWQpOyB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vINC10YHQu9C4INC/0L7Qu9C90YvQuSDQuNC70Lgg0L/Rg9GB0YLQvtC5XG4gICAgICAgIGlmIChhcnIubGVuZ3RoID09IHNlbGYuc2l6ZVsxXSB8fCAhYXJyKSB7IHJldHVybjsgfVxuXG4gICAgICAgIC8vINGB0L7RgNGC0LjRgNGD0LXQvFxuICAgICAgICBhcnIuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYmxvY2tzW2FdLnkgPiBibG9ja3NbYl0ueTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g0YHQtNCy0LjQs9Cw0LXQvCDQvtGC0YHQvtGA0YLQuNGA0L7QstCw0L3QvdGL0Lkg0YHQv9C40YHQvtC6INC6INC90LjQt9GDXG4gICAgICAgIGFyci5mb3JFYWNoKGZ1bmN0aW9uKGlkLCB5KSB7XG4gICAgICAgICAgICB2YXIgYmxvY2sgPSBibG9ja3NbaWRdO1xuXG4gICAgICAgICAgICBpZiAoYmxvY2sueSAhPSB5KSB7XG4gICAgICAgICAgICAgICAgYmxvY2tzWVtibG9jay55XSA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICBibG9jay5jaGFuZ2VQb3NpdGlvbihibG9jay54LCB5KTtcblxuICAgICAgICAgICAgICAgIGJsb2Nrc1lbeV0gPSBpZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9hZGROZXdCbG9ja3MoKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fYWRkTmV3QmxvY2tzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGJsb2Nrc1hZID0gdGhpcy5fYmxvY2tzWFk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2l6ZVswXTsgaSsrKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5zaXplWzFdOyBqKyspIHtcbiAgICAgICAgICAgIGlmICghYmxvY2tzWFlbaV1bal0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUJsb2NrKGksIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLmdldFN0YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN0YXRlID0ge1xuICAgICAgICBibG9ja3M6IHt9XG4gICAgfTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zaXplWzBdOyBpKyspIHtcbiAgICAgICAgc3RhdGUuYmxvY2tzW2ldID0ge307XG5cbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLnNpemVbMV07IGorKykge1xuICAgICAgICAgICAgc3RhdGUuYmxvY2tzW2ldW2pdID0ge1xuICAgICAgICAgICAgICAgIHZhbHVlOiB0aGlzLmJsb2Nrc1t0aGlzLl9ibG9ja3NYWVtpXVtqXV0udmFsdWVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3RhdGU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpZWxkO1xuIiwidmFyIGxldmVsU3RvcmUgPSByZXF1aXJlKCcuLi9sZXZlbFN0b3JlLmpzJyk7XG52YXIgRmllbGQgPSByZXF1aXJlKCcuL2ZpZWxkLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuZnVuY3Rpb24gR2FtZShuYW1lLCBzdGF0ZSwgcmVzdG9yZURhdGEpIHtcbiAgICByZXN0b3JlRGF0YSA9IHJlc3RvcmVEYXRhIHx8IHt9O1xuXG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG4gICAgdGhpcy5zdG9yZSA9IGxldmVsU3RvcmUuZ2V0KG5hbWUpO1xuXG4gICAgdGhpcy5zY29yZSA9IHJlc3RvcmVEYXRhLnNjb3JlIHx8IDA7XG5cbiAgICB0aGlzLmZpZWxkID0gbmV3IEZpZWxkKHRoaXMsIHJlc3RvcmVEYXRhLmZpZWxkKTtcblxuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbiAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XG59XG5cbkdhbWUucHJvdG90eXBlLl9jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBlbGVtZW50LmNsYXNzTmFtZSA9ICdnYW1lJztcblxuICAgIHZhciB0ZW1wbGF0ZSA9XG4gICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9faGVhZGVyXCI+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX2xldmVsTmFtZVwiPkxldmVsOiB7e25hbWV9fTwvZGl2PicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19zY29yZVwiPnt7c2NvcmV9fTwvZGl2PicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19jaGFpblN1bVwiPjwvZGl2PicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19nb2FsXCI+e3tnb2FsfX08L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX2JvZHlcIj48L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19mb290ZXJcIj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9fYmFja0J1dHRvblwiPk1lbnU8L2Rpdj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9fcmVzdGFydEJ1dHRvblwiPlJlc3RhcnQ8L2Rpdj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9fbmV4dEJ1dHRvblwiPk5leHQ8L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2Pic7XG5cbiAgICBlbGVtZW50LmlubmVySFRNTCA9IHRlbXBsYXRlXG4gICAgICAgIC5yZXBsYWNlKCd7e3Njb3JlfX0nLCB0aGlzLnNjb3JlKVxuICAgICAgICAucmVwbGFjZSgne3tnb2FsfX0nLCB0aGlzLl9nZXRHb2FsVGV4dCgpKVxuICAgICAgICAucmVwbGFjZSgne3tuYW1lfX0nLCB0aGlzLm5hbWUpO1xuXG4gICAgaWYgKHRoaXMuc3RvcmUuY3VycmVudEdvYWwgPiAwKSB7XG4gICAgICAgIHV0aWwuYWRkQ2xhc3MoZWxlbWVudCwgJ193aW4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmJhY2tCdXR0b24gPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dhbWVfX2JhY2tCdXR0b24nKVswXTtcbiAgICB0aGlzLnJlc3RhcnRCdXR0b24gPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dhbWVfX3Jlc3RhcnRCdXR0b24nKVswXTtcbiAgICB0aGlzLm5leHRCdXR0b24gPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dhbWVfX25leHRCdXR0b24nKVswXTtcblxuICAgIHRoaXMuZ29hbEVsZW1lbnQgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dhbWVfX2dvYWwnKVswXTtcbiAgICB0aGlzLnNjb3JlRWxlbWVudCA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnZ2FtZV9fc2NvcmUnKVswXTtcbiAgICB0aGlzLmNoYWluU3VtRWxlbWVudCA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnZ2FtZV9fY2hhaW5TdW0nKVswXTtcblxuICAgIHRoaXMuYm9keUVsZW1lbnQgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dhbWVfX2JvZHknKVswXTtcbiAgICB0aGlzLmJvZHlFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuZmllbGQuZWxlbWVudCk7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xufTtcblxuR2FtZS5wcm90b3R5cGUuX2JpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICB1dGlsLm9uKHRoaXMucmVzdGFydEJ1dHRvbiwgJ2NsaWNrJywgdGhpcy5yZXN0YXJ0LmJpbmQodGhpcykpO1xuICAgIHV0aWwub24odGhpcy5iYWNrQnV0dG9uLCAnY2xpY2snLCB0aGlzLl9iYWNrVG9NZW51LmJpbmQodGhpcykpO1xuICAgIHV0aWwub24odGhpcy5uZXh0QnV0dG9uLCAnY2xpY2snLCB0aGlzLl9uZXh0TGV2ZWwuYmluZCh0aGlzKSk7XG59O1xuXG5HYW1lLnByb3RvdHlwZS5fZ2V0R29hbFRleHQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zdG9yZS5jdXJyZW50R29hbCA8IDMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RvcmUuZ29hbHNbdGhpcy5zdG9yZS5jdXJyZW50R29hbF07XG4gICAgfVxuXG4gICAgcmV0dXJuICcnO1xufTtcblxuR2FtZS5wcm90b3R5cGUuX25leHRMZXZlbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3RhdGUucnVuTGV2ZWxNZW51KCk7XG59O1xuXG5HYW1lLnByb3RvdHlwZS5yZXN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5ld0ZpZWxkID0gbmV3IEZpZWxkKHRoaXMpO1xuXG4gICAgdGhpcy5ib2R5RWxlbWVudC5yZXBsYWNlQ2hpbGQobmV3RmllbGQuZWxlbWVudCwgdGhpcy5maWVsZC5lbGVtZW50KTtcblxuICAgIHRoaXMuc2NvcmUgPSAwO1xuICAgIHRoaXMuc2NvcmVFbGVtZW50LmlubmVySFRNTCA9IDA7XG5cbiAgICB0aGlzLmZpZWxkID0gbmV3RmllbGQ7XG59O1xuXG5HYW1lLnByb3RvdHlwZS5fYmFja1RvTWVudSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3RhdGUuYmFja0Zyb21MZXZlbCgpO1xufTtcblxuR2FtZS5wcm90b3R5cGUudXBkYXRlQ2hhaW5TdW0gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuZmllbGQuc2VsZWN0ZWRNb2RlKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5jaGFpblN1bUVsZW1lbnQsICdfc2hvd2VkJyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgZmllbGQgPSB0aGlzLmZpZWxkO1xuXG4gICAgdmFyIGJsb2NrVmFsdWUgPSBmaWVsZC5ibG9ja3NbZmllbGQuc2VsZWN0ZWRCbG9ja3NbMF1dLnZhbHVlIHx8IDA7XG4gICAgdGhpcy5jaGFpblN1bUVsZW1lbnQuaW5uZXJIVE1MID0gYmxvY2tWYWx1ZSAqIGZpZWxkLnNlbGVjdGVkQmxvY2tzLmxlbmd0aDtcbiAgICB1dGlsLmFkZENsYXNzKHRoaXMuY2hhaW5TdW1FbGVtZW50LCAnX3Nob3dlZCcpO1xufTtcblxuR2FtZS5wcm90b3R5cGUudXBkYXRlU2NvcmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZmllbGQgPSB0aGlzLmZpZWxkO1xuXG4gICAgdmFyIGJsb2NrVmFsdWUgPSBmaWVsZC5ibG9ja3NbZmllbGQuc2VsZWN0ZWRCbG9ja3NbMF1dLnZhbHVlIHx8IDA7XG4gICAgdmFyIGsgPSAxICsgMC4yICogKGZpZWxkLnNlbGVjdGVkQmxvY2tzLmxlbmd0aCAtIDMpO1xuICAgIHRoaXMuc2NvcmUgKz0gTWF0aC5yb3VuZChibG9ja1ZhbHVlICogZmllbGQuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoICogayk7XG4gICAgdGhpcy5zY29yZUVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5zY29yZTtcblxuICAgIHRoaXMuc3RvcmUubWF4U2NvcmUgPSB0aGlzLnNjb3JlO1xuXG4gICAgdGhpcy5fY2hlY2tHb2FsKCk7XG59O1xuXG5HYW1lLnByb3RvdHlwZS5fY2hlY2tHb2FsID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuc3RvcmUuY3VycmVudEdvYWwgPT0gMykgeyByZXR1cm47IH1cblxuICAgIHZhciBzdG9yZSA9IHRoaXMuc3RvcmU7XG5cbiAgICBpZiAodGhpcy5zY29yZSA+PSBzdG9yZS53aW5Db25kaXRpb25zW3N0b3JlLmN1cnJlbnRHb2FsXSkge1xuICAgICAgICBzdG9yZS5jdXJyZW50R29hbCA9IE1hdGgubWluKHN0b3JlLmN1cnJlbnRHb2FsICsgMSwgMyk7XG5cbiAgICAgICAgaWYgKHN0b3JlLmN1cnJlbnRHb2FsID09IDEpIHsgdGhpcy5fd2luKCk7IH1cblxuICAgICAgICB0aGlzLmdvYWxFbGVtZW50LmlubmVySFRNTCA9IHRoaXMuX2dldEdvYWxUZXh0KCk7XG4gICAgfVxufTtcblxuR2FtZS5wcm90b3R5cGUuX3dpbiA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5lbGVtZW50LCAnX3dpbicpO1xuICAgIGxldmVsU3RvcmUuY2hlY2tPcGVuTGV2ZWxzKCk7XG59O1xuXG5HYW1lLnByb3RvdHlwZS5nZXRTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpZWxkOiB0aGlzLmZpZWxkLmdldFN0YXRlKCksXG4gICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgc2NvcmU6IHRoaXMuc2NvcmVcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWU7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBmaWVsZDoge1xuICAgICAgICB3aWR0aDogNTAwLFxuICAgICAgICBoZWlnaHQ6IDUwMFxuICAgIH0sXG4gICAgcGF0aDoge1xuICAgICAgICBjb2xvcjogJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMC4yNSknLFxuICAgICAgICB3aWR0aDogMTBcbiAgICB9LFxuICAgIGxldmVsczogWzEsIDIsIDMsIDQsIDUsIDYsIDcsIDhdLFxuICAgIG1pbk9wZW5MZXZlbHM6IDVcbn07XG4iLCJ2YXIgZ2FtZUNvbmZpZyA9IHJlcXVpcmUoJy4uL2dhbWVDb25maWcuanMnKTtcbnZhciBsZXZlbFN0b3JlID0gcmVxdWlyZSgnLi4vbGV2ZWxTdG9yZS5qcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsLmpzJyk7XG5cbmZ1bmN0aW9uIExldmVsKGxldmVsTWVudSwgbmFtZSwgb3JkZXIpIHtcbiAgICB0aGlzLmxldmVsTWVudSA9IGxldmVsTWVudTtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuXG4gICAgdGhpcy5zdG9yZSA9IGxldmVsU3RvcmUuZ2V0KHRoaXMubmFtZSk7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gJ2xldmVsTWVudV9fbGV2ZWxCbG9jayAnICtcbiAgICAgICAgJ19sZXZlbF8nICsgb3JkZXIgJSAyO1xuXG4gICAgdmFyIHRlbXBsYXRlID1cbiAgICAgICAgJzxkaXYgY2xhc3M9XCJsZXZlbE1lbnVfX2xldmVsQmxvY2tHb2FsU3RhdGVcIj48L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJsZXZlbE1lbnVfX2xldmVsQmxvY2tUZXh0XCI+e3tuYW1lfX08L2Rpdj4nO1xuXG4gICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9IHRlbXBsYXRlLnJlcGxhY2UoJ3t7bmFtZX19JywgbmFtZSk7XG4gICAgdGhpcy5nb2FsID0gbnVsbDtcblxuICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG5cbiAgICB1dGlsLm9uKHRoaXMuZWxlbWVudCwgJ2NsaWNrJywgdGhpcy5fb25DbGljay5iaW5kKHRoaXMpKTtcbn1cblxuTGV2ZWwucHJvdG90eXBlLl9vbkNsaWNrID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5sZXZlbE1lbnUucnVuTGV2ZWwodGhpcy5uYW1lKTtcbn07XG5cbkxldmVsLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbmV3R29hbCA9IHRoaXMuc3RvcmUuY3VycmVudEdvYWw7XG5cbiAgICBpZiAodGhpcy5nb2FsICE9PSBuZXdHb2FsKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5lbGVtZW50LCAnX2dvYWxfJyArIHRoaXMuZ29hbCk7XG4gICAgICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5lbGVtZW50LCAnX2dvYWxfJyArIG5ld0dvYWwpO1xuICAgICAgICB0aGlzLmdvYWwgPSBuZXdHb2FsO1xuICAgIH1cblxuICAgIHZhciBuZXdJc09wZW4gPSB0aGlzLnN0b3JlLmlzT3BlbjtcblxuICAgIGlmICh0aGlzLmlzT3BlbiAhPT0gbmV3SXNPcGVuKSB7XG4gICAgICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5lbGVtZW50LCAnX29wZW4nKTtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBMZXZlbE1lbnUoc3RhdGUpIHtcbiAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG4gICAgdGhpcy5sZXZlbHMgPSB7fTtcblxuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbiAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XG59XG5cbkxldmVsTWVudS5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2xldmVsTWVudSc7XG5cbiAgICB2YXIgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgaGVhZGVyLmNsYXNzTmFtZSA9ICdsZXZlbE1lbnVfX2hlYWRlcic7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChoZWFkZXIpO1xuXG4gICAgdmFyIGxldmVscyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGxldmVscy5jbGFzc05hbWUgPSAnbGV2ZWxNZW51X19oZWFkZXJMZXZlbHMnO1xuICAgIGxldmVscy5pbm5lckhUTUwgPSAnTGV2ZWxzOic7XG4gICAgaGVhZGVyLmFwcGVuZENoaWxkKGxldmVscyk7XG5cbiAgICB2YXIgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGJvZHkuY2xhc3NOYW1lID0gJ2xldmVsTWVudV9fYm9keSc7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChib2R5KTtcblxuICAgIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgIGdhbWVDb25maWcubGV2ZWxzLmZvckVhY2goZnVuY3Rpb24obmFtZSwgaSkge1xuICAgICAgICB2YXIgbGV2ZWwgPSBuZXcgTGV2ZWwodGhpcywgbmFtZSwgaSk7XG5cbiAgICAgICAgdGhpcy5sZXZlbHNbbmFtZV0gPSBsZXZlbDtcblxuICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChsZXZlbC5lbGVtZW50KTtcbiAgICB9LCB0aGlzKTtcblxuICAgIGJvZHkuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xuXG4gICAgdmFyIGZvb3RlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGZvb3Rlci5jbGFzc05hbWUgPSAnbGV2ZWxNZW51X19mb290ZXInO1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoZm9vdGVyKTtcblxuICAgIHZhciBiYWNrQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgYmFja0J1dHRvbi5jbGFzc05hbWUgPSAnbGV2ZWxNZW51X19iYWNrQnV0dG9uJztcbiAgICBiYWNrQnV0dG9uLmlubmVySFRNTCA9ICdCYWNrJztcbiAgICBmb290ZXIuYXBwZW5kQ2hpbGQoYmFja0J1dHRvbik7XG5cbiAgICB0aGlzLmJhY2tCdXR0b24gPSBiYWNrQnV0dG9uO1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG59O1xuXG5MZXZlbE1lbnUucHJvdG90eXBlLl9iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5vbih0aGlzLmJhY2tCdXR0b24sICdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnN0YXRlLnJ1bk1haW5NZW51KCk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbn07XG5cbkxldmVsTWVudS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5mb3JFYWNoKHRoaXMubGV2ZWxzLCBmdW5jdGlvbihsZXZlbCkge1xuICAgICAgICBsZXZlbC51cGRhdGUoKTtcbiAgICB9LCB0aGlzKTtcbn07XG5cbkxldmVsTWVudS5wcm90b3R5cGUucnVuTGV2ZWwgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgaWYgKGxldmVsU3RvcmUuZ2V0KG5hbWUpLmlzT3Blbikge1xuICAgICAgICB0aGlzLnN0YXRlLnJ1bkxldmVsKG5hbWUpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTGV2ZWxNZW51O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgMTogcmVxdWlyZSgnLi9sZXZlbHMvMScpLFxuICAgIDI6IHJlcXVpcmUoJy4vbGV2ZWxzLzInKSxcbiAgICAzOiByZXF1aXJlKCcuL2xldmVscy8yJyksXG4gICAgNDogcmVxdWlyZSgnLi9sZXZlbHMvMicpLFxuICAgIDU6IHJlcXVpcmUoJy4vbGV2ZWxzLzInKSxcbiAgICA2OiByZXF1aXJlKCcuL2xldmVscy8yJyksXG4gICAgNzogcmVxdWlyZSgnLi9sZXZlbHMvMicpLFxuICAgIDg6IHJlcXVpcmUoJy4vbGV2ZWxzLzInKVxufTtcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG52YXIgc2F2ZXMgPSByZXF1aXJlKCcuL3NhdmVzLmpzJyk7XG52YXIgZ2FtZUNvbmZpZyA9IHJlcXVpcmUoJy4vZ2FtZUNvbmZpZy5qcycpO1xuXG52YXIgbGV2ZWxDb25maWcgPSBjb25maWcubGV2ZWxzO1xuXG52YXIgc2F2ZWRMZXZlbHMgPSBzYXZlcy5nZXRMZXZlbHMoKTtcblxudmFyIGxldmVsU3RvcmUgPSB7fTtcblxudmFyIGxldmVscyA9IHt9O1xuXG5mdW5jdGlvbiBpbml0TGV2ZWxzKCkge1xuICAgIGdhbWVDb25maWcubGV2ZWxzLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICB2YXIgbGV2ZWwgPSBsZXZlbENvbmZpZ1tuYW1lXTtcbiAgICAgICAgbGV2ZWwubmFtZSA9IG5hbWU7XG5cbiAgICAgICAgaWYgKHNhdmVkTGV2ZWxzW25hbWVdKSB7XG4gICAgICAgICAgICBsZXZlbC5jdXJyZW50R29hbCA9IE51bWJlcihzYXZlZExldmVsc1tuYW1lXS5jdXJyZW50R29hbCkgfHwgMDtcbiAgICAgICAgICAgIGxldmVsLm1heFNjb3JlID0gTnVtYmVyKHNhdmVkTGV2ZWxzW25hbWVdLm1heFNjb3JlKSB8fCAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV2ZWwuY3VycmVudEdvYWwgPSAwO1xuICAgICAgICAgICAgbGV2ZWwubWF4U2NvcmUgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV2ZWxzW25hbWVdID0gbGV2ZWw7XG4gICAgfSk7XG5cbiAgICB1dGlsLm9uKHdpbmRvdywgJ2JlZm9yZXVubG9hZCcsIG9uQ2xvc2VIYW5kbGVyKTtcbn1cblxuZnVuY3Rpb24gb25DbG9zZUhhbmRsZXIoKSB7XG4gICAgdmFyIGRhdGFUb1NhdmUgPSB7fTtcblxuICAgIHV0aWwuZm9yRWFjaChsZXZlbHMsIGZ1bmN0aW9uKGxldmVsLCBuYW1lKSB7XG4gICAgICAgIGRhdGFUb1NhdmVbbmFtZV0gPSB7XG4gICAgICAgICAgICBtYXhTY29yZTogbGV2ZWwubWF4U2NvcmUsXG4gICAgICAgICAgICBjdXJyZW50R29hbDogbGV2ZWwuY3VycmVudEdvYWxcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgc2F2ZXMuc2V0TGV2ZWxzKGRhdGFUb1NhdmUpO1xufVxuXG5sZXZlbFN0b3JlLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gbGV2ZWxzW25hbWVdO1xufTtcblxubGV2ZWxTdG9yZS5jaGVja09wZW5MZXZlbHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3BlbkxldmVsc0xlbmd0aCA9IDA7XG5cbiAgICBnYW1lQ29uZmlnLmxldmVscy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUsIGkpIHtcbiAgICAgICAgdmFyIGxldmVsID0gbGV2ZWxzW25hbWVdO1xuXG4gICAgICAgIGlmIChsZXZlbC5jdXJyZW50R29hbCA+IDApIHtcbiAgICAgICAgICAgIG9wZW5MZXZlbHNMZW5ndGgrKztcbiAgICAgICAgfVxuXG4gICAgICAgIGxldmVsLmlzT3BlbiA9IGkgPCBvcGVuTGV2ZWxzTGVuZ3RoICsgZ2FtZUNvbmZpZy5taW5PcGVuTGV2ZWxzO1xuICAgIH0pO1xufTtcblxuaW5pdExldmVscygpO1xubGV2ZWxTdG9yZS5jaGVja09wZW5MZXZlbHMoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBsZXZlbFN0b3JlO1xuIiwidmFyIEdhbWUgPSByZXF1aXJlKCcuLi9nYW1lL2dhbWUuanMnKTtcblxuZnVuY3Rpb24gTGV2ZWwobmFtZSwgc3RhdGUsIHJlc3RvcmVEYXRhKSB7XG4gICAgR2FtZS5jYWxsKHRoaXMsIG5hbWUsIHN0YXRlLCByZXN0b3JlRGF0YSk7XG59XG5cbkxldmVsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoR2FtZS5wcm90b3R5cGUpO1xuTGV2ZWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTGV2ZWw7XG5cbm1vZHVsZS5leHBvcnRzID0gTGV2ZWw7XG4iLCJ2YXIgR2FtZSA9IHJlcXVpcmUoJy4uL2dhbWUvZ2FtZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWU7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcblxuZnVuY3Rpb24gTWVudShzdGF0ZSkge1xuICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB0aGlzLl9pc1Jlc3VtZUFjdGl2ZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5fY3JlYXRlRWxlbWVudCgpO1xuICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcbn1cblxuTWVudS5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ21haW5NZW51JztcbiAgICBlbGVtZW50LmlubmVySFRNTCA9XG4gICAgICAgICc8ZGl2IGNsYXNzPVwibWFpbk1lbnVfX2hlYWRlclwiPicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJtYWluTWVudV9fdGl0bGVcIj5DaGFpbnVtYmVyPC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJtYWluTWVudV9fYm9keVwiPicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJtYWluTWVudV9fbmV3R2FtZVwiPk5ldyBnYW1lPC9kaXY+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cIm1haW5NZW51X19yZXN1bWVHYW1lXCI+UmVzdW1lIGdhbWU8L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cIm1haW5NZW51X19mb290ZXJcIj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwibWFpbk1lbnVfX3ZlcnNpb25cIj52MC4wLjE8L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2Pic7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMubmV3R2FtZUJ1dHRvbiA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbWFpbk1lbnVfX25ld0dhbWUnKVswXTtcbiAgICB0aGlzLnJlc3VtZUdhbWVCdXR0b24gPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ21haW5NZW51X19yZXN1bWVHYW1lJylbMF07XG59O1xuXG5NZW51LnByb3RvdHlwZS5fYmluZEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwub24odGhpcy5uZXdHYW1lQnV0dG9uLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zdGF0ZS5ydW5MZXZlbE1lbnUoKTtcbiAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgdXRpbC5vbih0aGlzLnJlc3VtZUdhbWVCdXR0b24sICdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnN0YXRlLnJlc3VtZUxldmVsKCk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbn07XG5cbk1lbnUucHJvdG90eXBlLnJlc3VtZUxldmVsQWN0aXZlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX2lzUmVzdW1lQWN0aXZlKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5faXNSZXN1bWVBY3RpdmUgPSB0cnVlO1xuICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5lbGVtZW50LCAnX2FjdGl2ZUxldmVsJyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbnU7XG4iLCJ2YXIgc2F2ZXMgPSB7fTtcblxuZnVuY3Rpb24gZ2V0RnJvbUxvY2FsU3RvcmFnZShuYW1lKSB7XG4gICAgdmFyIGxldmVsc0pTT04gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShuYW1lKTtcbiAgICB2YXIgbGV2ZWxzO1xuXG4gICAgaWYgKGxldmVsc0pTT04pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldmVscyA9IEpTT04ucGFyc2UobGV2ZWxzSlNPTik7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGxldmVscyA9IHt9O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbGV2ZWxzID0ge307XG4gICAgfVxuXG4gICAgcmV0dXJuIGxldmVscztcbn1cblxuZnVuY3Rpb24gc2V0VG9Mb2NhbFN0b3JhZ2UobmFtZSwgZGF0YSkge1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKG5hbWUsIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbn1cblxuc2F2ZXMuZ2V0TGV2ZWxzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGdldEZyb21Mb2NhbFN0b3JhZ2UoJ2xldmVscycpO1xufTtcblxuc2F2ZXMuc2V0TGV2ZWxzID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHNldFRvTG9jYWxTdG9yYWdlKCdsZXZlbHMnLCBkYXRhKTtcbn07XG5cbnNhdmVzLnNldEFjdGl2ZUxldmVsID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHNldFRvTG9jYWxTdG9yYWdlKCdhY3RpdmVMZXZlbCcsIGRhdGEpO1xufTtcblxuc2F2ZXMuZ2V0QWN0aXZlTGV2ZWwgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZ2V0RnJvbUxvY2FsU3RvcmFnZSgnYWN0aXZlTGV2ZWwnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2F2ZXM7XG4iLCJ2YXIgTGV2ZWxNZW51ID0gcmVxdWlyZSgnLi9sZXZlbE1lbnUvbGV2ZWxNZW51Jyk7XG52YXIgTWFpbk1lbnUgPSByZXF1aXJlKCcuL21haW5NZW51L21haW5NZW51Jyk7XG52YXIgc2F2ZXMgPSByZXF1aXJlKCcuL3NhdmVzJyk7XG5cbnZhciBsZXZlbE1vZHVsZXMgPSByZXF1aXJlKCcuL2xldmVsTW9kdWxlcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuZnVuY3Rpb24gU3RhdGUoKSB7XG4gICAgdGhpcy5fYWN0aXZlRWxlbWVudCA9IG51bGw7XG4gICAgdGhpcy5fYWN0aXZlTGV2ZWwgPSBudWxsO1xuXG4gICAgdGhpcy5sZXZlbE1lbnUgPSBuZXcgTGV2ZWxNZW51KHRoaXMpO1xuICAgIHRoaXMubWFpbk1lbnUgPSBuZXcgTWFpbk1lbnUodGhpcyk7XG5cbiAgICB0aGlzLl9jcmVhdGVFbGVtZW50KCk7XG4gICAgdGhpcy5fYmluZEV2ZW50cygpO1xuICAgIHRoaXMuX2NoZWNrQWN0aXZlTGV2ZWwoKTtcbn1cblxuU3RhdGUucHJvdG90eXBlLl9jaGVja0FjdGl2ZUxldmVsID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFjdGl2ZVNhdmVkTGV2ZWwgPSBzYXZlcy5nZXRBY3RpdmVMZXZlbCgpO1xuXG4gICAgaWYgKE9iamVjdC5rZXlzKGFjdGl2ZVNhdmVkTGV2ZWwpLmxlbmd0aCkge1xuICAgICAgICB0aGlzLl9hY3RpdmVMZXZlbCA9IG5ldyBsZXZlbE1vZHVsZXNbYWN0aXZlU2F2ZWRMZXZlbC5uYW1lXShhY3RpdmVTYXZlZExldmVsLm5hbWUsIHRoaXMsIGFjdGl2ZVNhdmVkTGV2ZWwpO1xuICAgICAgICB0aGlzLmFjdGl2ZUxldmVsRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9hY3RpdmVMZXZlbC5lbGVtZW50KTtcbiAgICAgICAgdGhpcy5tYWluTWVudS5yZXN1bWVMZXZlbEFjdGl2ZSgpO1xuICAgIH1cbn07XG5cblN0YXRlLnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSAnc3RhdGUnO1xuICAgIHRoaXMuZWxlbWVudC5pbm5lckhUTUwgPVxuICAgICAgICAnPGRpdiBjbGFzcz1cInN0YXRlX19tYWluTWVudVwiPjwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInN0YXRlX19sZXZlbE1lbnVcIj48L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJzdGF0ZV9fYWN0aXZlTGV2ZWxcIj48L2Rpdj4nO1xuXG4gICAgdGhpcy5tYWluTWVudUVsZW1lbnQgPSB0aGlzLmVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnc3RhdGVfX21haW5NZW51JylbMF07XG4gICAgdGhpcy5tYWluTWVudUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5tYWluTWVudS5lbGVtZW50KTtcblxuICAgIHRoaXMubGV2ZWxNZW51RWxlbWVudCA9IHRoaXMuZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzdGF0ZV9fbGV2ZWxNZW51JylbMF07XG4gICAgdGhpcy5sZXZlbE1lbnVFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMubGV2ZWxNZW51LmVsZW1lbnQpO1xuXG4gICAgdGhpcy5hY3RpdmVMZXZlbEVsZW1lbnQgPSB0aGlzLmVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnc3RhdGVfX2FjdGl2ZUxldmVsJylbMF07XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUuX2JpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICB1dGlsLm9uKHdpbmRvdywgJ2JlZm9yZXVubG9hZCcsIHRoaXMuX29uQ2xvc2VIYW5kbGVyLmJpbmQodGhpcykpO1xuXG4gICAgd2luZG93LmdvID0gdGhpcy5fb25DbG9zZUhhbmRsZXIuYmluZCh0aGlzKTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5fb25DbG9zZUhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fYWN0aXZlTGV2ZWwpIHtcbiAgICAgICAgc2F2ZXMuc2V0QWN0aXZlTGV2ZWwodGhpcy5fYWN0aXZlTGV2ZWwuZ2V0U3RhdGUoKSk7XG4gICAgfVxufTtcblxuU3RhdGUucHJvdG90eXBlLl9hY3RpdmF0ZSA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBpZiAodGhpcy5fYWN0aXZlRWxlbWVudCA9PT0gZWxlbWVudCkgeyByZXR1cm47IH1cblxuICAgIGlmICh0aGlzLl9hY3RpdmVFbGVtZW50KSB7XG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5fYWN0aXZlRWxlbWVudCwgJ19zaG93ZWQnKTtcbiAgICB9XG5cbiAgICB1dGlsLmFkZENsYXNzKGVsZW1lbnQsICdfc2hvd2VkJyk7XG4gICAgdGhpcy5fYWN0aXZlRWxlbWVudCA9IGVsZW1lbnQ7XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUucnVuTGV2ZWxNZW51ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5sZXZlbE1lbnUudXBkYXRlKCk7XG4gICAgdGhpcy5fYWN0aXZhdGUodGhpcy5sZXZlbE1lbnVFbGVtZW50KTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5ydW5NYWluTWVudSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX2FjdGl2YXRlKHRoaXMubWFpbk1lbnVFbGVtZW50KTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5ydW5MZXZlbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAodGhpcy5fYWN0aXZlTGV2ZWwgJiYgdGhpcy5fYWN0aXZlTGV2ZWwubmFtZSA9PSBuYW1lKSB7IHJldHVybiB0aGlzLnJlc3VtZUxldmVsKCk7IH1cblxuICAgIHRoaXMubWFpbk1lbnUucmVzdW1lTGV2ZWxBY3RpdmUoKTtcblxuICAgIHZhciBuZXdMZXZlbCA9IG5ldyBsZXZlbE1vZHVsZXNbbmFtZV0obmFtZSwgdGhpcyk7XG5cbiAgICBpZiAodGhpcy5fYWN0aXZlTGV2ZWwpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVMZXZlbEVsZW1lbnQucmVwbGFjZUNoaWxkKG5ld0xldmVsLmVsZW1lbnQsIHRoaXMuX2FjdGl2ZUxldmVsLmVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYWN0aXZlTGV2ZWxFbGVtZW50LmFwcGVuZENoaWxkKG5ld0xldmVsLmVsZW1lbnQpO1xuICAgIH1cblxuICAgIHRoaXMuX2FjdGl2ZUxldmVsID0gbmV3TGV2ZWw7XG5cbiAgICB0aGlzLl9hY3RpdmF0ZSh0aGlzLmFjdGl2ZUxldmVsRWxlbWVudCk7XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUuYmFja0Zyb21MZXZlbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucnVuTWFpbk1lbnUoKTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5yZXN1bWVMZXZlbCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9hY3RpdmVMZXZlbCkge1xuICAgICAgICB0aGlzLl9hY3RpdmF0ZSh0aGlzLmFjdGl2ZUxldmVsRWxlbWVudCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZTsiLCJ2YXIgdXRpbCA9IHt9O1xuXG51dGlsLmFkZENsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgIHZhciBpbmRleCA9IGNsYXNzTmFtZXMuaW5kZXhPZihuYW1lKTtcblxuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgY2xhc3NOYW1lcy5wdXNoKG5hbWUpO1xuICAgICAgICBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWVzLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWw7XG59O1xuXG51dGlsLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgIHZhciBpbmRleCA9IGNsYXNzTmFtZXMuaW5kZXhPZihuYW1lKTtcblxuICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgY2xhc3NOYW1lcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWVzLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWw7XG59O1xuXG51dGlsLmhhc0NsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuXG4gICAgcmV0dXJuIGNsYXNzTmFtZXMuaW5kZXhPZihuYW1lKSAhPSAtMTtcbn07XG5cbnV0aWwuZm9yRWFjaCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqLmxlbmd0aCkge1xuICAgICAgICBvYmouZm9yRWFjaChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5XSwga2V5KTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxudXRpbC5vbiA9IGZ1bmN0aW9uKG5vZGUsIHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGNhbGxiYWNrKTtcbn07XG5cbnV0aWwub2ZmID0gZnVuY3Rpb24obm9kZSwgdHlwZSwgY2FsbGJhY2spIHtcbiAgICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgY2FsbGJhY2spO1xufTtcblxuXG4vLyBTZWVtIGxlZ2l0XG52YXIgaXNNb2JpbGUgPSAoJ0RldmljZU9yaWVudGF0aW9uRXZlbnQnIGluIHdpbmRvdyB8fCAnb3JpZW50YXRpb24nIGluIHdpbmRvdyk7XG4vLyBCdXQgd2l0aCBteSBDaHJvbWUgb24gd2luZG93cywgRGV2aWNlT3JpZW50YXRpb25FdmVudCA9PSBmY3QoKVxuaWYgKC9XaW5kb3dzIE5UfE1hY2ludG9zaHxNYWMgT1MgWHxMaW51eC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIGlzTW9iaWxlID0gZmFsc2U7XG4vLyBNeSBhbmRyb2lkIGhhdmUgXCJsaW51eFwiIHRvb1xuaWYgKC9Nb2JpbGUvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSBpc01vYmlsZSA9IHRydWU7XG5cbnV0aWwuaXNNb2JpbGUgPSBpc01vYmlsZTtcblxudXRpbC5yZ2JTdW0gPSBmdW5jdGlvbihhcnIpIHtcbiAgICAvL1t7cmdiLCByYXRpb30sIC4uLl1cblxuICAgIHZhciBzdW0gPSBbMCwgMCwgMF07XG4gICAgdmFyIG4gPSAwO1xuICAgIHZhciBlbCwgaSwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZWwgPSBhcnJbaV07XG5cbiAgICAgICAgZm9yIChqID0gMDsgaiA8IDM7IGorKykge1xuICAgICAgICAgICAgc3VtW2pdICs9IGVsLnJnYltqXSAqIGVsLnJhdGlvO1xuICAgICAgICB9XG5cbiAgICAgICAgbiArPSBlbC5yYXRpbztcbiAgICB9XG5cbiAgICBmb3IgKGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICAgIHN1bVtqXSA9IE1hdGguZmxvb3Ioc3VtW2pdIC8gbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1bTtcbn07XG5cbnV0aWwubnVsbEZuID0gZnVuY3Rpb24oKSB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsO1xuIl19