(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var LevelMenu = require('./levelMenu/levelMenu.js');
var util = require('./util.js');

if (!util.isMobile) {
    util.addClass(document.body, 'no-touch');
}

var html = document.getElementById('game');

var levelMenu = new LevelMenu();

html.appendChild(levelMenu.element);

},{"./levelMenu/levelMenu.js":7,"./util.js":11}],2:[function(require,module,exports){
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
    element.setAttribute('data-id', this.id);

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

},{"../util.js":11,"./colors.js":3}],3:[function(require,module,exports){
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

},{"../gameConfig":6,"../util":11,"./block.js":2}],5:[function(require,module,exports){
var Field = require('./field.js');
var util = require('../util');

function Game(name, levelMenu) {
    this.name = name;
    this.levelMenu = levelMenu;
    this.config = config.levels[name];
    this.score = 0;

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

    var gameBody = document.createElement('div');
    gameBody.className = 'game__body';
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

    this.backButton = backButton;
    this.restartButton = restartButton;

    this.scoreElement = score;
    this.chainSumElement = chainSum;

    this.bodyElement = gameBody;
    this.element = element;
};

Game.prototype._bindEvents = function() {
    util.on(this.restartButton, 'click', this.restart.bind(this));
    util.on(this.backButton, 'click', this._backToMenu.bind(this));
};

Game.prototype.restart = function() {
    var newField = new Field(this);

    this.bodyElement.replaceChild(newField.element, this.field.element);

    this.score = 0;
    this.scoreElement.innerHTML = 0;

    this.field = newField;
};

Game.prototype._backToMenu = function() {
    this.levelMenu.show();
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
    if (this.score > this.config.winCondition.score) {
        this.win();
    }
};

Game.prototype.win = function() {
    this.levelMenu.levelWin(this.name);
};

module.exports = Game;

},{"../util":11,"./field.js":4}],6:[function(require,module,exports){
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

},{"../gameConfig.js":6,"../util.js":11,"./levelModules.js":8}],8:[function(require,module,exports){
module.exports = {
    1: require('../levels/1'),
    2: require('../levels/2')
};

},{"../levels/1":9,"../levels/2":10}],9:[function(require,module,exports){
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


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvaW5kZXguanMiLCJzcmMvanMvZ2FtZS9ibG9jay5qcyIsInNyYy9qcy9nYW1lL2NvbG9ycy5qcyIsInNyYy9qcy9nYW1lL2ZpZWxkLmpzIiwic3JjL2pzL2dhbWUvZ2FtZS5qcyIsInNyYy9qcy9nYW1lQ29uZmlnLmpzIiwic3JjL2pzL2xldmVsTWVudS9sZXZlbE1lbnUuanMiLCJzcmMvanMvbGV2ZWxNZW51L2xldmVsTW9kdWxlcy5qcyIsInNyYy9qcy9sZXZlbHMvMS5qcyIsInNyYy9qcy9sZXZlbHMvMi5qcyIsInNyYy9qcy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBMZXZlbE1lbnUgPSByZXF1aXJlKCcuL2xldmVsTWVudS9sZXZlbE1lbnUuanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbmlmICghdXRpbC5pc01vYmlsZSkge1xuICAgIHV0aWwuYWRkQ2xhc3MoZG9jdW1lbnQuYm9keSwgJ25vLXRvdWNoJyk7XG59XG5cbnZhciBodG1sID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dhbWUnKTtcblxudmFyIGxldmVsTWVudSA9IG5ldyBMZXZlbE1lbnUoKTtcblxuaHRtbC5hcHBlbmRDaGlsZChsZXZlbE1lbnUuZWxlbWVudCk7XG4iLCJ2YXIgY29sb3JzID0gcmVxdWlyZSgnLi9jb2xvcnMuanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xuXG52YXIgcHJpbWVOdW1iZXJzID0gWzEsIDIsIDMsIDUsIDcsIDExLCAxM107XG5cbnZhciBpZENvdW50ZXIgPSAwO1xuXG5mdW5jdGlvbiBCbG9jayh4LCB5LCBmaWVsZCkge1xuICAgIHRoaXMuaWQgPSArK2lkQ291bnRlcjtcblxuICAgIHRoaXMuZmllbGQgPSBmaWVsZDtcbiAgICB0aGlzLmNvbmZpZyA9IGZpZWxkLmNvbmZpZztcblxuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcblxuICAgIHRoaXMudmFsdWUgPSBudWxsO1xuICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG5cbiAgICB0aGlzLndpZHRoID0gNTAwIC8gdGhpcy5jb25maWcuZmllbGQuc2l6ZVswXTtcbiAgICB0aGlzLmhlaWdodCA9IDUwMCAvIHRoaXMuY29uZmlnLmZpZWxkLnNpemVbMV07XG5cbiAgICB0aGlzLl9zZXRSYW5kb21WYWx1ZSgpO1xuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbiAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XG59XG5cbkJsb2NrLnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFRPRE86INCy0LrQu9GO0YfQuNGC0Ywg0L/RgNC+0YHRgtC+0Lkg0YjQsNCx0LvQvtC90LjQt9Cw0YLQvtGAXG5cbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2Jsb2NrJztcbiAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1pZCcsIHRoaXMuaWQpO1xuXG4gICAgZWxlbWVudC5zdHlsZS5sZWZ0ID0gTWF0aC5mbG9vcih0aGlzLnggKiB0aGlzLndpZHRoKSArICdweCc7XG4gICAgZWxlbWVudC5zdHlsZS5ib3R0b20gPSBNYXRoLmZsb29yKHRoaXMueSAqIHRoaXMuaGVpZ2h0KSArICdweCc7XG5cbiAgICB2YXIgaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBpbm5lci5jbGFzc05hbWUgPSAnYmxvY2tfX2lubmVyJztcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGlubmVyKTtcblxuICAgIHZhciBhY3RpdmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBhY3RpdmUuY2xhc3NOYW1lID0gJ2Jsb2NrX19hY3RpdmUnO1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoYWN0aXZlKTtcblxuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGV4dC5jbGFzc05hbWUgPSAnYmxvY2tfX3RleHQnO1xuICAgIHRleHQuaW5uZXJIVE1MID0gdGhpcy52YWx1ZTtcbiAgICBpbm5lci5hcHBlbmRDaGlsZCh0ZXh0KTtcblxuICAgIHRoaXMuaW5uZXJFbGVtZW50ID0gaW5uZXI7XG4gICAgdGhpcy50ZXh0RWxlbWVudCA9IHRleHQ7XG4gICAgdGhpcy5hY3RpdmVFbGVtZW50ID0gYWN0aXZlO1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cbiAgICB0aGlzLl91cGRhdGVDb2xvcnMoKTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5fc2V0UmFuZG9tVmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3VtbVJhdGlvbiA9IDA7XG4gICAgdmFyIHBvc3NpYmxlVmFsdWVzID0gdGhpcy5jb25maWcubnVtYmVycy5wb3NzaWJsZVZhbHVlcztcblxuICAgIHBvc3NpYmxlVmFsdWVzLmZvckVhY2goZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgc3VtbVJhdGlvbiArPSBlbFsxXTtcbiAgICB9KTtcblxuICAgIHZhciBzdW1tID0gMDtcblxuICAgIHZhciBjaGFuY2VBcnJheSA9IHBvc3NpYmxlVmFsdWVzLm1hcChmdW5jdGlvbihlbCkge1xuICAgICAgICB2YXIgdmFsID0gZWxbMV0gLyBzdW1tUmF0aW9uICsgc3VtbTtcblxuICAgICAgICBzdW1tICs9IHZhbDtcblxuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0pO1xuXG4gICAgdmFyIHJvbGwgPSBNYXRoLnJhbmRvbSgpO1xuXG4gICAgdmFyIHZhbHVlID0gMDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hhbmNlQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHJvbGwgPD0gY2hhbmNlQXJyYXlbaV0pIHtcbiAgICAgICAgICAgIHZhbHVlID0gcG9zc2libGVWYWx1ZXNbaV1bMF07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5fYmluZEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh1dGlsLmlzTW9iaWxlKSB7XG4gICAgICAgIHV0aWwub24odGhpcy5lbGVtZW50LCAndG91Y2hzdGFydCcsIHRoaXMuX21vdXNlRG93bkhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXRpbC5vbih0aGlzLmVsZW1lbnQsICdtb3VzZWRvd24nLCB0aGlzLl9tb3VzZURvd25IYW5kbGVyLmJpbmQodGhpcykpO1xuICAgICAgICB1dGlsLm9uKHRoaXMuYWN0aXZlRWxlbWVudCwgJ21vdXNlb3ZlcicsIHRoaXMuX21vdXNlT3ZlckhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgICAgIC8vdXRpbC5vbih0aGlzLmFjdGl2ZUVsZW1lbnQsICdtb3VzZW91dCcsIHRoaXMuX21vdXNlT3V0SGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9XG59O1xuXG5CbG9jay5wcm90b3R5cGUuX21vdXNlRG93bkhhbmRsZXIgPSBmdW5jdGlvbihldikge1xuICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB0aGlzLmZpZWxkLmJsb2NrTW91c2VEb3duKHRoaXMuaWQpO1xufTtcblxuXG5CbG9jay5wcm90b3R5cGUuX21vdXNlT3ZlckhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmZpZWxkLmJsb2NrTW91c2VPdmVyKHRoaXMuaWQpO1xufTtcblxuXG5CbG9jay5wcm90b3R5cGUuX21vdXNlT3V0SGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZmllbGQuYmxvY2tNb3VzZU91dCh0aGlzLmlkKTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5jaGFuZ2VQb3NpdGlvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG5cbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUubGVmdCA9IE1hdGguZmxvb3IoeCAqIHRoaXMud2lkdGgpICsgJ3B4JztcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUuYm90dG9tID0gTWF0aC5mbG9vcih5ICogdGhpcy5oZWlnaHQpICsgJ3B4Jztcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5fdXBkYXRlQ29sb3JzID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gNyAtPiAzIChwcmltZU51bWJlciAtPiByYXRpbylcbiAgICB2YXIgcHJpbWVBcnJheSA9IFtdO1xuICAgIHZhciBpO1xuXG4gICAgZm9yIChpID0gcHJpbWVOdW1iZXJzLmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICAgICAgaWYgKHRoaXMudmFsdWUgJSBwcmltZU51bWJlcnNbaV0gPT09IDApIHtcbiAgICAgICAgICAgIHByaW1lQXJyYXkucHVzaCh7XG4gICAgICAgICAgICAgICAgdmFsdWU6IHByaW1lTnVtYmVyc1tpXSxcbiAgICAgICAgICAgICAgICByZ2I6IGNvbG9yc1tpXS5yZ2IsXG4gICAgICAgICAgICAgICAgcmF0aW86IHRoaXMudmFsdWUgLyBwcmltZU51bWJlcnNbaV1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGNvbG9yO1xuXG4gICAgaWYgKHByaW1lQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgIGNvbG9yID0gdXRpbC5yZ2JTdW0ocHJpbWVBcnJheSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29sb3IgPSBjb2xvcnNbMF0ucmdiO1xuICAgIH1cblxuICAgIHRoaXMuaW5uZXJFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZ2IoJyArIGNvbG9yLmpvaW4oJywnKSArICcpJztcbn07XG5cbi8qQmxvY2sucHJvdG90eXBlLl91cGRhdGVDb2xvcnMgPSBmdW5jdGlvbigpIHtcblxuICAgIGZvciAodmFyIGkgPSBwcmltZU51bWJlcnMubGVuZ3RoIC0gMTsgaSA+PTA7IGktLSkge1xuICAgICAgICBpZiAodGhpcy52YWx1ZSAlIHByaW1lTnVtYmVyc1tpXSA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5pbm5lckVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3JnYignICsgY29sb3JzW2ldLnJnYi5qb2luKCcsJykgKyAnKSc7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn07Ki9cblxuQmxvY2sucHJvdG90eXBlLmNoYW5nZVZhbHVlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy50ZXh0RWxlbWVudC5pbm5lckhUTUwgPSB2YWx1ZTtcblxuICAgIHRoaXMuX3VwZGF0ZUNvbG9ycygpO1xufTtcblxuQmxvY2sucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5lbGVtZW50LCAnX3NlbGVjdGVkJyk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUudW5zZWxlY3QgPSBmdW5jdGlvbigpIHtcbiAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuZWxlbWVudCwgJ19zZWxlY3RlZCcpO1xufTtcblxuQmxvY2sucHJvdG90eXBlLmFuaW1hdGVDcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB1dGlsLmFkZENsYXNzKHRoaXMuZWxlbWVudCwgJ19ibGluaycpO1xuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhzZWxmLmVsZW1lbnQsICdfYmxpbmsnKTtcbiAgICB9LCAwKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQmxvY2s7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgICB7XG4gICAgICAgIHdlYjogJyM5OWI0MzMnLFxuICAgICAgICByZ2I6IFsxNTQsIDE4MCwgNTFdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjREE1MzJDJyxcbiAgICAgICAgcmdiOiBbMjE4LCA4MywgNDRdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjMWU3MTQ1JyxcbiAgICAgICAgcmdiOiBbMzAsIDExMywgNjldXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjMkM4OUEwJyxcbiAgICAgICAgcmdiOiBbNDQsIDEzNywgMTYwXVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnIzAwQUE4OCcsXG4gICAgICAgIHJnYjogWzAsIDE3MCwgMTM2XVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnIzAwZDQ1NScsXG4gICAgICAgIHJnYjogWzAsIDIxMiwgODVdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjZmYyYTJhJyxcbiAgICAgICAgcmdiOiBbMjU1LCA0MiwgNDJdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjQ0I1MDAwJyxcbiAgICAgICAgcmdiOiBbMjAzLCA4MCwgMF1cbiAgICB9XG5dO1xuIiwidmFyIEJsb2NrID0gcmVxdWlyZSgnLi9ibG9jay5qcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG52YXIgZ2FtZUNvbmZpZyA9IHJlcXVpcmUoJy4uL2dhbWVDb25maWcnKTtcblxuZnVuY3Rpb24gRmllbGQoZ2FtZSkge1xuICAgIHRoaXMuZ2FtZSA9IGdhbWU7XG4gICAgdGhpcy5jb25maWcgPSBnYW1lLmNvbmZpZztcblxuICAgIHRoaXMuYmxvY2tzID0ge307XG4gICAgdGhpcy5fYmxvY2tzWFkgPSB7fTtcbiAgICB0aGlzLnNpemUgPSB0aGlzLmNvbmZpZy5maWVsZC5zaXplO1xuXG4gICAgdGhpcy5zZWxlY3RlZEJsb2NrcyA9IFtdO1xuICAgIHRoaXMuc2VsZWN0ZWRNb2RlID0gZmFsc2U7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbiAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XG59XG5cbkZpZWxkLnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zaXplWzBdOyBpKyspIHtcbiAgICAgICAgdGhpcy5fYmxvY2tzWFlbaV0gPSB7fTtcblxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuc2l6ZVsxXTsgaisrKSB7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUJsb2NrKGksIGosIHRydWUpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLmNyZWF0ZUJsb2NrID0gZnVuY3Rpb24oeCwgeSwgaXNJbml0KSB7XG4gICAgdmFyIGJsb2NrID0gbmV3IEJsb2NrKHgsIHksIHRoaXMpO1xuXG4gICAgdGhpcy5ibG9ja3NbYmxvY2suaWRdID0gYmxvY2s7XG5cbiAgICB0aGlzLl9ibG9ja3NYWVt4XVt5XSA9IGJsb2NrLmlkO1xuXG4gICAgaWYgKCFpc0luaXQpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGJsb2NrLmVsZW1lbnQpO1xuICAgICAgICBibG9jay5hbmltYXRlQ3JlYXRlKCk7XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLl9jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB0aGlzLmNhbnZhcy5jbGFzc05hbWUgPSAnZmllbGRfX2NhbnZhcyc7XG5cbiAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICB0aGlzLmNhbnZhcy53aWR0aCA9IGdhbWVDb25maWcuZmllbGQud2lkdGg7XG4gICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gZ2FtZUNvbmZpZy5maWVsZC5oZWlnaHQ7XG4gICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQodGhpcy5jYW52YXMpO1xuXG4gICAgdXRpbC5mb3JFYWNoKHRoaXMuYmxvY2tzLCBmdW5jdGlvbihibCkge1xuICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChibC5lbGVtZW50KTtcbiAgICB9KTtcblxuICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSAnZmllbGQnICtcbiAgICAgICAgJyBfd2lkdGhfJyArIHRoaXMuc2l6ZVswXSArXG4gICAgICAgICcgX2hlaWdodF8nICsgdGhpcy5zaXplWzFdO1xuXG4gICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGZyYWdtZW50KTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fYmluZEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh1dGlsLmlzTW9iaWxlKSB7XG4gICAgICAgIHV0aWwub24oZG9jdW1lbnQuYm9keSwgJ3RvdWNoZW5kJywgdGhpcy5fbW91c2VVcEhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgICAgIHV0aWwub24oZG9jdW1lbnQuYm9keSwgJ3RvdWNobW92ZScsIHRoaXMuX3RvdWNoTW92ZUhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXRpbC5vbihkb2N1bWVudC5ib2R5LCAnbW91c2V1cCcsIHRoaXMuX21vdXNlVXBIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgIH1cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fdG91Y2hNb3ZlSGFuZGxlciA9IGZ1bmN0aW9uKGV2KSB7XG4gICAgdmFyIGlzQnJlYWssIGJsb2NrLCBrZXlzLHRvdWNoLCB0YXJnZXQsIGksIGo7XG4gICAgdmFyIGJsb2NrcyA9IHRoaXMuYmxvY2tzO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGV2LmNoYW5nZWRUb3VjaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRvdWNoID0gZXYuY2hhbmdlZFRvdWNoZXNbaV07XG4gICAgICAgIHRhcmdldCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQodG91Y2guY2xpZW50WCwgdG91Y2guY2xpZW50WSk7XG5cbiAgICAgICAgaWYgKCF0YXJnZXQgfHwgdGFyZ2V0LmNsYXNzTmFtZS5pbmRleE9mKCdibG9ja19fYWN0aXZlJykgPT0gLTEpIHsgY29udGludWU7IH1cblxuICAgICAgICAvLyDQtNC10LvQsNC10LwgZm9yLCDQsCDQvdC1IGZvckVhY2gsINGH0YLQvtCx0Ysg0LzQvtC20L3QviDQsdGL0LvQviDRgdGC0L7Qv9C90YPRgtGMXG4gICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyhibG9ja3MpO1xuXG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBrZXlzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBibG9jayA9IGJsb2Nrc1trZXlzW2pdXTtcblxuICAgICAgICAgICAgaWYgKGJsb2NrLmFjdGl2ZUVsZW1lbnQgPT09IHRhcmdldCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYmxvY2tNb3VzZU92ZXIoYmxvY2suaWQpO1xuICAgICAgICAgICAgICAgIGlzQnJlYWsgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzQnJlYWspIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLl9tb3VzZVVwSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5zZWxlY3RlZE1vZGUpIHsgcmV0dXJuOyB9XG5cbiAgICB0aGlzLnNlbGVjdGVkTW9kZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5fcnVuU2VsZWN0ZWQoKTtcblxuICAgIHV0aWwuZm9yRWFjaCh0aGlzLmJsb2NrcywgZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgICAgYmxvY2sudW5zZWxlY3QoKTtcbiAgICB9KTtcblxuICAgIHRoaXMuZ2FtZS51cGRhdGVDaGFpblN1bSgwKTtcblxuICAgIHRoaXMuX2NsZWFyUGF0aCgpO1xufTtcblxuRmllbGQucHJvdG90eXBlLmJsb2NrTW91c2VEb3duID0gZnVuY3Rpb24oaWQpIHtcbiAgICB0aGlzLnNlbGVjdGVkTW9kZSA9IHRydWU7XG4gICAgdGhpcy5zZWxlY3RlZEJsb2NrcyA9IFtpZF07XG5cbiAgICB0aGlzLmJsb2Nrc1tpZF0uc2VsZWN0KCk7XG5cbiAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW0odGhpcy5fY2FsY0NoYWluU3VtKCkpO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9jaGVja1dpdGhMYXN0ID0gZnVuY3Rpb24oaWQpIHtcbiAgICB2YXIgbGFzdEJsID0gdGhpcy5ibG9ja3NbdGhpcy5zZWxlY3RlZEJsb2Nrc1t0aGlzLnNlbGVjdGVkQmxvY2tzLmxlbmd0aCAtIDFdXTtcbiAgICB2YXIgbmV3QmwgPSB0aGlzLmJsb2Nrc1tpZF07XG5cbiAgICByZXR1cm4gbGFzdEJsLnZhbHVlID09IG5ld0JsLnZhbHVlICYmXG4gICAgICAgIE1hdGguYWJzKGxhc3RCbC54IC0gbmV3QmwueCkgPD0gMSAmJlxuICAgICAgICBNYXRoLmFicyhsYXN0QmwueSAtIG5ld0JsLnkpIDw9IDE7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuYmxvY2tNb3VzZU92ZXIgPSBmdW5jdGlvbihpZCkge1xuICAgIGlmICghdGhpcy5zZWxlY3RlZE1vZGUpIHsgcmV0dXJuOyB9XG5cbiAgICB2YXIgc2VsQmxvY2tzID0gdGhpcy5zZWxlY3RlZEJsb2NrcztcblxuICAgIGlmIChzZWxCbG9ja3MuaW5kZXhPZihpZCkgPT0gLTEpIHtcbiAgICAgICAgaWYgKHRoaXMuX2NoZWNrV2l0aExhc3QoaWQpKSB7XG4gICAgICAgICAgICBzZWxCbG9ja3MucHVzaChpZCk7XG4gICAgICAgICAgICB0aGlzLmJsb2Nrc1tpZF0uc2VsZWN0KCk7XG5cbiAgICAgICAgICAgIHRoaXMuZ2FtZS51cGRhdGVDaGFpblN1bSh0aGlzLl9jYWxjQ2hhaW5TdW0oKSk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVQYXRoKCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoc2VsQmxvY2tzW3NlbEJsb2Nrcy5sZW5ndGggLSAyXSA9PSBpZCkge1xuICAgICAgICAgICAgdmFyIGxhc3RCbElkID0gc2VsQmxvY2tzLnBvcCgpO1xuICAgICAgICAgICAgdGhpcy5ibG9ja3NbbGFzdEJsSWRdLnVuc2VsZWN0KCk7XG5cbiAgICAgICAgICAgIHRoaXMuZ2FtZS51cGRhdGVDaGFpblN1bSh0aGlzLl9jYWxjQ2hhaW5TdW0oKSk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVQYXRoKCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX3VwZGF0ZVBhdGggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgY3R4ID0gdGhpcy5jdHg7XG5cbiAgICB0aGlzLl9jbGVhclBhdGgoKTtcblxuICAgIGN0eC5iZWdpblBhdGgoKTtcblxuICAgIGN0eC5zdHJva2VTdHlsZSA9IGdhbWVDb25maWcucGF0aC5jb2xvcjtcbiAgICBjdHgubGluZVdpZHRoID0gZ2FtZUNvbmZpZy5wYXRoLndpZHRoO1xuXG4gICAgdGhpcy5zZWxlY3RlZEJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uKGlkLCBpKSB7XG4gICAgICAgIHZhciBibG9jayA9IHRoaXMuYmxvY2tzW2lkXTtcbiAgICAgICAgdmFyIHggPSAoYmxvY2sueCArIDAuNSkgKiBibG9jay53aWR0aDtcbiAgICAgICAgdmFyIHkgPSBnYW1lQ29uZmlnLmZpZWxkLmhlaWdodCAtIChibG9jay55ICsgMC41KSAqIGJsb2NrLmhlaWdodDtcblxuICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgY3R4Lm1vdmVUbyh4LCB5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN0eC5saW5lVG8oeCwgeSk7XG4gICAgICAgIH1cbiAgICB9LCB0aGlzKTtcblxuICAgIGN0eC5zdHJva2UoKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY2xlYXJQYXRoID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIGdhbWVDb25maWcuZmllbGQud2lkdGgsIGdhbWVDb25maWcuZmllbGQuaGVpZ2h0KTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5ibG9ja01vdXNlT3V0ID0gZnVuY3Rpb24oaWQpIHtcblxufTtcblxuRmllbGQucHJvdG90eXBlLl9jYWxjQ2hhaW5TdW0gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLmJsb2Nrc1t0aGlzLnNlbGVjdGVkQmxvY2tzWzBdXS52YWx1ZSB8fCAwO1xuXG4gICAgcmV0dXJuIHZhbHVlICogdGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGg7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2NhbGNVcGRhdGVTY29yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2YWx1ZSA9IHRoaXMuYmxvY2tzW3RoaXMuc2VsZWN0ZWRCbG9ja3NbMF1dLnZhbHVlO1xuXG4gICAgdmFyIGsgPSAxICsgMC4yICogKHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoIC0gMyk7XG5cbiAgICByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSAqIHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoICogayk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2Jsb2NrUmVtb3ZlID0gZnVuY3Rpb24oaWQpIHtcbiAgICB2YXIgYmxvY2sgPSB0aGlzLmJsb2Nrc1tpZF07XG5cbiAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQ2hpbGQoYmxvY2suZWxlbWVudCk7XG5cbiAgICB0aGlzLl9ibG9ja3NYWVtibG9jay54XVtibG9jay55XSA9IG51bGw7XG4gICAgZGVsZXRlIHRoaXMuYmxvY2tzW2lkXTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fcnVuU2VsZWN0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggPCB0aGlzLmNvbmZpZy5jaGFpbi5taW5MZW5ndGgpIHsgcmV0dXJuOyB9XG5cbiAgICB0aGlzLmdhbWUudXBkYXRlU2NvcmUodGhpcy5fY2FsY1VwZGF0ZVNjb3JlKCkpO1xuXG4gICAgdmFyIGxhc3RCbElkID0gdGhpcy5zZWxlY3RlZEJsb2Nrcy5wb3AoKTtcbiAgICB2YXIgbGFzdEJsID0gdGhpcy5ibG9ja3NbbGFzdEJsSWRdO1xuICAgIHZhciB2YWx1ZSA9IGxhc3RCbC52YWx1ZSAqICh0aGlzLnNlbGVjdGVkQmxvY2tzLmxlbmd0aCArIDEpOyAvLyArMSBiZWNhdXNlIHBvcCBhYm92ZVxuXG4gICAgbGFzdEJsLmNoYW5nZVZhbHVlKHZhbHVlKTtcblxuICAgIHRoaXMuc2VsZWN0ZWRCbG9ja3MuZm9yRWFjaCh0aGlzLl9ibG9ja1JlbW92ZSwgdGhpcyk7XG5cbiAgICB0aGlzLl9jaGVja1Bvc2l0aW9ucygpO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9jaGVja1Bvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHZhciBibG9ja3NYWSA9IHRoaXMuX2Jsb2Nrc1hZO1xuICAgIHZhciBibG9ja3MgPSB0aGlzLmJsb2NrcztcblxuICAgIHV0aWwuZm9yRWFjaChibG9ja3NYWSwgZnVuY3Rpb24oYmxvY2tzWSkge1xuICAgICAgICB2YXIgYXJyID0gW107XG5cbiAgICAgICAgLy8g0LTQvtCx0LDQstC70Y/QtdC8INCyINC80LDRgdGB0LjQsiDRgdGD0YnQtdGB0YLQstGD0Y7RidC40LUg0LLQtdGA0YLQuNC60LDQu9GM0L3Ri9C1INGN0LvQtdC80LXQvdGC0YtcbiAgICAgICAgdXRpbC5mb3JFYWNoKGJsb2Nrc1ksIGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICBpZiAoaWQpIHsgYXJyLnB1c2goaWQpOyB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vINC10YHQu9C4INC/0L7Qu9C90YvQuSDQuNC70Lgg0L/Rg9GB0YLQvtC5XG4gICAgICAgIGlmIChhcnIubGVuZ3RoID09IHNlbGYuc2l6ZVsxXSB8fCAhYXJyKSB7IHJldHVybjsgfVxuXG4gICAgICAgIC8vINGB0L7RgNGC0LjRgNGD0LXQvFxuICAgICAgICBhcnIuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYmxvY2tzW2FdLnkgPiBibG9ja3NbYl0ueTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g0YHQtNCy0LjQs9Cw0LXQvCDQvtGC0YHQvtGA0YLQuNGA0L7QstCw0L3QvdGL0Lkg0YHQv9C40YHQvtC6INC6INC90LjQt9GDXG4gICAgICAgIGFyci5mb3JFYWNoKGZ1bmN0aW9uKGlkLCB5KSB7XG4gICAgICAgICAgICB2YXIgYmxvY2sgPSBibG9ja3NbaWRdO1xuXG4gICAgICAgICAgICBpZiAoYmxvY2sueSAhPSB5KSB7XG4gICAgICAgICAgICAgICAgYmxvY2tzWVtibG9jay55XSA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICBibG9jay5jaGFuZ2VQb3NpdGlvbihibG9jay54LCB5KTtcblxuICAgICAgICAgICAgICAgIGJsb2Nrc1lbeV0gPSBpZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9hZGROZXdCbG9ja3MoKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fYWRkTmV3QmxvY2tzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGJsb2Nrc1hZID0gdGhpcy5fYmxvY2tzWFk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2l6ZVswXTsgaSsrKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5zaXplWzFdOyBqKyspIHtcbiAgICAgICAgICAgIGlmICghYmxvY2tzWFlbaV1bal0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUJsb2NrKGksIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGaWVsZDtcbiIsInZhciBGaWVsZCA9IHJlcXVpcmUoJy4vZmllbGQuanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG5mdW5jdGlvbiBHYW1lKG5hbWUsIGxldmVsTWVudSkge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5sZXZlbE1lbnUgPSBsZXZlbE1lbnU7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWcubGV2ZWxzW25hbWVdO1xuICAgIHRoaXMuc2NvcmUgPSAwO1xuXG4gICAgdGhpcy5maWVsZCA9IG5ldyBGaWVsZCh0aGlzKTtcbiAgICB0aGlzLl9jcmVhdGVFbGVtZW50KCk7XG4gICAgdGhpcy5fYmluZEV2ZW50cygpO1xufVxuXG5HYW1lLnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWxlbWVudC5jbGFzc05hbWUgPSAnZ2FtZSc7XG5cbiAgICB2YXIgZ2FtZUhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGdhbWVIZWFkZXIuY2xhc3NOYW1lID0gJ2dhbWVfX2hlYWRlcic7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChnYW1lSGVhZGVyKTtcblxuICAgIHZhciBzY29yZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHNjb3JlLmNsYXNzTmFtZSA9ICdnYW1lX19zY29yZSc7XG4gICAgc2NvcmUuaW5uZXJIVE1MID0gJzAnO1xuICAgIGdhbWVIZWFkZXIuYXBwZW5kQ2hpbGQoc2NvcmUpO1xuXG4gICAgdmFyIGNoYWluU3VtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY2hhaW5TdW0uY2xhc3NOYW1lID0gJ2dhbWVfX2NoYWluU3VtJztcbiAgICBnYW1lSGVhZGVyLmFwcGVuZENoaWxkKGNoYWluU3VtKTtcblxuICAgIHZhciBnYW1lQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGdhbWVCb2R5LmNsYXNzTmFtZSA9ICdnYW1lX19ib2R5JztcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGdhbWVCb2R5KTtcblxuICAgIGdhbWVCb2R5LmFwcGVuZENoaWxkKHRoaXMuZmllbGQuZWxlbWVudCk7XG5cbiAgICB2YXIgZ2FtZUZvb3RlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGdhbWVGb290ZXIuY2xhc3NOYW1lID0gJ2dhbWVfX2Zvb3Rlcic7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChnYW1lRm9vdGVyKTtcblxuICAgIHZhciBiYWNrQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgYmFja0J1dHRvbi5jbGFzc05hbWUgPSAnZ2FtZV9fYmFja0J1dHRvbic7XG4gICAgYmFja0J1dHRvbi5pbm5lckhUTUwgPSAnTWVudSc7XG4gICAgZ2FtZUZvb3Rlci5hcHBlbmRDaGlsZChiYWNrQnV0dG9uKTtcblxuICAgIHZhciByZXN0YXJ0QnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgcmVzdGFydEJ1dHRvbi5jbGFzc05hbWUgPSAnZ2FtZV9fcmVzdGFydEJ1dHRvbic7XG4gICAgcmVzdGFydEJ1dHRvbi5pbm5lckhUTUwgPSAnUmVzdGFydCc7XG4gICAgZ2FtZUZvb3Rlci5hcHBlbmRDaGlsZChyZXN0YXJ0QnV0dG9uKTtcblxuICAgIHRoaXMuYmFja0J1dHRvbiA9IGJhY2tCdXR0b247XG4gICAgdGhpcy5yZXN0YXJ0QnV0dG9uID0gcmVzdGFydEJ1dHRvbjtcblxuICAgIHRoaXMuc2NvcmVFbGVtZW50ID0gc2NvcmU7XG4gICAgdGhpcy5jaGFpblN1bUVsZW1lbnQgPSBjaGFpblN1bTtcblxuICAgIHRoaXMuYm9keUVsZW1lbnQgPSBnYW1lQm9keTtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xufTtcblxuR2FtZS5wcm90b3R5cGUuX2JpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICB1dGlsLm9uKHRoaXMucmVzdGFydEJ1dHRvbiwgJ2NsaWNrJywgdGhpcy5yZXN0YXJ0LmJpbmQodGhpcykpO1xuICAgIHV0aWwub24odGhpcy5iYWNrQnV0dG9uLCAnY2xpY2snLCB0aGlzLl9iYWNrVG9NZW51LmJpbmQodGhpcykpO1xufTtcblxuR2FtZS5wcm90b3R5cGUucmVzdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXdGaWVsZCA9IG5ldyBGaWVsZCh0aGlzKTtcblxuICAgIHRoaXMuYm9keUVsZW1lbnQucmVwbGFjZUNoaWxkKG5ld0ZpZWxkLmVsZW1lbnQsIHRoaXMuZmllbGQuZWxlbWVudCk7XG5cbiAgICB0aGlzLnNjb3JlID0gMDtcbiAgICB0aGlzLnNjb3JlRWxlbWVudC5pbm5lckhUTUwgPSAwO1xuXG4gICAgdGhpcy5maWVsZCA9IG5ld0ZpZWxkO1xufTtcblxuR2FtZS5wcm90b3R5cGUuX2JhY2tUb01lbnUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmxldmVsTWVudS5zaG93KCk7XG59O1xuXG5HYW1lLnByb3RvdHlwZS51cGRhdGVDaGFpblN1bSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuY2hhaW5TdW1FbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuICAgICAgICB1dGlsLmFkZENsYXNzKHRoaXMuY2hhaW5TdW1FbGVtZW50LCAnX3Nob3dlZCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5jaGFpblN1bUVsZW1lbnQsICdfc2hvd2VkJyk7XG4gICAgfVxufTtcblxuR2FtZS5wcm90b3R5cGUudXBkYXRlU2NvcmUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHRoaXMuc2NvcmUgKz0gdmFsdWU7XG4gICAgdGhpcy5zY29yZUVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5zY29yZTtcblxuICAgIHRoaXMuX2NoZWNrV2luKCk7XG59O1xuXG5HYW1lLnByb3RvdHlwZS5fY2hlY2tXaW4gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zY29yZSA+IHRoaXMuY29uZmlnLndpbkNvbmRpdGlvbi5zY29yZSkge1xuICAgICAgICB0aGlzLndpbigpO1xuICAgIH1cbn07XG5cbkdhbWUucHJvdG90eXBlLndpbiA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMubGV2ZWxNZW51LmxldmVsV2luKHRoaXMubmFtZSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWU7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBmaWVsZDoge1xuICAgICAgICB3aWR0aDogNTAwLFxuICAgICAgICBoZWlnaHQ6IDUwMFxuICAgIH0sXG4gICAgcGF0aDoge1xuICAgICAgICBjb2xvcjogJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMC4yNSknLFxuICAgICAgICB3aWR0aDogMTBcbiAgICB9LFxuICAgIGxldmVsczogWzEsIDJdXG59O1xuIiwidmFyIGdhbWVDb25maWcgPSByZXF1aXJlKCcuLi9nYW1lQ29uZmlnLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcblxudmFyIGxldmVsTW9kdWxlcyA9IHJlcXVpcmUoJy4vbGV2ZWxNb2R1bGVzLmpzJyk7XG5cbmZ1bmN0aW9uIExldmVsTWVudSgpIHtcbiAgICB0aGlzLl9sZXZlbEJsb2NrcyA9IHt9O1xuXG4gICAgdGhpcy5fYWN0aXZlTGV2ZWwgPSBudWxsO1xuXG4gICAgdGhpcy5fY3JlYXRlRWxlbWVudCgpO1xufVxuXG5MZXZlbE1lbnUucHJvdG90eXBlLl9jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBlbGVtZW50LmNsYXNzTmFtZSA9ICdsZXZlbE1lbnUnO1xuXG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGNvbnRhaW5lci5jbGFzc05hbWUgPSAnbGV2ZWxNZW51X19jb250YWluZXInO1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcblxuICAgIHZhciBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBoZWFkZXIuY2xhc3NOYW1lID0gJ2xldmVsTWVudV9faGVhZGVyJztcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcblxuICAgIHZhciBsZXZlbHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBsZXZlbHMuY2xhc3NOYW1lID0gJ2xldmVsTWVudV9faGVhZGVyTGV2ZWxzJztcbiAgICBsZXZlbHMuaW5uZXJIVE1MID0gJ0xldmVsczonO1xuICAgIGhlYWRlci5hcHBlbmRDaGlsZChsZXZlbHMpO1xuXG4gICAgdmFyIGJvZHkgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgYm9keS5jbGFzc05hbWUgPSAnbGV2ZWxNZW51X19ib2R5JztcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoYm9keSk7XG5cbiAgICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICBnYW1lQ29uZmlnLmxldmVscy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUsIGkpIHtcbiAgICAgICAgdmFyIGxldmVsQmxvY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgbGV2ZWxCbG9jay5jbGFzc05hbWUgPSAnbGV2ZWxNZW51X19sZXZlbEJsb2NrIF9sZXZlbF8nICsgaSAlIDI7XG4gICAgICAgIGxldmVsQmxvY2suaW5uZXJIVE1MID0gbmFtZTtcblxuICAgICAgICB1dGlsLm9uKGxldmVsQmxvY2ssICdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5sZXZlbEFjdGl2YXRlKG5hbWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzZWxmLl9sZXZlbEJsb2Nrc1tuYW1lXSA9IGxldmVsQmxvY2s7XG5cbiAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQobGV2ZWxCbG9jayk7XG4gICAgfSk7XG5cbiAgICBib2R5LmFwcGVuZENoaWxkKGZyYWdtZW50KTtcblxuICAgIHZhciBsZXZlbENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGxldmVsQ29udGFpbmVyLmNsYXNzTmFtZSA9ICdsZXZlbE1lbnVfX2xldmVsQ29udGFpbmVyJztcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGxldmVsQ29udGFpbmVyKTtcblxuICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgIHRoaXMubGV2ZWxDb250YWluZXIgPSBsZXZlbENvbnRhaW5lcjtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xufTtcblxuTGV2ZWxNZW51LnByb3RvdHlwZS5sZXZlbFdpbiA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBjb25zb2xlLmxvZygnbGV2ZWxXaW4nLCBuYW1lKTtcbn07XG5cbkxldmVsTWVudS5wcm90b3R5cGUubGV2ZWxBY3RpdmF0ZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbmV3TGV2ZWwgPSBuZXcgbGV2ZWxNb2R1bGVzW25hbWVdKG5hbWUsIHRoaXMpO1xuXG4gICAgaWYgKHRoaXMuX2FjdGl2ZUxldmVsKSB7XG4gICAgICAgIHRoaXMubGV2ZWxDb250YWluZXIucmVwbGFjZUNoaWxkKG5ld0xldmVsLmVsZW1lbnQsIHRoaXMuX2FjdGl2ZUxldmVsLmVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubGV2ZWxDb250YWluZXIuYXBwZW5kQ2hpbGQobmV3TGV2ZWwuZWxlbWVudCk7XG4gICAgfVxuXG4gICAgdGhpcy5fYWN0aXZlTGV2ZWwgPSBuZXdMZXZlbDtcblxuICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5jb250YWluZXIsICdfaGlkZGVuJyk7XG4gICAgdXRpbC5yZW1vdmVDbGFzcyh0aGlzLmxldmVsQ29udGFpbmVyLCAnX2hpZGRlbicpO1xufTtcblxuTGV2ZWxNZW51LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5yZW1vdmVDbGFzcyh0aGlzLmNvbnRhaW5lciwgJ19oaWRkZW4nKTtcbiAgICB1dGlsLmFkZENsYXNzKHRoaXMubGV2ZWxDb250YWluZXIsICdfaGlkZGVuJyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExldmVsTWVudTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIDE6IHJlcXVpcmUoJy4uL2xldmVscy8xJyksXG4gICAgMjogcmVxdWlyZSgnLi4vbGV2ZWxzLzInKVxufTtcbiIsInZhciBHYW1lID0gcmVxdWlyZSgnLi4vZ2FtZS9nYW1lLmpzJyk7XG5cbmZ1bmN0aW9uIExldmVsKG5hbWUsIGxldmVsTWVudSkge1xuICAgIEdhbWUuY2FsbCh0aGlzLCBuYW1lLCBsZXZlbE1lbnUpO1xufVxuXG5MZXZlbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEdhbWUucHJvdG90eXBlKTtcbkxldmVsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExldmVsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExldmVsO1xuIiwidmFyIEdhbWUgPSByZXF1aXJlKCcuLi9nYW1lL2dhbWUuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBHYW1lO1xuIiwidmFyIHV0aWwgPSB7fTtcblxudXRpbC5hZGRDbGFzcyA9IGZ1bmN0aW9uKGVsLCBuYW1lKSB7XG4gICAgdmFyIGNsYXNzTmFtZXMgPSBlbC5jbGFzc05hbWUuc3BsaXQoJyAnKTtcbiAgICB2YXIgaW5kZXggPSBjbGFzc05hbWVzLmluZGV4T2YobmFtZSk7XG5cbiAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgIGNsYXNzTmFtZXMucHVzaChuYW1lKTtcbiAgICAgICAgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lcy5qb2luKCcgJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVsO1xufTtcblxudXRpbC5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKGVsLCBuYW1lKSB7XG4gICAgdmFyIGNsYXNzTmFtZXMgPSBlbC5jbGFzc05hbWUuc3BsaXQoJyAnKTtcbiAgICB2YXIgaW5kZXggPSBjbGFzc05hbWVzLmluZGV4T2YobmFtZSk7XG5cbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgIGNsYXNzTmFtZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lcy5qb2luKCcgJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVsO1xufTtcblxudXRpbC5oYXNDbGFzcyA9IGZ1bmN0aW9uKGVsLCBuYW1lKSB7XG4gICAgdmFyIGNsYXNzTmFtZXMgPSBlbC5jbGFzc05hbWUuc3BsaXQoJyAnKTtcblxuICAgIHJldHVybiBjbGFzc05hbWVzLmluZGV4T2YobmFtZSkgIT0gLTE7XG59O1xuXG51dGlsLmZvckVhY2ggPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKG9iai5sZW5ndGgpIHtcbiAgICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2tleV0sIGtleSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbnV0aWwub24gPSBmdW5jdGlvbihub2RlLCB0eXBlLCBjYWxsYmFjaykge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBjYWxsYmFjayk7XG59O1xuXG51dGlsLm9mZiA9IGZ1bmN0aW9uKG5vZGUsIHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGNhbGxiYWNrKTtcbn07XG5cblxuLy8gU2VlbSBsZWdpdFxudmFyIGlzTW9iaWxlID0gKCdEZXZpY2VPcmllbnRhdGlvbkV2ZW50JyBpbiB3aW5kb3cgfHwgJ29yaWVudGF0aW9uJyBpbiB3aW5kb3cpO1xuLy8gQnV0IHdpdGggbXkgQ2hyb21lIG9uIHdpbmRvd3MsIERldmljZU9yaWVudGF0aW9uRXZlbnQgPT0gZmN0KClcbmlmICgvV2luZG93cyBOVHxNYWNpbnRvc2h8TWFjIE9TIFh8TGludXgvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSBpc01vYmlsZSA9IGZhbHNlO1xuLy8gTXkgYW5kcm9pZCBoYXZlIFwibGludXhcIiB0b29cbmlmICgvTW9iaWxlL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkgaXNNb2JpbGUgPSB0cnVlO1xuXG51dGlsLmlzTW9iaWxlID0gaXNNb2JpbGU7XG5cbnV0aWwucmdiU3VtID0gZnVuY3Rpb24oYXJyKSB7XG4gICAgLy9be3JnYiwgcmF0aW99LCAuLi5dXG5cbiAgICB2YXIgc3VtID0gWzAsIDAsIDBdO1xuICAgIHZhciBuID0gMDtcbiAgICB2YXIgZWwsIGksIGo7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGVsID0gYXJyW2ldO1xuXG4gICAgICAgIGZvciAoaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgICAgICAgIHN1bVtqXSArPSBlbC5yZ2Jbal0gKiBlbC5yYXRpbztcbiAgICAgICAgfVxuXG4gICAgICAgIG4gKz0gZWwucmF0aW87XG4gICAgfVxuXG4gICAgZm9yIChqID0gMDsgaiA8IDM7IGorKykge1xuICAgICAgICBzdW1bal0gPSBNYXRoLmZsb29yKHN1bVtqXSAvIG4pO1xuICAgIH1cblxuICAgIHJldHVybiBzdW07XG59O1xuXG51dGlsLm51bGxGbiA9IGZ1bmN0aW9uKCkge307XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbDtcbiJdfQ==