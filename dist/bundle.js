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
    },
    path: {
        color: 'rgba(255, 255, 255, 0.5)',
        width: 10
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


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvaW5kZXguanMiLCJzcmMvanMvZ2FtZS9ibG9jay5qcyIsInNyYy9qcy9nYW1lL2NvbG9ycy5qcyIsInNyYy9qcy9nYW1lL2ZpZWxkLmpzIiwic3JjL2pzL2dhbWUvZ2FtZS5qcyIsInNyYy9qcy9nYW1lQ29uZmlnLmpzIiwic3JjL2pzL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImJ1bmRsZS5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEdhbWUgPSByZXF1aXJlKCcuL2dhbWUvZ2FtZS5qcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxuaWYgKCF1dGlsLmlzTW9iaWxlKSB7XG4gICAgdXRpbC5hZGRDbGFzcyhkb2N1bWVudC5ib2R5LCAnbm8tdG91Y2gnKTtcbn1cblxudmFyIGdhbWUgPSBuZXcgR2FtZSgpO1xuXG52YXIgaHRtbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdnYW1lJyk7XG5cbmh0bWwuYXBwZW5kQ2hpbGQoZ2FtZS5lbGVtZW50KTtcbiIsInZhciBjb2xvcnMgPSByZXF1aXJlKCcuL2NvbG9ycy5qcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsLmpzJyk7XG5cbnZhciBwcmltZU51bWJlcnMgPSBbMSwgMiwgMywgNSwgNywgMTEsIDEzXTtcblxudmFyIGlkQ291bnRlciA9IDA7XG5cbmZ1bmN0aW9uIEJsb2NrKHgsIHksIGZpZWxkKSB7XG4gICAgdGhpcy5pZCA9ICsraWRDb3VudGVyO1xuXG4gICAgdGhpcy5maWVsZCA9IGZpZWxkO1xuXG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuXG4gICAgdGhpcy52YWx1ZSA9IG51bGw7XG4gICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcblxuICAgIHRoaXMud2lkdGggPSA1MDAgLyBjb25maWcuZmllbGQuc2l6ZVswXTtcbiAgICB0aGlzLmhlaWdodCA9IDUwMCAvIGNvbmZpZy5maWVsZC5zaXplWzFdO1xuXG4gICAgdGhpcy5fc2V0UmFuZG9tVmFsdWUoKTtcbiAgICB0aGlzLl9jcmVhdGVFbGVtZW50KCk7XG4gICAgdGhpcy5fYmluZEV2ZW50cygpO1xufVxuXG5CbG9jay5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBUT0RPOiDQstC60LvRjtGH0LjRgtGMINC/0YDQvtGB0YLQvtC5INGI0LDQsdC70L7QvdC40LfQsNGC0L7RgFxuXG4gICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBlbGVtZW50LmNsYXNzTmFtZSA9ICdibG9jayc7XG4gICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnLCB0aGlzLmlkKTtcblxuICAgIGVsZW1lbnQuc3R5bGUubGVmdCA9IE1hdGguZmxvb3IodGhpcy54ICogdGhpcy53aWR0aCkgKyAncHgnO1xuICAgIGVsZW1lbnQuc3R5bGUuYm90dG9tID0gTWF0aC5mbG9vcih0aGlzLnkgKiB0aGlzLmhlaWdodCkgKyAncHgnO1xuXG4gICAgdmFyIGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgaW5uZXIuY2xhc3NOYW1lID0gJ2Jsb2NrX19pbm5lcic7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChpbm5lcik7XG5cbiAgICB2YXIgYWN0aXZlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgYWN0aXZlLmNsYXNzTmFtZSA9ICdibG9ja19fYWN0aXZlJztcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGFjdGl2ZSk7XG5cbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRleHQuY2xhc3NOYW1lID0gJ2Jsb2NrX190ZXh0JztcbiAgICB0ZXh0LmlubmVySFRNTCA9IHRoaXMudmFsdWU7XG4gICAgaW5uZXIuYXBwZW5kQ2hpbGQodGV4dCk7XG5cbiAgICB0aGlzLmlubmVyRWxlbWVudCA9IGlubmVyO1xuICAgIHRoaXMudGV4dEVsZW1lbnQgPSB0ZXh0O1xuICAgIHRoaXMuYWN0aXZlRWxlbWVudCA9IGFjdGl2ZTtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXG4gICAgdGhpcy5fdXBkYXRlQ29sb3JzKCk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuX3NldFJhbmRvbVZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN1bW1SYXRpb24gPSAwO1xuICAgIHZhciBwb3NzaWJsZVZhbHVlcyA9IGNvbmZpZy5udW1iZXJzLnBvc3NpYmxlVmFsdWVzO1xuXG4gICAgcG9zc2libGVWYWx1ZXMuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuICAgICAgICBzdW1tUmF0aW9uICs9IGVsWzFdO1xuICAgIH0pO1xuXG4gICAgdmFyIHN1bW0gPSAwO1xuXG4gICAgdmFyIGNoYW5jZUFycmF5ID0gcG9zc2libGVWYWx1ZXMubWFwKGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgIHZhciB2YWwgPSBlbFsxXSAvIHN1bW1SYXRpb24gKyBzdW1tO1xuXG4gICAgICAgIHN1bW0gKz0gdmFsO1xuXG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSk7XG5cbiAgICB2YXIgcm9sbCA9IE1hdGgucmFuZG9tKCk7XG5cbiAgICB2YXIgdmFsdWUgPSAwO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGFuY2VBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocm9sbCA8PSBjaGFuY2VBcnJheVtpXSkge1xuICAgICAgICAgICAgdmFsdWUgPSBwb3NzaWJsZVZhbHVlc1tpXVswXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xufTtcblxuQmxvY2sucHJvdG90eXBlLl9iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHV0aWwuaXNNb2JpbGUpIHtcbiAgICAgICAgdXRpbC5vbih0aGlzLmVsZW1lbnQsICd0b3VjaHN0YXJ0JywgdGhpcy5fbW91c2VEb3duSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1dGlsLm9uKHRoaXMuZWxlbWVudCwgJ21vdXNlZG93bicsIHRoaXMuX21vdXNlRG93bkhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgICAgIHV0aWwub24odGhpcy5hY3RpdmVFbGVtZW50LCAnbW91c2VvdmVyJywgdGhpcy5fbW91c2VPdmVySGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICAgICAgLy91dGlsLm9uKHRoaXMuYWN0aXZlRWxlbWVudCwgJ21vdXNlb3V0JywgdGhpcy5fbW91c2VPdXRIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgIH1cbn07XG5cbkJsb2NrLnByb3RvdHlwZS5fdG91Y2hNb3ZlSGFuZGxlciA9IGZ1bmN0aW9uKGV2KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBldi5jaGFuZ2VkVG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdG91Y2ggPSBldi5jaGFuZ2VkVG91Y2hlc1tpXTtcbiAgICAgICAgdmFyIHRhcmdldCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQodG91Y2guY2xpZW50WCwgdG91Y2guY2xpZW50WSk7XG5cbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlRWxlbWVudCA9PT0gdGFyZ2V0KSB7XG4gICAgICAgICAgICB0aGlzLmZpZWxkLmJsb2NrTW91c2VEb3duKHRoaXMuaWQpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuQmxvY2sucHJvdG90eXBlLl9tb3VzZURvd25IYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5maWVsZC5ibG9ja01vdXNlRG93bih0aGlzLmlkKTtcbn07XG5cblxuQmxvY2sucHJvdG90eXBlLl9tb3VzZU92ZXJIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5maWVsZC5ibG9ja01vdXNlT3Zlcih0aGlzLmlkKTtcbn07XG5cblxuQmxvY2sucHJvdG90eXBlLl9tb3VzZU91dEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmZpZWxkLmJsb2NrTW91c2VPdXQodGhpcy5pZCk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuY2hhbmdlUG9zaXRpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuXG4gICAgdGhpcy5lbGVtZW50LnN0eWxlLmxlZnQgPSBNYXRoLmZsb29yKHggKiB0aGlzLndpZHRoKSArICdweCc7XG4gICAgdGhpcy5lbGVtZW50LnN0eWxlLmJvdHRvbSA9IE1hdGguZmxvb3IoeSAqIHRoaXMuaGVpZ2h0KSArICdweCc7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuX3VwZGF0ZUNvbG9ycyA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIDcgLT4gMyAocHJpbWVOdW1iZXIgLT4gcmF0aW8pXG4gICAgdmFyIHByaW1lQXJyYXkgPSBbXTtcbiAgICB2YXIgaTtcblxuICAgIGZvciAoaSA9IHByaW1lTnVtYmVycy5sZW5ndGggLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICAgIGlmICh0aGlzLnZhbHVlICUgcHJpbWVOdW1iZXJzW2ldID09PSAwKSB7XG4gICAgICAgICAgICBwcmltZUFycmF5LnB1c2goe1xuICAgICAgICAgICAgICAgIHZhbHVlOiBwcmltZU51bWJlcnNbaV0sXG4gICAgICAgICAgICAgICAgcmdiOiBjb2xvcnNbaV0ucmdiLFxuICAgICAgICAgICAgICAgIHJhdGlvOiB0aGlzLnZhbHVlIC8gcHJpbWVOdW1iZXJzW2ldXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBjb2xvcjtcblxuICAgIGlmIChwcmltZUFycmF5Lmxlbmd0aCkge1xuICAgICAgICBjb2xvciA9IHV0aWwucmdiU3VtKHByaW1lQXJyYXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbG9yID0gY29sb3JzWzBdLnJnYjtcbiAgICB9XG5cbiAgICB0aGlzLmlubmVyRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncmdiKCcgKyBjb2xvci5qb2luKCcsJykgKyAnKSc7XG59O1xuXG4vKkJsb2NrLnByb3RvdHlwZS5fdXBkYXRlQ29sb3JzID0gZnVuY3Rpb24oKSB7XG5cbiAgICBmb3IgKHZhciBpID0gcHJpbWVOdW1iZXJzLmxlbmd0aCAtIDE7IGkgPj0wOyBpLS0pIHtcbiAgICAgICAgaWYgKHRoaXMudmFsdWUgJSBwcmltZU51bWJlcnNbaV0gPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuaW5uZXJFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZ2IoJyArIGNvbG9yc1tpXS5yZ2Iuam9pbignLCcpICsgJyknO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG59OyovXG5cbkJsb2NrLnByb3RvdHlwZS5jaGFuZ2VWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMudGV4dEVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XG5cbiAgICB0aGlzLl91cGRhdGVDb2xvcnMoKTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbigpIHtcbiAgICB1dGlsLmFkZENsYXNzKHRoaXMuZWxlbWVudCwgJ19zZWxlY3RlZCcpO1xufTtcblxuQmxvY2sucHJvdG90eXBlLnVuc2VsZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5yZW1vdmVDbGFzcyh0aGlzLmVsZW1lbnQsICdfc2VsZWN0ZWQnKTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5hbmltYXRlQ3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdXRpbC5hZGRDbGFzcyh0aGlzLmVsZW1lbnQsICdfYmxpbmsnKTtcblxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3Moc2VsZi5lbGVtZW50LCAnX2JsaW5rJyk7XG4gICAgfSwgMCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJsb2NrO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG4gICAge1xuICAgICAgICB3ZWI6ICcjOTliNDMzJyxcbiAgICAgICAgcmdiOiBbMTU0LCAxODAsIDUxXVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnI0RBNTMyQycsXG4gICAgICAgIHJnYjogWzIxOCwgODMsIDQ0XVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnIzFlNzE0NScsXG4gICAgICAgIHJnYjogWzMwLCAxMTMsIDY5XVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnIzJDODlBMCcsXG4gICAgICAgIHJnYjogWzQ0LCAxMzcsIDE2MF1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyMwMEFBODgnLFxuICAgICAgICByZ2I6IFswLCAxNzAsIDEzNl1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyMwMGQ0NTUnLFxuICAgICAgICByZ2I6IFswLCAyMTIsIDg1XVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnI2ZmMmEyYScsXG4gICAgICAgIHJnYjogWzI1NSwgNDIsIDQyXVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnI0NCNTAwMCcsXG4gICAgICAgIHJnYjogWzIwMywgODAsIDBdXG4gICAgfVxuXTtcbiIsInZhciBCbG9jayA9IHJlcXVpcmUoJy4vYmxvY2suanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xudmFyIGdhbWVDb25maWcgPSByZXF1aXJlKCcuLi9nYW1lQ29uZmlnJyk7XG5cbmZ1bmN0aW9uIEZpZWxkKGdhbWUpIHtcbiAgICB0aGlzLmdhbWUgPSBnYW1lO1xuXG4gICAgdGhpcy5ibG9ja3MgPSB7fTtcbiAgICB0aGlzLl9ibG9ja3NYWSA9IHt9O1xuICAgIHRoaXMuc2l6ZSA9IGNvbmZpZy5maWVsZC5zaXplO1xuXG4gICAgdGhpcy5zZWxlY3RlZEJsb2NrcyA9IFtdO1xuICAgIHRoaXMuc2VsZWN0ZWRNb2RlID0gZmFsc2U7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbiAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XG59XG5cbkZpZWxkLnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zaXplWzBdOyBpKyspIHtcbiAgICAgICAgdGhpcy5fYmxvY2tzWFlbaV0gPSB7fTtcblxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuc2l6ZVsxXTsgaisrKSB7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUJsb2NrKGksIGosIHRydWUpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLmNyZWF0ZUJsb2NrID0gZnVuY3Rpb24oeCwgeSwgaXNJbml0KSB7XG4gICAgdmFyIGJsb2NrID0gbmV3IEJsb2NrKHgsIHksIHRoaXMpO1xuXG4gICAgdGhpcy5ibG9ja3NbYmxvY2suaWRdID0gYmxvY2s7XG5cbiAgICB0aGlzLl9ibG9ja3NYWVt4XVt5XSA9IGJsb2NrLmlkO1xuXG4gICAgaWYgKCFpc0luaXQpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGJsb2NrLmVsZW1lbnQpO1xuICAgICAgICBibG9jay5hbmltYXRlQ3JlYXRlKCk7XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLl9jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB0aGlzLmNhbnZhcy5jbGFzc05hbWUgPSAnZmllbGRfX2NhbnZhcyc7XG5cbiAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICB0aGlzLmNhbnZhcy53aWR0aCA9IGdhbWVDb25maWcuZmllbGQud2lkdGg7XG4gICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gZ2FtZUNvbmZpZy5maWVsZC5oZWlnaHQ7XG4gICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQodGhpcy5jYW52YXMpO1xuXG4gICAgdXRpbC5mb3JFYWNoKHRoaXMuYmxvY2tzLCBmdW5jdGlvbihibCkge1xuICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChibC5lbGVtZW50KTtcbiAgICB9KTtcblxuICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSAnZmllbGQnICtcbiAgICAgICAgJyBfd2lkdGhfJyArIHRoaXMuc2l6ZVswXSArXG4gICAgICAgICcgX2hlaWdodF8nICsgdGhpcy5zaXplWzFdO1xuXG4gICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGZyYWdtZW50KTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fYmluZEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh1dGlsLmlzTW9iaWxlKSB7XG4gICAgICAgIHV0aWwub24oZG9jdW1lbnQuYm9keSwgJ3RvdWNoZW5kJywgdGhpcy5fbW91c2VVcEhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgICAgIHV0aWwub24oZG9jdW1lbnQuYm9keSwgJ3RvdWNobW92ZScsIHRoaXMuX3RvdWNoTW92ZUhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXRpbC5vbihkb2N1bWVudC5ib2R5LCAnbW91c2V1cCcsIHRoaXMuX21vdXNlVXBIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgIH1cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fdG91Y2hNb3ZlSGFuZGxlciA9IGZ1bmN0aW9uKGV2KSB7XG4gICAgdmFyIGlzQnJlYWssIGJsb2NrLCBrZXlzLHRvdWNoLCB0YXJnZXQsIGksIGo7XG4gICAgdmFyIGJsb2NrcyA9IHRoaXMuYmxvY2tzO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGV2LmNoYW5nZWRUb3VjaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRvdWNoID0gZXYuY2hhbmdlZFRvdWNoZXNbaV07XG4gICAgICAgIHRhcmdldCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQodG91Y2guY2xpZW50WCwgdG91Y2guY2xpZW50WSk7XG5cbiAgICAgICAgaWYgKHRhcmdldC5jbGFzc05hbWUuaW5kZXhPZignYmxvY2tfX2FjdGl2ZScpID09IC0xKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgLy8g0LTQtdC70LDQtdC8IGZvciwg0LAg0L3QtSBmb3JFYWNoLCDRh9GC0L7QsdGLINC80L7QttC90L4g0LHRi9C70L4g0YHRgtC+0L/QvdGD0YLRjFxuICAgICAgICBrZXlzID0gT2JqZWN0LmtleXMoYmxvY2tzKTtcblxuICAgICAgICBmb3IgKGogPSAwOyBqIDwga2V5cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgYmxvY2sgPSBibG9ja3Nba2V5c1tqXV07XG5cbiAgICAgICAgICAgIGlmIChibG9jay5hY3RpdmVFbGVtZW50ID09PSB0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJsb2NrTW91c2VPdmVyKGJsb2NrLmlkKTtcbiAgICAgICAgICAgICAgICBpc0JyZWFrID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0JyZWFrKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fbW91c2VVcEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuc2VsZWN0ZWRNb2RlKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5zZWxlY3RlZE1vZGUgPSBmYWxzZTtcblxuICAgIHRoaXMuX3J1blNlbGVjdGVkKCk7XG5cbiAgICB1dGlsLmZvckVhY2godGhpcy5ibG9ja3MsIGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgIGJsb2NrLnVuc2VsZWN0KCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW0oMCk7XG5cbiAgICB0aGlzLl9jbGVhclBhdGgoKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5ibG9ja01vdXNlRG93biA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdGhpcy5zZWxlY3RlZE1vZGUgPSB0cnVlO1xuICAgIHRoaXMuc2VsZWN0ZWRCbG9ja3MgPSBbaWRdO1xuXG4gICAgdGhpcy5ibG9ja3NbaWRdLnNlbGVjdCgpO1xuXG4gICAgdGhpcy5nYW1lLnVwZGF0ZUNoYWluU3VtKHRoaXMuX2NhbGNDaGFpblN1bSgpKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY2hlY2tXaXRoTGFzdCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGxhc3RCbCA9IHRoaXMuYmxvY2tzW3RoaXMuc2VsZWN0ZWRCbG9ja3NbdGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggLSAxXV07XG4gICAgdmFyIG5ld0JsID0gdGhpcy5ibG9ja3NbaWRdO1xuXG4gICAgcmV0dXJuIGxhc3RCbC52YWx1ZSA9PSBuZXdCbC52YWx1ZSAmJlxuICAgICAgICBNYXRoLmFicyhsYXN0QmwueCAtIG5ld0JsLngpIDw9IDEgJiZcbiAgICAgICAgTWF0aC5hYnMobGFzdEJsLnkgLSBuZXdCbC55KSA8PSAxO1xufTtcblxuRmllbGQucHJvdG90eXBlLmJsb2NrTW91c2VPdmVyID0gZnVuY3Rpb24oaWQpIHtcbiAgICBpZiAoIXRoaXMuc2VsZWN0ZWRNb2RlKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIHNlbEJsb2NrcyA9IHRoaXMuc2VsZWN0ZWRCbG9ja3M7XG5cbiAgICBpZiAoc2VsQmxvY2tzLmluZGV4T2YoaWQpID09IC0xKSB7XG4gICAgICAgIGlmICh0aGlzLl9jaGVja1dpdGhMYXN0KGlkKSkge1xuICAgICAgICAgICAgc2VsQmxvY2tzLnB1c2goaWQpO1xuICAgICAgICAgICAgdGhpcy5ibG9ja3NbaWRdLnNlbGVjdCgpO1xuXG4gICAgICAgICAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW0odGhpcy5fY2FsY0NoYWluU3VtKCkpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlUGF0aCgpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHNlbEJsb2Nrc1tzZWxCbG9ja3MubGVuZ3RoIC0gMl0gPT0gaWQpIHtcbiAgICAgICAgICAgIHZhciBsYXN0QmxJZCA9IHNlbEJsb2Nrcy5wb3AoKTtcbiAgICAgICAgICAgIHRoaXMuYmxvY2tzW2xhc3RCbElkXS51bnNlbGVjdCgpO1xuXG4gICAgICAgICAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW0odGhpcy5fY2FsY0NoYWluU3VtKCkpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlUGF0aCgpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuRmllbGQucHJvdG90eXBlLl91cGRhdGVQYXRoID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGN0eCA9IHRoaXMuY3R4O1xuXG4gICAgdGhpcy5fY2xlYXJQYXRoKCk7XG5cbiAgICBjdHguYmVnaW5QYXRoKCk7XG5cbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBnYW1lQ29uZmlnLnBhdGguY29sb3I7XG4gICAgY3R4LmxpbmVXaWR0aCA9IGdhbWVDb25maWcucGF0aC53aWR0aDtcblxuICAgIHRoaXMuc2VsZWN0ZWRCbG9ja3MuZm9yRWFjaChmdW5jdGlvbihpZCwgaSkge1xuICAgICAgICB2YXIgYmxvY2sgPSB0aGlzLmJsb2Nrc1tpZF07XG4gICAgICAgIHZhciB4ID0gKGJsb2NrLnggKyAwLjUpICogYmxvY2sud2lkdGg7XG4gICAgICAgIHZhciB5ID0gZ2FtZUNvbmZpZy5maWVsZC5oZWlnaHQgLSAoYmxvY2sueSArIDAuNSkgKiBibG9jay5oZWlnaHQ7XG5cbiAgICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAgIGN0eC5tb3ZlVG8oeCwgeSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdHgubGluZVRvKHgsIHkpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coeCwgeSk7XG5cbiAgICB9LCB0aGlzKTtcblxuICAgIGN0eC5zdHJva2UoKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY2xlYXJQYXRoID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIGdhbWVDb25maWcuZmllbGQud2lkdGgsIGdhbWVDb25maWcuZmllbGQuaGVpZ2h0KTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5ibG9ja01vdXNlT3V0ID0gZnVuY3Rpb24oaWQpIHtcblxufTtcblxuRmllbGQucHJvdG90eXBlLl9jYWxjQ2hhaW5TdW0gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLmJsb2Nrc1t0aGlzLnNlbGVjdGVkQmxvY2tzWzBdXS52YWx1ZSB8fCAwO1xuXG4gICAgcmV0dXJuIHZhbHVlICogdGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGg7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2NhbGNVcGRhdGVTY29yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2YWx1ZSA9IHRoaXMuYmxvY2tzW3RoaXMuc2VsZWN0ZWRCbG9ja3NbMF1dLnZhbHVlO1xuXG4gICAgdmFyIGsgPSAxICsgMC4yICogKHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoIC0gMyk7XG5cbiAgICByZXR1cm4gTWF0aC5yb3VuZCh2YWx1ZSAqIHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoICogayk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2Jsb2NrUmVtb3ZlID0gZnVuY3Rpb24oaWQpIHtcbiAgICB2YXIgYmxvY2sgPSB0aGlzLmJsb2Nrc1tpZF07XG5cbiAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQ2hpbGQoYmxvY2suZWxlbWVudCk7XG5cbiAgICB0aGlzLl9ibG9ja3NYWVtibG9jay54XVtibG9jay55XSA9IG51bGw7XG4gICAgZGVsZXRlIHRoaXMuYmxvY2tzW2lkXTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fcnVuU2VsZWN0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggPCBjb25maWcuY2hhaW4ubWluTGVuZ3RoKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5nYW1lLnVwZGF0ZVNjb3JlKHRoaXMuX2NhbGNVcGRhdGVTY29yZSgpKTtcblxuICAgIHZhciBsYXN0QmxJZCA9IHRoaXMuc2VsZWN0ZWRCbG9ja3MucG9wKCk7XG4gICAgdmFyIGxhc3RCbCA9IHRoaXMuYmxvY2tzW2xhc3RCbElkXTtcbiAgICB2YXIgdmFsdWUgPSBsYXN0QmwudmFsdWUgKiAodGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggKyAxKTsgLy8gKzEgYmVjYXVzZSBwb3AgYWJvdmVcblxuICAgIGxhc3RCbC5jaGFuZ2VWYWx1ZSh2YWx1ZSk7XG5cbiAgICB0aGlzLnNlbGVjdGVkQmxvY2tzLmZvckVhY2godGhpcy5fYmxvY2tSZW1vdmUsIHRoaXMpO1xuXG4gICAgdGhpcy5fY2hlY2tQb3NpdGlvbnMoKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY2hlY2tQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB2YXIgYmxvY2tzWFkgPSB0aGlzLl9ibG9ja3NYWTtcbiAgICB2YXIgYmxvY2tzID0gdGhpcy5ibG9ja3M7XG5cbiAgICB1dGlsLmZvckVhY2goYmxvY2tzWFksIGZ1bmN0aW9uKGJsb2Nrc1kpIHtcbiAgICAgICAgdmFyIGFyciA9IFtdO1xuXG4gICAgICAgIC8vINC00L7QsdCw0LLQu9GP0LXQvCDQsiDQvNCw0YHRgdC40LIg0YHRg9GJ0LXRgdGC0LLRg9GO0YnQuNC1INCy0LXRgNGC0LjQutCw0LvRjNC90YvQtSDRjdC70LXQvNC10L3RgtGLXG4gICAgICAgIHV0aWwuZm9yRWFjaChibG9ja3NZLCBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgaWYgKGlkKSB7IGFyci5wdXNoKGlkKTsgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyDQtdGB0LvQuCDQv9C+0LvQvdGL0Lkg0LjQu9C4INC/0YPRgdGC0L7QuVxuICAgICAgICBpZiAoYXJyLmxlbmd0aCA9PSBzZWxmLnNpemVbMV0gfHwgIWFycikgeyByZXR1cm47IH1cblxuICAgICAgICAvLyDRgdC+0YDRgtC40YDRg9C10LxcbiAgICAgICAgYXJyLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGJsb2Nrc1thXS55ID4gYmxvY2tzW2JdLnk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vINGB0LTQstC40LPQsNC10Lwg0L7RgtGB0L7RgNGC0LjRgNC+0LLQsNC90L3Ri9C5INGB0L/QuNGB0L7QuiDQuiDQvdC40LfRg1xuICAgICAgICBhcnIuZm9yRWFjaChmdW5jdGlvbihpZCwgeSkge1xuICAgICAgICAgICAgdmFyIGJsb2NrID0gYmxvY2tzW2lkXTtcblxuICAgICAgICAgICAgaWYgKGJsb2NrLnkgIT0geSkge1xuICAgICAgICAgICAgICAgIGJsb2Nrc1lbYmxvY2sueV0gPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgYmxvY2suY2hhbmdlUG9zaXRpb24oYmxvY2sueCwgeSk7XG5cbiAgICAgICAgICAgICAgICBibG9ja3NZW3ldID0gaWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fYWRkTmV3QmxvY2tzKCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2FkZE5ld0Jsb2NrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBibG9ja3NYWSA9IHRoaXMuX2Jsb2Nrc1hZO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNpemVbMF07IGkrKykge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuc2l6ZVsxXTsgaisrKSB7XG4gICAgICAgICAgICBpZiAoIWJsb2Nrc1hZW2ldW2pdKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVCbG9jayhpLCBqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRmllbGQ7XG4iLCJ2YXIgRmllbGQgPSByZXF1aXJlKCcuL2ZpZWxkLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuZnVuY3Rpb24gR2FtZSgpIHtcbiAgICB0aGlzLmZpZWxkID0gbmV3IEZpZWxkKHRoaXMpO1xuICAgIHRoaXMuc2NvcmUgPSAwO1xuXG4gICAgdGhpcy5fY3JlYXRlRWxlbWVudCgpO1xufVxuXG5HYW1lLnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWxlbWVudC5jbGFzc05hbWUgPSAnZ2FtZSc7XG5cbiAgICB2YXIgZ2FtZUhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGdhbWVIZWFkZXIuY2xhc3NOYW1lID0gJ2dhbWVfX2hlYWRlcic7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChnYW1lSGVhZGVyKTtcblxuICAgIHZhciBzY29yZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHNjb3JlLmNsYXNzTmFtZSA9ICdnYW1lX19zY29yZSc7XG4gICAgc2NvcmUuaW5uZXJIVE1MID0gJzAnO1xuICAgIGdhbWVIZWFkZXIuYXBwZW5kQ2hpbGQoc2NvcmUpO1xuXG4gICAgdmFyIGNoYWluU3VtbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGNoYWluU3VtbS5jbGFzc05hbWUgPSAnZ2FtZV9fY2hhaW5TdW1tJztcbiAgICBnYW1lSGVhZGVyLmFwcGVuZENoaWxkKGNoYWluU3VtbSk7XG5cbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuZmllbGQuZWxlbWVudCk7XG5cbiAgICB0aGlzLnNjb3JlRWxlbWVudCA9IHNjb3JlO1xuICAgIHRoaXMuY2hhaW5TdW1tRWxlbWVudCA9IGNoYWluU3VtbTtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xufTtcblxuR2FtZS5wcm90b3R5cGUudXBkYXRlQ2hhaW5TdW0gPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgICB0aGlzLmNoYWluU3VtbUVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XG4gICAgICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5jaGFpblN1bW1FbGVtZW50LCAnX3Nob3dlZCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5jaGFpblN1bW1FbGVtZW50LCAnX3Nob3dlZCcpO1xuICAgIH1cbn07XG5cbkdhbWUucHJvdG90eXBlLnVwZGF0ZVNjb3JlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICB0aGlzLnNjb3JlICs9IHZhbHVlO1xuICAgIHRoaXMuc2NvcmVFbGVtZW50LmlubmVySFRNTCA9IHRoaXMuc2NvcmU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWU7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBmaWVsZDoge1xuICAgICAgICB3aWR0aDogNTAwLFxuICAgICAgICBoZWlnaHQ6IDUwMFxuICAgIH0sXG4gICAgcGF0aDoge1xuICAgICAgICBjb2xvcjogJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMC41KScsXG4gICAgICAgIHdpZHRoOiAxMFxuICAgIH1cbn07XG4iLCJ2YXIgdXRpbCA9IHt9O1xuXG51dGlsLmFkZENsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgIHZhciBpbmRleCA9IGNsYXNzTmFtZXMuaW5kZXhPZihuYW1lKTtcblxuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgY2xhc3NOYW1lcy5wdXNoKG5hbWUpO1xuICAgICAgICBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWVzLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWw7XG59O1xuXG51dGlsLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgIHZhciBpbmRleCA9IGNsYXNzTmFtZXMuaW5kZXhPZihuYW1lKTtcblxuICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgY2xhc3NOYW1lcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWVzLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWw7XG59O1xuXG51dGlsLmhhc0NsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuXG4gICAgcmV0dXJuIGNsYXNzTmFtZXMuaW5kZXhPZihuYW1lKSAhPSAtMTtcbn07XG5cbnV0aWwuZm9yRWFjaCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqLmxlbmd0aCkge1xuICAgICAgICBvYmouZm9yRWFjaChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5XSwga2V5KTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxudXRpbC5vbiA9IGZ1bmN0aW9uKG5vZGUsIHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGNhbGxiYWNrKTtcbn07XG5cbnV0aWwub2ZmID0gZnVuY3Rpb24obm9kZSwgdHlwZSwgY2FsbGJhY2spIHtcbiAgICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgY2FsbGJhY2spO1xufTtcblxuXG4vLyBTZWVtIGxlZ2l0XG52YXIgaXNNb2JpbGUgPSAoJ0RldmljZU9yaWVudGF0aW9uRXZlbnQnIGluIHdpbmRvdyB8fCAnb3JpZW50YXRpb24nIGluIHdpbmRvdyk7XG4vLyBCdXQgd2l0aCBteSBDaHJvbWUgb24gd2luZG93cywgRGV2aWNlT3JpZW50YXRpb25FdmVudCA9PSBmY3QoKVxuaWYgKC9XaW5kb3dzIE5UfE1hY2ludG9zaHxNYWMgT1MgWHxMaW51eC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIGlzTW9iaWxlID0gZmFsc2U7XG4vLyBNeSBhbmRyb2lkIGhhdmUgXCJsaW51eFwiIHRvb1xuaWYgKC9Nb2JpbGUvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSBpc01vYmlsZSA9IHRydWU7XG5cbnV0aWwuaXNNb2JpbGUgPSBpc01vYmlsZTtcblxudXRpbC5yZ2JTdW0gPSBmdW5jdGlvbihhcnIpIHtcbiAgICAvL1t7cmdiLCByYXRpb30sIC4uLl1cblxuICAgIHZhciBzdW0gPSBbMCwgMCwgMF07XG4gICAgdmFyIG4gPSAwO1xuICAgIHZhciBlbCwgaSwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZWwgPSBhcnJbaV07XG5cbiAgICAgICAgZm9yIChqID0gMDsgaiA8IDM7IGorKykge1xuICAgICAgICAgICAgc3VtW2pdICs9IGVsLnJnYltqXSAqIGVsLnJhdGlvO1xuICAgICAgICB9XG5cbiAgICAgICAgbiArPSBlbC5yYXRpbztcbiAgICB9XG5cbiAgICBmb3IgKGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICAgIHN1bVtqXSA9IE1hdGguZmxvb3Ioc3VtW2pdIC8gbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1bTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbDtcbiJdfQ==