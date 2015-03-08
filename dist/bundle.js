(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Game = require('./game/game.js');

var game = new Game();

var html = document.getElementById('game');

html.appendChild(game.element);

},{"./game/game.js":5}],2:[function(require,module,exports){
var colors = require('./colors.js');
var util = require('../util.js');

var primeNumbers = [1, 2, 3, 5, 7, 11, 13];

var idCounter = 0;

function Block(x, y, field) {
    this.id = ++idCounter;

    this.field = field;

    this.x = x;
    this.y = y;

    this.value = null;
    this.element = null;

    this.width = 500 / config.field.size[0];
    this.height = 500 / config.field.size[1];

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
    var possibleValues = config.numbers.possibleValues;

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

Block.prototype._touchMoveHandler = function(ev) {
    for (var i = 0; i < ev.changedTouches.length; i++) {
        var touch = ev.changedTouches[i];
        var target = document.elementFromPoint(touch.clientX, touch.clientY);

        if (this.activeElement === target) {
            this.field.blockMouseDown(this.id);
        }
    }
};

Block.prototype._mouseDownHandler = function() {
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

},{"../util.js":6,"./colors.js":3}],3:[function(require,module,exports){
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

function Field(game) {
    this.game = game;

    this.blocks = {};
    this._blocksXY = {};
    this.size = config.field.size;

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

        if (target.className.indexOf('block__active') == -1) { continue; }

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

    this.game.updateChainSumm(0);
};

Field.prototype.blockMouseDown = function(id) {
    this.selectedMode = true;
    this.selectedBlocks = [id];

    this.blocks[id].select();

    this.game.updateChainSumm(this._calcChainSumm());
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

            this.game.updateChainSumm(this._calcChainSumm());
        }
    } else {
        if (selBlocks[selBlocks.length - 2] == id) {
            var lastBlId = selBlocks.pop();
            this.blocks[lastBlId].unselect();

            this.game.updateChainSumm(this._calcChainSumm());
        }
    }
};

Field.prototype.blockMouseOut = function(id) {

};

Field.prototype._calcChainSumm = function() {
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
    if (this.selectedBlocks.length < config.chain.minLength) { return; }

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

},{"../util":6,"./block.js":2}],5:[function(require,module,exports){
var Field = require('./field.js');
var util = require('../util');

function Game() {
    this.field = new Field(this);
    this.score = 0;

    this._createElement();
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

    var chainSumm = document.createElement('div');
    chainSumm.className = 'game__chainSumm';
    gameHeader.appendChild(chainSumm);

    element.appendChild(this.field.element);

    this.scoreElement = score;
    this.chainSummElement = chainSumm;
    this.element = element;
};

Game.prototype.updateChainSumm = function(value) {
    if (value) {
        this.chainSummElement.innerHTML = value;
        util.addClass(this.chainSummElement, '_showed');
    } else {
        util.removeClass(this.chainSummElement, '_showed');
    }
};

Game.prototype.updateScore = function(value) {
    this.score += value;
    this.scoreElement.innerHTML = this.score;
};

module.exports = Game;

},{"../util":6,"./field.js":4}],6:[function(require,module,exports){
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

module.exports = util;

},{}]},{},[1])


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvaW5kZXguanMiLCJzcmMvanMvZ2FtZS9ibG9jay5qcyIsInNyYy9qcy9nYW1lL2NvbG9ycy5qcyIsInNyYy9qcy9nYW1lL2ZpZWxkLmpzIiwic3JjL2pzL2dhbWUvZ2FtZS5qcyIsInNyYy9qcy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgR2FtZSA9IHJlcXVpcmUoJy4vZ2FtZS9nYW1lLmpzJyk7XG5cbnZhciBnYW1lID0gbmV3IEdhbWUoKTtcblxudmFyIGh0bWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ2FtZScpO1xuXG5odG1sLmFwcGVuZENoaWxkKGdhbWUuZWxlbWVudCk7XG4iLCJ2YXIgY29sb3JzID0gcmVxdWlyZSgnLi9jb2xvcnMuanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xuXG52YXIgcHJpbWVOdW1iZXJzID0gWzEsIDIsIDMsIDUsIDcsIDExLCAxM107XG5cbnZhciBpZENvdW50ZXIgPSAwO1xuXG5mdW5jdGlvbiBCbG9jayh4LCB5LCBmaWVsZCkge1xuICAgIHRoaXMuaWQgPSArK2lkQ291bnRlcjtcblxuICAgIHRoaXMuZmllbGQgPSBmaWVsZDtcblxuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcblxuICAgIHRoaXMudmFsdWUgPSBudWxsO1xuICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG5cbiAgICB0aGlzLndpZHRoID0gNTAwIC8gY29uZmlnLmZpZWxkLnNpemVbMF07XG4gICAgdGhpcy5oZWlnaHQgPSA1MDAgLyBjb25maWcuZmllbGQuc2l6ZVsxXTtcblxuICAgIHRoaXMuX3NldFJhbmRvbVZhbHVlKCk7XG4gICAgdGhpcy5fY3JlYXRlRWxlbWVudCgpO1xuICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcbn1cblxuQmxvY2sucHJvdG90eXBlLl9jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gVE9ETzog0LLQutC70Y7Rh9C40YLRjCDQv9GA0L7RgdGC0L7QuSDRiNCw0LHQu9C+0L3QuNC30LDRgtC+0YBcblxuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWxlbWVudC5jbGFzc05hbWUgPSAnYmxvY2snO1xuICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLWlkJywgdGhpcy5pZCk7XG5cbiAgICBlbGVtZW50LnN0eWxlLmxlZnQgPSBNYXRoLmZsb29yKHRoaXMueCAqIHRoaXMud2lkdGgpICsgJ3B4JztcbiAgICBlbGVtZW50LnN0eWxlLmJvdHRvbSA9IE1hdGguZmxvb3IodGhpcy55ICogdGhpcy5oZWlnaHQpICsgJ3B4JztcblxuICAgIHZhciBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGlubmVyLmNsYXNzTmFtZSA9ICdibG9ja19faW5uZXInO1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoaW5uZXIpO1xuXG4gICAgdmFyIGFjdGl2ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGFjdGl2ZS5jbGFzc05hbWUgPSAnYmxvY2tfX2FjdGl2ZSc7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChhY3RpdmUpO1xuXG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0ZXh0LmNsYXNzTmFtZSA9ICdibG9ja19fdGV4dCc7XG4gICAgdGV4dC5pbm5lckhUTUwgPSB0aGlzLnZhbHVlO1xuICAgIGlubmVyLmFwcGVuZENoaWxkKHRleHQpO1xuXG4gICAgdGhpcy5pbm5lckVsZW1lbnQgPSBpbm5lcjtcbiAgICB0aGlzLnRleHRFbGVtZW50ID0gdGV4dDtcbiAgICB0aGlzLmFjdGl2ZUVsZW1lbnQgPSBhY3RpdmU7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcblxuICAgIHRoaXMuX3VwZGF0ZUNvbG9ycygpO1xufTtcblxuQmxvY2sucHJvdG90eXBlLl9zZXRSYW5kb21WYWx1ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdW1tUmF0aW9uID0gMDtcbiAgICB2YXIgcG9zc2libGVWYWx1ZXMgPSBjb25maWcubnVtYmVycy5wb3NzaWJsZVZhbHVlcztcblxuICAgIHBvc3NpYmxlVmFsdWVzLmZvckVhY2goZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgc3VtbVJhdGlvbiArPSBlbFsxXTtcbiAgICB9KTtcblxuICAgIHZhciBzdW1tID0gMDtcblxuICAgIHZhciBjaGFuY2VBcnJheSA9IHBvc3NpYmxlVmFsdWVzLm1hcChmdW5jdGlvbihlbCkge1xuICAgICAgICB2YXIgdmFsID0gZWxbMV0gLyBzdW1tUmF0aW9uICsgc3VtbTtcblxuICAgICAgICBzdW1tICs9IHZhbDtcblxuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0pO1xuXG4gICAgdmFyIHJvbGwgPSBNYXRoLnJhbmRvbSgpO1xuXG4gICAgdmFyIHZhbHVlID0gMDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hhbmNlQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHJvbGwgPD0gY2hhbmNlQXJyYXlbaV0pIHtcbiAgICAgICAgICAgIHZhbHVlID0gcG9zc2libGVWYWx1ZXNbaV1bMF07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5fYmluZEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh1dGlsLmlzTW9iaWxlKSB7XG4gICAgICAgIHV0aWwub24odGhpcy5lbGVtZW50LCAndG91Y2hzdGFydCcsIHRoaXMuX21vdXNlRG93bkhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXRpbC5vbih0aGlzLmVsZW1lbnQsICdtb3VzZWRvd24nLCB0aGlzLl9tb3VzZURvd25IYW5kbGVyLmJpbmQodGhpcykpO1xuICAgICAgICB1dGlsLm9uKHRoaXMuYWN0aXZlRWxlbWVudCwgJ21vdXNlb3ZlcicsIHRoaXMuX21vdXNlT3ZlckhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgICAgIC8vdXRpbC5vbih0aGlzLmFjdGl2ZUVsZW1lbnQsICdtb3VzZW91dCcsIHRoaXMuX21vdXNlT3V0SGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9XG59O1xuXG5CbG9jay5wcm90b3R5cGUuX3RvdWNoTW92ZUhhbmRsZXIgPSBmdW5jdGlvbihldikge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXYuY2hhbmdlZFRvdWNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHRvdWNoID0gZXYuY2hhbmdlZFRvdWNoZXNbaV07XG4gICAgICAgIHZhciB0YXJnZXQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHRvdWNoLmNsaWVudFgsIHRvdWNoLmNsaWVudFkpO1xuXG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZUVsZW1lbnQgPT09IHRhcmdldCkge1xuICAgICAgICAgICAgdGhpcy5maWVsZC5ibG9ja01vdXNlRG93bih0aGlzLmlkKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkJsb2NrLnByb3RvdHlwZS5fbW91c2VEb3duSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZmllbGQuYmxvY2tNb3VzZURvd24odGhpcy5pZCk7XG59O1xuXG5cbkJsb2NrLnByb3RvdHlwZS5fbW91c2VPdmVySGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZmllbGQuYmxvY2tNb3VzZU92ZXIodGhpcy5pZCk7XG59O1xuXG5cbkJsb2NrLnByb3RvdHlwZS5fbW91c2VPdXRIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5maWVsZC5ibG9ja01vdXNlT3V0KHRoaXMuaWQpO1xufTtcblxuQmxvY2sucHJvdG90eXBlLmNoYW5nZVBvc2l0aW9uID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcblxuICAgIHRoaXMuZWxlbWVudC5zdHlsZS5sZWZ0ID0gTWF0aC5mbG9vcih4ICogdGhpcy53aWR0aCkgKyAncHgnO1xuICAgIHRoaXMuZWxlbWVudC5zdHlsZS5ib3R0b20gPSBNYXRoLmZsb29yKHkgKiB0aGlzLmhlaWdodCkgKyAncHgnO1xufTtcblxuQmxvY2sucHJvdG90eXBlLl91cGRhdGVDb2xvcnMgPSBmdW5jdGlvbigpIHtcbiAgICAvLyA3IC0+IDMgKHByaW1lTnVtYmVyIC0+IHJhdGlvKVxuICAgIHZhciBwcmltZUFycmF5ID0gW107XG4gICAgdmFyIGk7XG5cbiAgICBmb3IgKGkgPSBwcmltZU51bWJlcnMubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgICBpZiAodGhpcy52YWx1ZSAlIHByaW1lTnVtYmVyc1tpXSA9PT0gMCkge1xuICAgICAgICAgICAgcHJpbWVBcnJheS5wdXNoKHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogcHJpbWVOdW1iZXJzW2ldLFxuICAgICAgICAgICAgICAgIHJnYjogY29sb3JzW2ldLnJnYixcbiAgICAgICAgICAgICAgICByYXRpbzogdGhpcy52YWx1ZSAvIHByaW1lTnVtYmVyc1tpXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgY29sb3I7XG5cbiAgICBpZiAocHJpbWVBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgY29sb3IgPSB1dGlsLnJnYlN1bShwcmltZUFycmF5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb2xvciA9IGNvbG9yc1swXS5yZ2I7XG4gICAgfVxuXG4gICAgdGhpcy5pbm5lckVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3JnYignICsgY29sb3Iuam9pbignLCcpICsgJyknO1xufTtcblxuLypCbG9jay5wcm90b3R5cGUuX3VwZGF0ZUNvbG9ycyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgZm9yICh2YXIgaSA9IHByaW1lTnVtYmVycy5sZW5ndGggLSAxOyBpID49MDsgaS0tKSB7XG4gICAgICAgIGlmICh0aGlzLnZhbHVlICUgcHJpbWVOdW1iZXJzW2ldID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLmlubmVyRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncmdiKCcgKyBjb2xvcnNbaV0ucmdiLmpvaW4oJywnKSArICcpJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxufTsqL1xuXG5CbG9jay5wcm90b3R5cGUuY2hhbmdlVmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLnRleHRFbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuXG4gICAgdGhpcy5fdXBkYXRlQ29sb3JzKCk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5hZGRDbGFzcyh0aGlzLmVsZW1lbnQsICdfc2VsZWN0ZWQnKTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS51bnNlbGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5lbGVtZW50LCAnX3NlbGVjdGVkJyk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuYW5pbWF0ZUNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5lbGVtZW50LCAnX2JsaW5rJyk7XG5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHNlbGYuZWxlbWVudCwgJ19ibGluaycpO1xuICAgIH0sIDApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCbG9jaztcbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICAgIHtcbiAgICAgICAgd2ViOiAnIzk5YjQzMycsXG4gICAgICAgIHJnYjogWzE1NCwgMTgwLCA1MV1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyNEQTUzMkMnLFxuICAgICAgICByZ2I6IFsyMTgsIDgzLCA0NF1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyMxZTcxNDUnLFxuICAgICAgICByZ2I6IFszMCwgMTEzLCA2OV1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyMyQzg5QTAnLFxuICAgICAgICByZ2I6IFs0NCwgMTM3LCAxNjBdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjMDBBQTg4JyxcbiAgICAgICAgcmdiOiBbMCwgMTcwLCAxMzZdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjMDBkNDU1JyxcbiAgICAgICAgcmdiOiBbMCwgMjEyLCA4NV1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyNmZjJhMmEnLFxuICAgICAgICByZ2I6IFsyNTUsIDQyLCA0Ml1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyNDQjUwMDAnLFxuICAgICAgICByZ2I6IFsyMDMsIDgwLCAwXVxuICAgIH1cbl07XG4iLCJ2YXIgQmxvY2sgPSByZXF1aXJlKCcuL2Jsb2NrLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuZnVuY3Rpb24gRmllbGQoZ2FtZSkge1xuICAgIHRoaXMuZ2FtZSA9IGdhbWU7XG5cbiAgICB0aGlzLmJsb2NrcyA9IHt9O1xuICAgIHRoaXMuX2Jsb2Nrc1hZID0ge307XG4gICAgdGhpcy5zaXplID0gY29uZmlnLmZpZWxkLnNpemU7XG5cbiAgICB0aGlzLnNlbGVjdGVkQmxvY2tzID0gW107XG4gICAgdGhpcy5zZWxlY3RlZE1vZGUgPSBmYWxzZTtcblxuICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fY3JlYXRlRWxlbWVudCgpO1xuICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcbn1cblxuRmllbGQucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNpemVbMF07IGkrKykge1xuICAgICAgICB0aGlzLl9ibG9ja3NYWVtpXSA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5zaXplWzFdOyBqKyspIHtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQmxvY2soaSwgaiwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuY3JlYXRlQmxvY2sgPSBmdW5jdGlvbih4LCB5LCBpc0luaXQpIHtcbiAgICB2YXIgYmxvY2sgPSBuZXcgQmxvY2soeCwgeSwgdGhpcyk7XG5cbiAgICB0aGlzLmJsb2Nrc1tibG9jay5pZF0gPSBibG9jaztcblxuICAgIHRoaXMuX2Jsb2Nrc1hZW3hdW3ldID0gYmxvY2suaWQ7XG5cbiAgICBpZiAoIWlzSW5pdCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoYmxvY2suZWxlbWVudCk7XG4gICAgICAgIGJsb2NrLmFuaW1hdGVDcmVhdGUoKTtcbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICB1dGlsLmZvckVhY2godGhpcy5ibG9ja3MsIGZ1bmN0aW9uKGJsKSB7XG4gICAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGJsLmVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9ICdmaWVsZCcgK1xuICAgICAgICAnIF93aWR0aF8nICsgdGhpcy5zaXplWzBdICtcbiAgICAgICAgJyBfaGVpZ2h0XycgKyB0aGlzLnNpemVbMV07XG5cbiAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHV0aWwuaXNNb2JpbGUpIHtcbiAgICAgICAgdXRpbC5vbihkb2N1bWVudC5ib2R5LCAndG91Y2hlbmQnLCB0aGlzLl9tb3VzZVVwSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICAgICAgdXRpbC5vbihkb2N1bWVudC5ib2R5LCAndG91Y2htb3ZlJywgdGhpcy5fdG91Y2hNb3ZlSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1dGlsLm9uKGRvY3VtZW50LmJvZHksICdtb3VzZXVwJywgdGhpcy5fbW91c2VVcEhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLl90b3VjaE1vdmVIYW5kbGVyID0gZnVuY3Rpb24oZXYpIHtcbiAgICB2YXIgaXNCcmVhaywgYmxvY2ssIGtleXMsdG91Y2gsIHRhcmdldCwgaSwgajtcbiAgICB2YXIgYmxvY2tzID0gdGhpcy5ibG9ja3M7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgZXYuY2hhbmdlZFRvdWNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdG91Y2ggPSBldi5jaGFuZ2VkVG91Y2hlc1tpXTtcbiAgICAgICAgdGFyZ2V0ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh0b3VjaC5jbGllbnRYLCB0b3VjaC5jbGllbnRZKTtcblxuICAgICAgICBpZiAodGFyZ2V0LmNsYXNzTmFtZS5pbmRleE9mKCdibG9ja19fYWN0aXZlJykgPT0gLTEpIHsgY29udGludWU7IH1cblxuICAgICAgICAvLyDQtNC10LvQsNC10LwgZm9yLCDQsCDQvdC1IGZvckVhY2gsINGH0YLQvtCx0Ysg0LzQvtC20L3QviDQsdGL0LvQviDRgdGC0L7Qv9C90YPRgtGMXG4gICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyhibG9ja3MpO1xuXG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBrZXlzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBibG9jayA9IGJsb2Nrc1trZXlzW2pdXTtcblxuICAgICAgICAgICAgaWYgKGJsb2NrLmFjdGl2ZUVsZW1lbnQgPT09IHRhcmdldCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYmxvY2tNb3VzZU92ZXIoYmxvY2suaWQpO1xuICAgICAgICAgICAgICAgIGlzQnJlYWsgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzQnJlYWspIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLl9tb3VzZVVwSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5zZWxlY3RlZE1vZGUpIHsgcmV0dXJuOyB9XG5cbiAgICB0aGlzLnNlbGVjdGVkTW9kZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5fcnVuU2VsZWN0ZWQoKTtcblxuICAgIHV0aWwuZm9yRWFjaCh0aGlzLmJsb2NrcywgZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgICAgYmxvY2sudW5zZWxlY3QoKTtcbiAgICB9KTtcblxuICAgIHRoaXMuZ2FtZS51cGRhdGVDaGFpblN1bW0oMCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuYmxvY2tNb3VzZURvd24gPSBmdW5jdGlvbihpZCkge1xuICAgIHRoaXMuc2VsZWN0ZWRNb2RlID0gdHJ1ZTtcbiAgICB0aGlzLnNlbGVjdGVkQmxvY2tzID0gW2lkXTtcblxuICAgIHRoaXMuYmxvY2tzW2lkXS5zZWxlY3QoKTtcblxuICAgIHRoaXMuZ2FtZS51cGRhdGVDaGFpblN1bW0odGhpcy5fY2FsY0NoYWluU3VtbSgpKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY2hlY2tXaXRoTGFzdCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGxhc3RCbCA9IHRoaXMuYmxvY2tzW3RoaXMuc2VsZWN0ZWRCbG9ja3NbdGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggLSAxXV07XG4gICAgdmFyIG5ld0JsID0gdGhpcy5ibG9ja3NbaWRdO1xuXG4gICAgcmV0dXJuIGxhc3RCbC52YWx1ZSA9PSBuZXdCbC52YWx1ZSAmJlxuICAgICAgICBNYXRoLmFicyhsYXN0QmwueCAtIG5ld0JsLngpIDw9IDEgJiZcbiAgICAgICAgTWF0aC5hYnMobGFzdEJsLnkgLSBuZXdCbC55KSA8PSAxO1xufTtcblxuRmllbGQucHJvdG90eXBlLmJsb2NrTW91c2VPdmVyID0gZnVuY3Rpb24oaWQpIHtcbiAgICBpZiAoIXRoaXMuc2VsZWN0ZWRNb2RlKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIHNlbEJsb2NrcyA9IHRoaXMuc2VsZWN0ZWRCbG9ja3M7XG5cbiAgICBpZiAoc2VsQmxvY2tzLmluZGV4T2YoaWQpID09IC0xKSB7XG4gICAgICAgIGlmICh0aGlzLl9jaGVja1dpdGhMYXN0KGlkKSkge1xuICAgICAgICAgICAgc2VsQmxvY2tzLnB1c2goaWQpO1xuICAgICAgICAgICAgdGhpcy5ibG9ja3NbaWRdLnNlbGVjdCgpO1xuXG4gICAgICAgICAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW1tKHRoaXMuX2NhbGNDaGFpblN1bW0oKSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoc2VsQmxvY2tzW3NlbEJsb2Nrcy5sZW5ndGggLSAyXSA9PSBpZCkge1xuICAgICAgICAgICAgdmFyIGxhc3RCbElkID0gc2VsQmxvY2tzLnBvcCgpO1xuICAgICAgICAgICAgdGhpcy5ibG9ja3NbbGFzdEJsSWRdLnVuc2VsZWN0KCk7XG5cbiAgICAgICAgICAgIHRoaXMuZ2FtZS51cGRhdGVDaGFpblN1bW0odGhpcy5fY2FsY0NoYWluU3VtbSgpKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5ibG9ja01vdXNlT3V0ID0gZnVuY3Rpb24oaWQpIHtcblxufTtcblxuRmllbGQucHJvdG90eXBlLl9jYWxjQ2hhaW5TdW1tID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZhbHVlID0gdGhpcy5ibG9ja3NbdGhpcy5zZWxlY3RlZEJsb2Nrc1swXV0udmFsdWUgfHwgMDtcblxuICAgIHJldHVybiB2YWx1ZSAqIHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9jYWxjVXBkYXRlU2NvcmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLmJsb2Nrc1t0aGlzLnNlbGVjdGVkQmxvY2tzWzBdXS52YWx1ZTtcblxuICAgIHZhciBrID0gMSArIDAuMiAqICh0aGlzLnNlbGVjdGVkQmxvY2tzLmxlbmd0aCAtIDMpO1xuXG4gICAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgKiB0aGlzLnNlbGVjdGVkQmxvY2tzLmxlbmd0aCAqIGspO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9ibG9ja1JlbW92ZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGJsb2NrID0gdGhpcy5ibG9ja3NbaWRdO1xuXG4gICAgdGhpcy5lbGVtZW50LnJlbW92ZUNoaWxkKGJsb2NrLmVsZW1lbnQpO1xuXG4gICAgdGhpcy5fYmxvY2tzWFlbYmxvY2sueF1bYmxvY2sueV0gPSBudWxsO1xuICAgIGRlbGV0ZSB0aGlzLmJsb2Nrc1tpZF07XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX3J1blNlbGVjdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoIDwgY29uZmlnLmNoYWluLm1pbkxlbmd0aCkgeyByZXR1cm47IH1cblxuICAgIHRoaXMuZ2FtZS51cGRhdGVTY29yZSh0aGlzLl9jYWxjVXBkYXRlU2NvcmUoKSk7XG5cbiAgICB2YXIgbGFzdEJsSWQgPSB0aGlzLnNlbGVjdGVkQmxvY2tzLnBvcCgpO1xuICAgIHZhciBsYXN0QmwgPSB0aGlzLmJsb2Nrc1tsYXN0QmxJZF07XG4gICAgdmFyIHZhbHVlID0gbGFzdEJsLnZhbHVlICogKHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoICsgMSk7IC8vICsxIGJlY2F1c2UgcG9wIGFib3ZlXG5cbiAgICBsYXN0QmwuY2hhbmdlVmFsdWUodmFsdWUpO1xuXG4gICAgdGhpcy5zZWxlY3RlZEJsb2Nrcy5mb3JFYWNoKHRoaXMuX2Jsb2NrUmVtb3ZlLCB0aGlzKTtcblxuICAgIHRoaXMuX2NoZWNrUG9zaXRpb25zKCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2NoZWNrUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIGJsb2Nrc1hZID0gdGhpcy5fYmxvY2tzWFk7XG4gICAgdmFyIGJsb2NrcyA9IHRoaXMuYmxvY2tzO1xuXG4gICAgdXRpbC5mb3JFYWNoKGJsb2Nrc1hZLCBmdW5jdGlvbihibG9ja3NZKSB7XG4gICAgICAgIHZhciBhcnIgPSBbXTtcblxuICAgICAgICAvLyDQtNC+0LHQsNCy0LvRj9C10Lwg0LIg0LzQsNGB0YHQuNCyINGB0YPRidC10YHRgtCy0YPRjtGJ0LjQtSDQstC10YDRgtC40LrQsNC70YzQvdGL0LUg0Y3Qu9C10LzQtdC90YLRi1xuICAgICAgICB1dGlsLmZvckVhY2goYmxvY2tzWSwgZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIGlmIChpZCkgeyBhcnIucHVzaChpZCk7IH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g0LXRgdC70Lgg0L/QvtC70L3Ri9C5INC40LvQuCDQv9GD0YHRgtC+0LlcbiAgICAgICAgaWYgKGFyci5sZW5ndGggPT0gc2VsZi5zaXplWzFdIHx8ICFhcnIpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgLy8g0YHQvtGA0YLQuNGA0YPQtdC8XG4gICAgICAgIGFyci5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBibG9ja3NbYV0ueSA+IGJsb2Nrc1tiXS55O1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDRgdC00LLQuNCz0LDQtdC8INC+0YLRgdC+0YDRgtC40YDQvtCy0LDQvdC90YvQuSDRgdC/0LjRgdC+0Log0Log0L3QuNC30YNcbiAgICAgICAgYXJyLmZvckVhY2goZnVuY3Rpb24oaWQsIHkpIHtcbiAgICAgICAgICAgIHZhciBibG9jayA9IGJsb2Nrc1tpZF07XG5cbiAgICAgICAgICAgIGlmIChibG9jay55ICE9IHkpIHtcbiAgICAgICAgICAgICAgICBibG9ja3NZW2Jsb2NrLnldID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIGJsb2NrLmNoYW5nZVBvc2l0aW9uKGJsb2NrLngsIHkpO1xuXG4gICAgICAgICAgICAgICAgYmxvY2tzWVt5XSA9IGlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRoaXMuX2FkZE5ld0Jsb2NrcygpO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9hZGROZXdCbG9ja3MgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYmxvY2tzWFkgPSB0aGlzLl9ibG9ja3NYWTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zaXplWzBdOyBpKyspIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLnNpemVbMV07IGorKykge1xuICAgICAgICAgICAgaWYgKCFibG9ja3NYWVtpXVtqXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlQmxvY2soaSwgaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpZWxkO1xuIiwidmFyIEZpZWxkID0gcmVxdWlyZSgnLi9maWVsZC5qcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbmZ1bmN0aW9uIEdhbWUoKSB7XG4gICAgdGhpcy5maWVsZCA9IG5ldyBGaWVsZCh0aGlzKTtcbiAgICB0aGlzLnNjb3JlID0gMDtcblxuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbn1cblxuR2FtZS5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2dhbWUnO1xuXG4gICAgdmFyIGdhbWVIZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBnYW1lSGVhZGVyLmNsYXNzTmFtZSA9ICdnYW1lX19oZWFkZXInO1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoZ2FtZUhlYWRlcik7XG5cbiAgICB2YXIgc2NvcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBzY29yZS5jbGFzc05hbWUgPSAnZ2FtZV9fc2NvcmUnO1xuICAgIHNjb3JlLmlubmVySFRNTCA9ICcwJztcbiAgICBnYW1lSGVhZGVyLmFwcGVuZENoaWxkKHNjb3JlKTtcblxuICAgIHZhciBjaGFpblN1bW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjaGFpblN1bW0uY2xhc3NOYW1lID0gJ2dhbWVfX2NoYWluU3VtbSc7XG4gICAgZ2FtZUhlYWRlci5hcHBlbmRDaGlsZChjaGFpblN1bW0pO1xuXG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmZpZWxkLmVsZW1lbnQpO1xuXG4gICAgdGhpcy5zY29yZUVsZW1lbnQgPSBzY29yZTtcbiAgICB0aGlzLmNoYWluU3VtbUVsZW1lbnQgPSBjaGFpblN1bW07XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbn07XG5cbkdhbWUucHJvdG90eXBlLnVwZGF0ZUNoYWluU3VtbSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuY2hhaW5TdW1tRWxlbWVudC5pbm5lckhUTUwgPSB2YWx1ZTtcbiAgICAgICAgdXRpbC5hZGRDbGFzcyh0aGlzLmNoYWluU3VtbUVsZW1lbnQsICdfc2hvd2VkJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyh0aGlzLmNoYWluU3VtbUVsZW1lbnQsICdfc2hvd2VkJyk7XG4gICAgfVxufTtcblxuR2FtZS5wcm90b3R5cGUudXBkYXRlU2NvcmUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHRoaXMuc2NvcmUgKz0gdmFsdWU7XG4gICAgdGhpcy5zY29yZUVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5zY29yZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR2FtZTtcbiIsInZhciB1dGlsID0ge307XG5cbnV0aWwuYWRkQ2xhc3MgPSBmdW5jdGlvbihlbCwgbmFtZSkge1xuICAgIHZhciBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG4gICAgdmFyIGluZGV4ID0gY2xhc3NOYW1lcy5pbmRleE9mKG5hbWUpO1xuXG4gICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICBjbGFzc05hbWVzLnB1c2gobmFtZSk7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZXMuam9pbignICcpO1xuICAgIH1cblxuICAgIHJldHVybiBlbDtcbn07XG5cbnV0aWwucmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbihlbCwgbmFtZSkge1xuICAgIHZhciBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG4gICAgdmFyIGluZGV4ID0gY2xhc3NOYW1lcy5pbmRleE9mKG5hbWUpO1xuXG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICBjbGFzc05hbWVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZXMuam9pbignICcpO1xuICAgIH1cblxuICAgIHJldHVybiBlbDtcbn07XG5cbnV0aWwuaGFzQ2xhc3MgPSBmdW5jdGlvbihlbCwgbmFtZSkge1xuICAgIHZhciBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG5cbiAgICByZXR1cm4gY2xhc3NOYW1lcy5pbmRleE9mKG5hbWUpICE9IC0xO1xufTtcblxudXRpbC5mb3JFYWNoID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChvYmoubGVuZ3RoKSB7XG4gICAgICAgIG9iai5mb3JFYWNoKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtrZXldLCBrZXkpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG51dGlsLm9uID0gZnVuY3Rpb24obm9kZSwgdHlwZSwgY2FsbGJhY2spIHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgY2FsbGJhY2spO1xufTtcblxudXRpbC5vZmYgPSBmdW5jdGlvbihub2RlLCB0eXBlLCBjYWxsYmFjaykge1xuICAgIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBjYWxsYmFjayk7XG59O1xuXG5cbi8vIFNlZW0gbGVnaXRcbnZhciBpc01vYmlsZSA9ICgnRGV2aWNlT3JpZW50YXRpb25FdmVudCcgaW4gd2luZG93IHx8ICdvcmllbnRhdGlvbicgaW4gd2luZG93KTtcbi8vIEJ1dCB3aXRoIG15IENocm9tZSBvbiB3aW5kb3dzLCBEZXZpY2VPcmllbnRhdGlvbkV2ZW50ID09IGZjdCgpXG5pZiAoL1dpbmRvd3MgTlR8TWFjaW50b3NofE1hYyBPUyBYfExpbnV4L2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkgaXNNb2JpbGUgPSBmYWxzZTtcbi8vIE15IGFuZHJvaWQgaGF2ZSBcImxpbnV4XCIgdG9vXG5pZiAoL01vYmlsZS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIGlzTW9iaWxlID0gdHJ1ZTtcblxudXRpbC5pc01vYmlsZSA9IGlzTW9iaWxlO1xuXG51dGlsLnJnYlN1bSA9IGZ1bmN0aW9uKGFycikge1xuICAgIC8vW3tyZ2IsIHJhdGlvfSwgLi4uXVxuXG4gICAgdmFyIHN1bSA9IFswLCAwLCAwXTtcbiAgICB2YXIgbiA9IDA7XG4gICAgdmFyIGVsLCBpLCBqO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICBlbCA9IGFycltpXTtcblxuICAgICAgICBmb3IgKGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICAgICAgICBzdW1bal0gKz0gZWwucmdiW2pdICogZWwucmF0aW87XG4gICAgICAgIH1cblxuICAgICAgICBuICs9IGVsLnJhdGlvO1xuICAgIH1cblxuICAgIGZvciAoaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgICAgc3VtW2pdID0gTWF0aC5mbG9vcihzdW1bal0gLyBuKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3VtO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsO1xuIl19