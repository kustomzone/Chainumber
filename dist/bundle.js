(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Game = require('./game/game.js');
var util = require('./util.js');

if (!util.isMobile) {
    util.addClass(document.body, 'no-touch');
}

var game = new Game();

var html = document.getElementById('game');

html.appendChild(game.element);

},{"./game/game.js":5,"./util.js":7}],2:[function(require,module,exports){
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

},{"../util.js":7,"./colors.js":3}],3:[function(require,module,exports){
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

    this.game.updateChainSum(0);
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
    ctx.strokeStyle = 'blue';

    console.log('start');

    this.selectedBlocks.forEach(function(id, i) {
        var block = this.blocks[id];
        var x = (block.x + 0.5) * block.width;
        var y = gameConfig.field.height - (block.y + 0.5) * block.height;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        console.log(x, y);

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
    if (this.selectedBlocks.length < config.chain.minLength) { return; }

    this.game.updateScore(this._calcUpdateScore());
    this._clearPath();

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

},{"../gameConfig":6,"../util":7,"./block.js":2}],5:[function(require,module,exports){
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

Game.prototype.updateChainSum = function(value) {
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

},{"../util":7,"./field.js":4}],6:[function(require,module,exports){
module.exports = {
    field: {
        width: 500,
        height: 500
    }
};

},{}],7:[function(require,module,exports){
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


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvaW5kZXguanMiLCJzcmMvanMvZ2FtZS9ibG9jay5qcyIsInNyYy9qcy9nYW1lL2NvbG9ycy5qcyIsInNyYy9qcy9nYW1lL2ZpZWxkLmpzIiwic3JjL2pzL2dhbWUvZ2FtZS5qcyIsInNyYy9qcy9nYW1lQ29uZmlnLmpzIiwic3JjL2pzL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgR2FtZSA9IHJlcXVpcmUoJy4vZ2FtZS9nYW1lLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG5pZiAoIXV0aWwuaXNNb2JpbGUpIHtcbiAgICB1dGlsLmFkZENsYXNzKGRvY3VtZW50LmJvZHksICduby10b3VjaCcpO1xufVxuXG52YXIgZ2FtZSA9IG5ldyBHYW1lKCk7XG5cbnZhciBodG1sID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dhbWUnKTtcblxuaHRtbC5hcHBlbmRDaGlsZChnYW1lLmVsZW1lbnQpO1xuIiwidmFyIGNvbG9ycyA9IHJlcXVpcmUoJy4vY29sb3JzLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcblxudmFyIHByaW1lTnVtYmVycyA9IFsxLCAyLCAzLCA1LCA3LCAxMSwgMTNdO1xuXG52YXIgaWRDb3VudGVyID0gMDtcblxuZnVuY3Rpb24gQmxvY2soeCwgeSwgZmllbGQpIHtcbiAgICB0aGlzLmlkID0gKytpZENvdW50ZXI7XG5cbiAgICB0aGlzLmZpZWxkID0gZmllbGQ7XG5cbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG5cbiAgICB0aGlzLnZhbHVlID0gbnVsbDtcbiAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuXG4gICAgdGhpcy53aWR0aCA9IDUwMCAvIGNvbmZpZy5maWVsZC5zaXplWzBdO1xuICAgIHRoaXMuaGVpZ2h0ID0gNTAwIC8gY29uZmlnLmZpZWxkLnNpemVbMV07XG5cbiAgICB0aGlzLl9zZXRSYW5kb21WYWx1ZSgpO1xuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbiAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XG59XG5cbkJsb2NrLnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFRPRE86INCy0LrQu9GO0YfQuNGC0Ywg0L/RgNC+0YHRgtC+0Lkg0YjQsNCx0LvQvtC90LjQt9Cw0YLQvtGAXG5cbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2Jsb2NrJztcbiAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1pZCcsIHRoaXMuaWQpO1xuXG4gICAgZWxlbWVudC5zdHlsZS5sZWZ0ID0gTWF0aC5mbG9vcih0aGlzLnggKiB0aGlzLndpZHRoKSArICdweCc7XG4gICAgZWxlbWVudC5zdHlsZS5ib3R0b20gPSBNYXRoLmZsb29yKHRoaXMueSAqIHRoaXMuaGVpZ2h0KSArICdweCc7XG5cbiAgICB2YXIgaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBpbm5lci5jbGFzc05hbWUgPSAnYmxvY2tfX2lubmVyJztcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGlubmVyKTtcblxuICAgIHZhciBhY3RpdmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBhY3RpdmUuY2xhc3NOYW1lID0gJ2Jsb2NrX19hY3RpdmUnO1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoYWN0aXZlKTtcblxuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGV4dC5jbGFzc05hbWUgPSAnYmxvY2tfX3RleHQnO1xuICAgIHRleHQuaW5uZXJIVE1MID0gdGhpcy52YWx1ZTtcbiAgICBpbm5lci5hcHBlbmRDaGlsZCh0ZXh0KTtcblxuICAgIHRoaXMuaW5uZXJFbGVtZW50ID0gaW5uZXI7XG4gICAgdGhpcy50ZXh0RWxlbWVudCA9IHRleHQ7XG4gICAgdGhpcy5hY3RpdmVFbGVtZW50ID0gYWN0aXZlO1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cbiAgICB0aGlzLl91cGRhdGVDb2xvcnMoKTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5fc2V0UmFuZG9tVmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3VtbVJhdGlvbiA9IDA7XG4gICAgdmFyIHBvc3NpYmxlVmFsdWVzID0gY29uZmlnLm51bWJlcnMucG9zc2libGVWYWx1ZXM7XG5cbiAgICBwb3NzaWJsZVZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgIHN1bW1SYXRpb24gKz0gZWxbMV07XG4gICAgfSk7XG5cbiAgICB2YXIgc3VtbSA9IDA7XG5cbiAgICB2YXIgY2hhbmNlQXJyYXkgPSBwb3NzaWJsZVZhbHVlcy5tYXAoZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgdmFyIHZhbCA9IGVsWzFdIC8gc3VtbVJhdGlvbiArIHN1bW07XG5cbiAgICAgICAgc3VtbSArPSB2YWw7XG5cbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9KTtcblxuICAgIHZhciByb2xsID0gTWF0aC5yYW5kb20oKTtcblxuICAgIHZhciB2YWx1ZSA9IDA7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoYW5jZUFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChyb2xsIDw9IGNoYW5jZUFycmF5W2ldKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHBvc3NpYmxlVmFsdWVzW2ldWzBdO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuX2JpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodXRpbC5pc01vYmlsZSkge1xuICAgICAgICB1dGlsLm9uKHRoaXMuZWxlbWVudCwgJ3RvdWNoc3RhcnQnLCB0aGlzLl9tb3VzZURvd25IYW5kbGVyLmJpbmQodGhpcykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHV0aWwub24odGhpcy5lbGVtZW50LCAnbW91c2Vkb3duJywgdGhpcy5fbW91c2VEb3duSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICAgICAgdXRpbC5vbih0aGlzLmFjdGl2ZUVsZW1lbnQsICdtb3VzZW92ZXInLCB0aGlzLl9tb3VzZU92ZXJIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgICAgICAvL3V0aWwub24odGhpcy5hY3RpdmVFbGVtZW50LCAnbW91c2VvdXQnLCB0aGlzLl9tb3VzZU91dEhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgfVxufTtcblxuQmxvY2sucHJvdG90eXBlLl90b3VjaE1vdmVIYW5kbGVyID0gZnVuY3Rpb24oZXYpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV2LmNoYW5nZWRUb3VjaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB0b3VjaCA9IGV2LmNoYW5nZWRUb3VjaGVzW2ldO1xuICAgICAgICB2YXIgdGFyZ2V0ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh0b3VjaC5jbGllbnRYLCB0b3VjaC5jbGllbnRZKTtcblxuICAgICAgICBpZiAodGhpcy5hY3RpdmVFbGVtZW50ID09PSB0YXJnZXQpIHtcbiAgICAgICAgICAgIHRoaXMuZmllbGQuYmxvY2tNb3VzZURvd24odGhpcy5pZCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5CbG9jay5wcm90b3R5cGUuX21vdXNlRG93bkhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmZpZWxkLmJsb2NrTW91c2VEb3duKHRoaXMuaWQpO1xufTtcblxuXG5CbG9jay5wcm90b3R5cGUuX21vdXNlT3ZlckhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmZpZWxkLmJsb2NrTW91c2VPdmVyKHRoaXMuaWQpO1xufTtcblxuXG5CbG9jay5wcm90b3R5cGUuX21vdXNlT3V0SGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZmllbGQuYmxvY2tNb3VzZU91dCh0aGlzLmlkKTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5jaGFuZ2VQb3NpdGlvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG5cbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUubGVmdCA9IE1hdGguZmxvb3IoeCAqIHRoaXMud2lkdGgpICsgJ3B4JztcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUuYm90dG9tID0gTWF0aC5mbG9vcih5ICogdGhpcy5oZWlnaHQpICsgJ3B4Jztcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5fdXBkYXRlQ29sb3JzID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gNyAtPiAzIChwcmltZU51bWJlciAtPiByYXRpbylcbiAgICB2YXIgcHJpbWVBcnJheSA9IFtdO1xuICAgIHZhciBpO1xuXG4gICAgZm9yIChpID0gcHJpbWVOdW1iZXJzLmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICAgICAgaWYgKHRoaXMudmFsdWUgJSBwcmltZU51bWJlcnNbaV0gPT09IDApIHtcbiAgICAgICAgICAgIHByaW1lQXJyYXkucHVzaCh7XG4gICAgICAgICAgICAgICAgdmFsdWU6IHByaW1lTnVtYmVyc1tpXSxcbiAgICAgICAgICAgICAgICByZ2I6IGNvbG9yc1tpXS5yZ2IsXG4gICAgICAgICAgICAgICAgcmF0aW86IHRoaXMudmFsdWUgLyBwcmltZU51bWJlcnNbaV1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGNvbG9yO1xuXG4gICAgaWYgKHByaW1lQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgIGNvbG9yID0gdXRpbC5yZ2JTdW0ocHJpbWVBcnJheSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29sb3IgPSBjb2xvcnNbMF0ucmdiO1xuICAgIH1cblxuICAgIHRoaXMuaW5uZXJFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZ2IoJyArIGNvbG9yLmpvaW4oJywnKSArICcpJztcbn07XG5cbi8qQmxvY2sucHJvdG90eXBlLl91cGRhdGVDb2xvcnMgPSBmdW5jdGlvbigpIHtcblxuICAgIGZvciAodmFyIGkgPSBwcmltZU51bWJlcnMubGVuZ3RoIC0gMTsgaSA+PTA7IGktLSkge1xuICAgICAgICBpZiAodGhpcy52YWx1ZSAlIHByaW1lTnVtYmVyc1tpXSA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5pbm5lckVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3JnYignICsgY29sb3JzW2ldLnJnYi5qb2luKCcsJykgKyAnKSc7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn07Ki9cblxuQmxvY2sucHJvdG90eXBlLmNoYW5nZVZhbHVlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy50ZXh0RWxlbWVudC5pbm5lckhUTUwgPSB2YWx1ZTtcblxuICAgIHRoaXMuX3VwZGF0ZUNvbG9ycygpO1xufTtcblxuQmxvY2sucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5lbGVtZW50LCAnX3NlbGVjdGVkJyk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUudW5zZWxlY3QgPSBmdW5jdGlvbigpIHtcbiAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuZWxlbWVudCwgJ19zZWxlY3RlZCcpO1xufTtcblxuQmxvY2sucHJvdG90eXBlLmFuaW1hdGVDcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB1dGlsLmFkZENsYXNzKHRoaXMuZWxlbWVudCwgJ19ibGluaycpO1xuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhzZWxmLmVsZW1lbnQsICdfYmxpbmsnKTtcbiAgICB9LCAwKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQmxvY2s7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgICB7XG4gICAgICAgIHdlYjogJyM5OWI0MzMnLFxuICAgICAgICByZ2I6IFsxNTQsIDE4MCwgNTFdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjREE1MzJDJyxcbiAgICAgICAgcmdiOiBbMjE4LCA4MywgNDRdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjMWU3MTQ1JyxcbiAgICAgICAgcmdiOiBbMzAsIDExMywgNjldXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjMkM4OUEwJyxcbiAgICAgICAgcmdiOiBbNDQsIDEzNywgMTYwXVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnIzAwQUE4OCcsXG4gICAgICAgIHJnYjogWzAsIDE3MCwgMTM2XVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnIzAwZDQ1NScsXG4gICAgICAgIHJnYjogWzAsIDIxMiwgODVdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjZmYyYTJhJyxcbiAgICAgICAgcmdiOiBbMjU1LCA0MiwgNDJdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjQ0I1MDAwJyxcbiAgICAgICAgcmdiOiBbMjAzLCA4MCwgMF1cbiAgICB9XG5dO1xuIiwidmFyIEJsb2NrID0gcmVxdWlyZSgnLi9ibG9jay5qcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG52YXIgZ2FtZUNvbmZpZyA9IHJlcXVpcmUoJy4uL2dhbWVDb25maWcnKTtcblxuZnVuY3Rpb24gRmllbGQoZ2FtZSkge1xuICAgIHRoaXMuZ2FtZSA9IGdhbWU7XG5cbiAgICB0aGlzLmJsb2NrcyA9IHt9O1xuICAgIHRoaXMuX2Jsb2Nrc1hZID0ge307XG4gICAgdGhpcy5zaXplID0gY29uZmlnLmZpZWxkLnNpemU7XG5cbiAgICB0aGlzLnNlbGVjdGVkQmxvY2tzID0gW107XG4gICAgdGhpcy5zZWxlY3RlZE1vZGUgPSBmYWxzZTtcblxuICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fY3JlYXRlRWxlbWVudCgpO1xuICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcbn1cblxuRmllbGQucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNpemVbMF07IGkrKykge1xuICAgICAgICB0aGlzLl9ibG9ja3NYWVtpXSA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5zaXplWzFdOyBqKyspIHtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQmxvY2soaSwgaiwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuY3JlYXRlQmxvY2sgPSBmdW5jdGlvbih4LCB5LCBpc0luaXQpIHtcbiAgICB2YXIgYmxvY2sgPSBuZXcgQmxvY2soeCwgeSwgdGhpcyk7XG5cbiAgICB0aGlzLmJsb2Nrc1tibG9jay5pZF0gPSBibG9jaztcblxuICAgIHRoaXMuX2Jsb2Nrc1hZW3hdW3ldID0gYmxvY2suaWQ7XG5cbiAgICBpZiAoIWlzSW5pdCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoYmxvY2suZWxlbWVudCk7XG4gICAgICAgIGJsb2NrLmFuaW1hdGVDcmVhdGUoKTtcbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHRoaXMuY2FudmFzLmNsYXNzTmFtZSA9ICdmaWVsZF9fY2FudmFzJztcblxuICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIHRoaXMuY2FudmFzLndpZHRoID0gZ2FtZUNvbmZpZy5maWVsZC53aWR0aDtcbiAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSBnYW1lQ29uZmlnLmZpZWxkLmhlaWdodDtcbiAgICBmcmFnbWVudC5hcHBlbmRDaGlsZCh0aGlzLmNhbnZhcyk7XG5cbiAgICB1dGlsLmZvckVhY2godGhpcy5ibG9ja3MsIGZ1bmN0aW9uKGJsKSB7XG4gICAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGJsLmVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9ICdmaWVsZCcgK1xuICAgICAgICAnIF93aWR0aF8nICsgdGhpcy5zaXplWzBdICtcbiAgICAgICAgJyBfaGVpZ2h0XycgKyB0aGlzLnNpemVbMV07XG5cbiAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHV0aWwuaXNNb2JpbGUpIHtcbiAgICAgICAgdXRpbC5vbihkb2N1bWVudC5ib2R5LCAndG91Y2hlbmQnLCB0aGlzLl9tb3VzZVVwSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICAgICAgdXRpbC5vbihkb2N1bWVudC5ib2R5LCAndG91Y2htb3ZlJywgdGhpcy5fdG91Y2hNb3ZlSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1dGlsLm9uKGRvY3VtZW50LmJvZHksICdtb3VzZXVwJywgdGhpcy5fbW91c2VVcEhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLl90b3VjaE1vdmVIYW5kbGVyID0gZnVuY3Rpb24oZXYpIHtcbiAgICB2YXIgaXNCcmVhaywgYmxvY2ssIGtleXMsdG91Y2gsIHRhcmdldCwgaSwgajtcbiAgICB2YXIgYmxvY2tzID0gdGhpcy5ibG9ja3M7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgZXYuY2hhbmdlZFRvdWNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdG91Y2ggPSBldi5jaGFuZ2VkVG91Y2hlc1tpXTtcbiAgICAgICAgdGFyZ2V0ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh0b3VjaC5jbGllbnRYLCB0b3VjaC5jbGllbnRZKTtcblxuICAgICAgICBpZiAodGFyZ2V0LmNsYXNzTmFtZS5pbmRleE9mKCdibG9ja19fYWN0aXZlJykgPT0gLTEpIHsgY29udGludWU7IH1cblxuICAgICAgICAvLyDQtNC10LvQsNC10LwgZm9yLCDQsCDQvdC1IGZvckVhY2gsINGH0YLQvtCx0Ysg0LzQvtC20L3QviDQsdGL0LvQviDRgdGC0L7Qv9C90YPRgtGMXG4gICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyhibG9ja3MpO1xuXG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBrZXlzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBibG9jayA9IGJsb2Nrc1trZXlzW2pdXTtcblxuICAgICAgICAgICAgaWYgKGJsb2NrLmFjdGl2ZUVsZW1lbnQgPT09IHRhcmdldCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYmxvY2tNb3VzZU92ZXIoYmxvY2suaWQpO1xuICAgICAgICAgICAgICAgIGlzQnJlYWsgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzQnJlYWspIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLl9tb3VzZVVwSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5zZWxlY3RlZE1vZGUpIHsgcmV0dXJuOyB9XG5cbiAgICB0aGlzLnNlbGVjdGVkTW9kZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5fcnVuU2VsZWN0ZWQoKTtcblxuICAgIHV0aWwuZm9yRWFjaCh0aGlzLmJsb2NrcywgZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgICAgYmxvY2sudW5zZWxlY3QoKTtcbiAgICB9KTtcblxuICAgIHRoaXMuZ2FtZS51cGRhdGVDaGFpblN1bSgwKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5ibG9ja01vdXNlRG93biA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdGhpcy5zZWxlY3RlZE1vZGUgPSB0cnVlO1xuICAgIHRoaXMuc2VsZWN0ZWRCbG9ja3MgPSBbaWRdO1xuXG4gICAgdGhpcy5ibG9ja3NbaWRdLnNlbGVjdCgpO1xuXG4gICAgdGhpcy5nYW1lLnVwZGF0ZUNoYWluU3VtKHRoaXMuX2NhbGNDaGFpblN1bSgpKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY2hlY2tXaXRoTGFzdCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGxhc3RCbCA9IHRoaXMuYmxvY2tzW3RoaXMuc2VsZWN0ZWRCbG9ja3NbdGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggLSAxXV07XG4gICAgdmFyIG5ld0JsID0gdGhpcy5ibG9ja3NbaWRdO1xuXG4gICAgcmV0dXJuIGxhc3RCbC52YWx1ZSA9PSBuZXdCbC52YWx1ZSAmJlxuICAgICAgICBNYXRoLmFicyhsYXN0QmwueCAtIG5ld0JsLngpIDw9IDEgJiZcbiAgICAgICAgTWF0aC5hYnMobGFzdEJsLnkgLSBuZXdCbC55KSA8PSAxO1xufTtcblxuRmllbGQucHJvdG90eXBlLmJsb2NrTW91c2VPdmVyID0gZnVuY3Rpb24oaWQpIHtcbiAgICBpZiAoIXRoaXMuc2VsZWN0ZWRNb2RlKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIHNlbEJsb2NrcyA9IHRoaXMuc2VsZWN0ZWRCbG9ja3M7XG5cbiAgICBpZiAoc2VsQmxvY2tzLmluZGV4T2YoaWQpID09IC0xKSB7XG4gICAgICAgIGlmICh0aGlzLl9jaGVja1dpdGhMYXN0KGlkKSkge1xuICAgICAgICAgICAgc2VsQmxvY2tzLnB1c2goaWQpO1xuICAgICAgICAgICAgdGhpcy5ibG9ja3NbaWRdLnNlbGVjdCgpO1xuXG4gICAgICAgICAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW0odGhpcy5fY2FsY0NoYWluU3VtKCkpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlUGF0aCgpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHNlbEJsb2Nrc1tzZWxCbG9ja3MubGVuZ3RoIC0gMl0gPT0gaWQpIHtcbiAgICAgICAgICAgIHZhciBsYXN0QmxJZCA9IHNlbEJsb2Nrcy5wb3AoKTtcbiAgICAgICAgICAgIHRoaXMuYmxvY2tzW2xhc3RCbElkXS51bnNlbGVjdCgpO1xuXG4gICAgICAgICAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW0odGhpcy5fY2FsY0NoYWluU3VtKCkpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlUGF0aCgpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLl91cGRhdGVQYXRoID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGN0eCA9IHRoaXMuY3R4O1xuXG4gICAgdGhpcy5fY2xlYXJQYXRoKCk7XG5cbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4LnN0cm9rZVN0eWxlID0gJ2JsdWUnO1xuXG4gICAgY29uc29sZS5sb2coJ3N0YXJ0Jyk7XG5cbiAgICB0aGlzLnNlbGVjdGVkQmxvY2tzLmZvckVhY2goZnVuY3Rpb24oaWQsIGkpIHtcbiAgICAgICAgdmFyIGJsb2NrID0gdGhpcy5ibG9ja3NbaWRdO1xuICAgICAgICB2YXIgeCA9IChibG9jay54ICsgMC41KSAqIGJsb2NrLndpZHRoO1xuICAgICAgICB2YXIgeSA9IGdhbWVDb25maWcuZmllbGQuaGVpZ2h0IC0gKGJsb2NrLnkgKyAwLjUpICogYmxvY2suaGVpZ2h0O1xuXG4gICAgICAgIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgICBjdHgubW92ZVRvKHgsIHkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3R4LmxpbmVUbyh4LCB5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKHgsIHkpO1xuXG4gICAgfSwgdGhpcyk7XG5cbiAgICBjdHguc3Ryb2tlKCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2NsZWFyUGF0aCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCBnYW1lQ29uZmlnLmZpZWxkLndpZHRoLCBnYW1lQ29uZmlnLmZpZWxkLmhlaWdodCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuYmxvY2tNb3VzZU91dCA9IGZ1bmN0aW9uKGlkKSB7XG5cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY2FsY0NoYWluU3VtID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZhbHVlID0gdGhpcy5ibG9ja3NbdGhpcy5zZWxlY3RlZEJsb2Nrc1swXV0udmFsdWUgfHwgMDtcblxuICAgIHJldHVybiB2YWx1ZSAqIHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9jYWxjVXBkYXRlU2NvcmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLmJsb2Nrc1t0aGlzLnNlbGVjdGVkQmxvY2tzWzBdXS52YWx1ZTtcblxuICAgIHZhciBrID0gMSArIDAuMiAqICh0aGlzLnNlbGVjdGVkQmxvY2tzLmxlbmd0aCAtIDMpO1xuXG4gICAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgKiB0aGlzLnNlbGVjdGVkQmxvY2tzLmxlbmd0aCAqIGspO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9ibG9ja1JlbW92ZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGJsb2NrID0gdGhpcy5ibG9ja3NbaWRdO1xuXG4gICAgdGhpcy5lbGVtZW50LnJlbW92ZUNoaWxkKGJsb2NrLmVsZW1lbnQpO1xuXG4gICAgdGhpcy5fYmxvY2tzWFlbYmxvY2sueF1bYmxvY2sueV0gPSBudWxsO1xuICAgIGRlbGV0ZSB0aGlzLmJsb2Nrc1tpZF07XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX3J1blNlbGVjdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoIDwgY29uZmlnLmNoYWluLm1pbkxlbmd0aCkgeyByZXR1cm47IH1cblxuICAgIHRoaXMuZ2FtZS51cGRhdGVTY29yZSh0aGlzLl9jYWxjVXBkYXRlU2NvcmUoKSk7XG4gICAgdGhpcy5fY2xlYXJQYXRoKCk7XG5cbiAgICB2YXIgbGFzdEJsSWQgPSB0aGlzLnNlbGVjdGVkQmxvY2tzLnBvcCgpO1xuICAgIHZhciBsYXN0QmwgPSB0aGlzLmJsb2Nrc1tsYXN0QmxJZF07XG4gICAgdmFyIHZhbHVlID0gbGFzdEJsLnZhbHVlICogKHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoICsgMSk7IC8vICsxIGJlY2F1c2UgcG9wIGFib3ZlXG5cbiAgICBsYXN0QmwuY2hhbmdlVmFsdWUodmFsdWUpO1xuXG4gICAgdGhpcy5zZWxlY3RlZEJsb2Nrcy5mb3JFYWNoKHRoaXMuX2Jsb2NrUmVtb3ZlLCB0aGlzKTtcblxuICAgIHRoaXMuX2NoZWNrUG9zaXRpb25zKCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2NoZWNrUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIGJsb2Nrc1hZID0gdGhpcy5fYmxvY2tzWFk7XG4gICAgdmFyIGJsb2NrcyA9IHRoaXMuYmxvY2tzO1xuXG4gICAgdXRpbC5mb3JFYWNoKGJsb2Nrc1hZLCBmdW5jdGlvbihibG9ja3NZKSB7XG4gICAgICAgIHZhciBhcnIgPSBbXTtcblxuICAgICAgICAvLyDQtNC+0LHQsNCy0LvRj9C10Lwg0LIg0LzQsNGB0YHQuNCyINGB0YPRidC10YHRgtCy0YPRjtGJ0LjQtSDQstC10YDRgtC40LrQsNC70YzQvdGL0LUg0Y3Qu9C10LzQtdC90YLRi1xuICAgICAgICB1dGlsLmZvckVhY2goYmxvY2tzWSwgZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIGlmIChpZCkgeyBhcnIucHVzaChpZCk7IH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g0LXRgdC70Lgg0L/QvtC70L3Ri9C5INC40LvQuCDQv9GD0YHRgtC+0LlcbiAgICAgICAgaWYgKGFyci5sZW5ndGggPT0gc2VsZi5zaXplWzFdIHx8ICFhcnIpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgLy8g0YHQvtGA0YLQuNGA0YPQtdC8XG4gICAgICAgIGFyci5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBibG9ja3NbYV0ueSA+IGJsb2Nrc1tiXS55O1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDRgdC00LLQuNCz0LDQtdC8INC+0YLRgdC+0YDRgtC40YDQvtCy0LDQvdC90YvQuSDRgdC/0LjRgdC+0Log0Log0L3QuNC30YNcbiAgICAgICAgYXJyLmZvckVhY2goZnVuY3Rpb24oaWQsIHkpIHtcbiAgICAgICAgICAgIHZhciBibG9jayA9IGJsb2Nrc1tpZF07XG5cbiAgICAgICAgICAgIGlmIChibG9jay55ICE9IHkpIHtcbiAgICAgICAgICAgICAgICBibG9ja3NZW2Jsb2NrLnldID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIGJsb2NrLmNoYW5nZVBvc2l0aW9uKGJsb2NrLngsIHkpO1xuXG4gICAgICAgICAgICAgICAgYmxvY2tzWVt5XSA9IGlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRoaXMuX2FkZE5ld0Jsb2NrcygpO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9hZGROZXdCbG9ja3MgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYmxvY2tzWFkgPSB0aGlzLl9ibG9ja3NYWTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zaXplWzBdOyBpKyspIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLnNpemVbMV07IGorKykge1xuICAgICAgICAgICAgaWYgKCFibG9ja3NYWVtpXVtqXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlQmxvY2soaSwgaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpZWxkO1xuIiwidmFyIEZpZWxkID0gcmVxdWlyZSgnLi9maWVsZC5qcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbmZ1bmN0aW9uIEdhbWUoKSB7XG4gICAgdGhpcy5maWVsZCA9IG5ldyBGaWVsZCh0aGlzKTtcbiAgICB0aGlzLnNjb3JlID0gMDtcblxuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbn1cblxuR2FtZS5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2dhbWUnO1xuXG4gICAgdmFyIGdhbWVIZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBnYW1lSGVhZGVyLmNsYXNzTmFtZSA9ICdnYW1lX19oZWFkZXInO1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoZ2FtZUhlYWRlcik7XG5cbiAgICB2YXIgc2NvcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBzY29yZS5jbGFzc05hbWUgPSAnZ2FtZV9fc2NvcmUnO1xuICAgIHNjb3JlLmlubmVySFRNTCA9ICcwJztcbiAgICBnYW1lSGVhZGVyLmFwcGVuZENoaWxkKHNjb3JlKTtcblxuICAgIHZhciBjaGFpblN1bW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjaGFpblN1bW0uY2xhc3NOYW1lID0gJ2dhbWVfX2NoYWluU3VtbSc7XG4gICAgZ2FtZUhlYWRlci5hcHBlbmRDaGlsZChjaGFpblN1bW0pO1xuXG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmZpZWxkLmVsZW1lbnQpO1xuXG4gICAgdGhpcy5zY29yZUVsZW1lbnQgPSBzY29yZTtcbiAgICB0aGlzLmNoYWluU3VtbUVsZW1lbnQgPSBjaGFpblN1bW07XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbn07XG5cbkdhbWUucHJvdG90eXBlLnVwZGF0ZUNoYWluU3VtID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy5jaGFpblN1bW1FbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuICAgICAgICB1dGlsLmFkZENsYXNzKHRoaXMuY2hhaW5TdW1tRWxlbWVudCwgJ19zaG93ZWQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuY2hhaW5TdW1tRWxlbWVudCwgJ19zaG93ZWQnKTtcbiAgICB9XG59O1xuXG5HYW1lLnByb3RvdHlwZS51cGRhdGVTY29yZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdGhpcy5zY29yZSArPSB2YWx1ZTtcbiAgICB0aGlzLnNjb3JlRWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLnNjb3JlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBHYW1lO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZmllbGQ6IHtcbiAgICAgICAgd2lkdGg6IDUwMCxcbiAgICAgICAgaGVpZ2h0OiA1MDBcbiAgICB9XG59O1xuIiwidmFyIHV0aWwgPSB7fTtcblxudXRpbC5hZGRDbGFzcyA9IGZ1bmN0aW9uKGVsLCBuYW1lKSB7XG4gICAgdmFyIGNsYXNzTmFtZXMgPSBlbC5jbGFzc05hbWUuc3BsaXQoJyAnKTtcbiAgICB2YXIgaW5kZXggPSBjbGFzc05hbWVzLmluZGV4T2YobmFtZSk7XG5cbiAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgIGNsYXNzTmFtZXMucHVzaChuYW1lKTtcbiAgICAgICAgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lcy5qb2luKCcgJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVsO1xufTtcblxudXRpbC5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKGVsLCBuYW1lKSB7XG4gICAgdmFyIGNsYXNzTmFtZXMgPSBlbC5jbGFzc05hbWUuc3BsaXQoJyAnKTtcbiAgICB2YXIgaW5kZXggPSBjbGFzc05hbWVzLmluZGV4T2YobmFtZSk7XG5cbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgIGNsYXNzTmFtZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lcy5qb2luKCcgJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVsO1xufTtcblxudXRpbC5oYXNDbGFzcyA9IGZ1bmN0aW9uKGVsLCBuYW1lKSB7XG4gICAgdmFyIGNsYXNzTmFtZXMgPSBlbC5jbGFzc05hbWUuc3BsaXQoJyAnKTtcblxuICAgIHJldHVybiBjbGFzc05hbWVzLmluZGV4T2YobmFtZSkgIT0gLTE7XG59O1xuXG51dGlsLmZvckVhY2ggPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKG9iai5sZW5ndGgpIHtcbiAgICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2tleV0sIGtleSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbnV0aWwub24gPSBmdW5jdGlvbihub2RlLCB0eXBlLCBjYWxsYmFjaykge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBjYWxsYmFjayk7XG59O1xuXG51dGlsLm9mZiA9IGZ1bmN0aW9uKG5vZGUsIHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGNhbGxiYWNrKTtcbn07XG5cblxuLy8gU2VlbSBsZWdpdFxudmFyIGlzTW9iaWxlID0gKCdEZXZpY2VPcmllbnRhdGlvbkV2ZW50JyBpbiB3aW5kb3cgfHwgJ29yaWVudGF0aW9uJyBpbiB3aW5kb3cpO1xuLy8gQnV0IHdpdGggbXkgQ2hyb21lIG9uIHdpbmRvd3MsIERldmljZU9yaWVudGF0aW9uRXZlbnQgPT0gZmN0KClcbmlmICgvV2luZG93cyBOVHxNYWNpbnRvc2h8TWFjIE9TIFh8TGludXgvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSBpc01vYmlsZSA9IGZhbHNlO1xuLy8gTXkgYW5kcm9pZCBoYXZlIFwibGludXhcIiB0b29cbmlmICgvTW9iaWxlL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkgaXNNb2JpbGUgPSB0cnVlO1xuXG51dGlsLmlzTW9iaWxlID0gaXNNb2JpbGU7XG5cbnV0aWwucmdiU3VtID0gZnVuY3Rpb24oYXJyKSB7XG4gICAgLy9be3JnYiwgcmF0aW99LCAuLi5dXG5cbiAgICB2YXIgc3VtID0gWzAsIDAsIDBdO1xuICAgIHZhciBuID0gMDtcbiAgICB2YXIgZWwsIGksIGo7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGVsID0gYXJyW2ldO1xuXG4gICAgICAgIGZvciAoaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgICAgICAgIHN1bVtqXSArPSBlbC5yZ2Jbal0gKiBlbC5yYXRpbztcbiAgICAgICAgfVxuXG4gICAgICAgIG4gKz0gZWwucmF0aW87XG4gICAgfVxuXG4gICAgZm9yIChqID0gMDsgaiA8IDM7IGorKykge1xuICAgICAgICBzdW1bal0gPSBNYXRoLmZsb29yKHN1bVtqXSAvIG4pO1xuICAgIH1cblxuICAgIHJldHVybiBzdW07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWw7XG4iXX0=