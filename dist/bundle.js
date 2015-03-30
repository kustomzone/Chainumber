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

},{"./state.js":19,"./util.js":20}],2:[function(require,module,exports){
var Hammer = require('./hammer.js');
var util = require('../util.js');

function Bomb(name, options, abilities) {
    this._targets = [];

    Hammer.call(this, name, options, abilities);
}

Bomb.prototype = Object.create(Hammer.prototype);
Bomb.prototype.constructor = Bomb;

Bomb.prototype._addTarget = function(x, y) {
    var block = this.field.getBlock(x, y);

    if (block) {
        this._targets.push(block);
        util.addClass(block.element, '_targetAbility');
    }
};
Bomb.prototype._removeTargets = function() {
    this._targets.forEach(function(block) {
        util.removeClass(block.element, '_targetAbility');
    });

    this._targets = [];
};

Bomb.prototype._beforeRun = function() {
    var block = this._block,
        x = block.x,
        y = block.y;

    this._addTarget(x, y);

    // up
    this._addTarget(x, y + 1);

    // down
    this._addTarget(x, y - 1);

    // left
    this._addTarget(x - 1, y);

    // right
    this._addTarget(x + 1, y);
};

Bomb.prototype._run = function() {
    this._targets.forEach(function(block) {
        this.field.blockRemove(block.id);
    }, this);

    this.field.checkPositions();
};

Bomb.prototype._afterRun = function() {
    if (!this._block) { return; }

    this._removeTargets();
};

module.exports = Bomb;

},{"../util.js":20,"./hammer.js":3}],3:[function(require,module,exports){
var util = require('../util.js');

function Hammer(name, options, abilities) {
    this.name = name;
    this.abilities = abilities;
    this.field = abilities.game.field;

    this.count = options.count || 0;

    this.element = null;
    this._block = null;

    this.isActive = false;
    this._isMouseDown = false;

    this._createElement();
    this._bindEvents();
    this.updateCount();
}

Hammer.prototype._createElement = function() {
    var element = document.createElement('div');
    element.className = 'ability__' + this.name;

    element.innerHTML = '<div class="ability__border"></div>' +
                        '<div class="ability__count"></div>';


    this.countElement = element.getElementsByClassName('ability__count')[0];
    this.element = element;
};

Hammer.prototype._bindEvents = function() {
    var eventClick = util.isMobile ? 'touchend' : 'click';

    util.on(this.element, eventClick, this._onClickHandler.bind(this));
};

Hammer.prototype._onClickHandler = function() {
    if (this.count == 0) { return; }

    if (!this.isActive) {
        this.abilities.runAbility(this.name);
    } else {
        this.abilities.stopAbility(this.name);
    }
};

Hammer.prototype.updateCount = function() {
    this.countElement.innerHTML = this.count;

    if (this.count == 0) {
        util.addClass(this.element, '_no-count');
    } else {
        util.removeClass(this.element, '_no-count');
    }
};

Hammer.prototype.activate = function() {
    util.addClass(this.element, '_active');

    var startEvent = util.isMobile ? 'touchstart' : 'mousedown';
    var endEvent = util.isMobile ? 'touchend' : 'mouseup';
    var moveEvent = util.isMobile ? 'touchmove' : 'mousemove';

    this._fieldClickHandlerBind = this._fieldClickHandler.bind(this);
    this._fieldMouseDownHandlerBind = this._fieldMouseDownHandler.bind(this);
    this._bodyEndClickBind = this._bodyEndClick.bind(this);
    this._fieldMouseMoveHandlerBind = this._fieldMouseMoveHandler.bind(this);

    util.on(this.field.element, endEvent, this._fieldClickHandlerBind);
    util.on(this.field.element, startEvent, this._fieldMouseDownHandlerBind);
    util.on(document.body, endEvent, this._bodyEndClickBind);
    util.on(this.field.element, moveEvent, this._fieldMouseMoveHandlerBind);

    this.isActive = true;
};

Hammer.prototype.deactivate = function() {
    util.removeClass(this.element, '_active');

    var startEvent = util.isMobile ? 'touchstart' : 'mousedown';
    var endEvent = util.isMobile ? 'touchend' : 'mouseup';
    var moveEvent = util.isMobile ? 'touchmove' : 'mousemove';

    util.off(this.field.element, endEvent, this._fieldClickHandlerBind);
    util.off(this.field.element, startEvent, this._fieldMouseDownHandlerBind);
    util.off(document.body, endEvent, this._bodyEndClickBind);
    util.off(this.field.element, moveEvent, this._fieldMouseMoveHandlerBind);

    this.isActive = false;
};

Hammer.prototype._fieldMouseDownHandler = function(ev) {
    this._isMouseDown = true;

    if (!ev.target || ev.target.className !== 'block__active') { return; }

    var blockId = ev.target.parentNode.getAttribute('data-id');
    var block = this.field.blocks[blockId];

    if (!block) { return; }

    this._block = block;

    this._beforeRun();
};

Hammer.prototype._fieldClickHandler = function() {
    if (!this._block) { return; }

    this._isMouseDown = false;

    this._run();

    this.count--;
    this.updateCount();

    this.abilities.game.saveState();

    this.abilities.stopAbility(this.name);
};

Hammer.prototype._bodyEndClick = function() {
    this._isMouseDown = false;
    this._afterRun();
};

Hammer.prototype._fieldMouseMoveHandler = function(ev) {
    var i, target, touch, blockId;

    if (!this._isMouseDown) { return; }

    if (util.isMobile) {
        for (i = 0; i < ev.changedTouches.length; i++) {
            touch = ev.changedTouches[i];
            target = document.elementFromPoint(touch.clientX, touch.clientY);

            if (!target) { continue; }

            if (target.className === 'block__active') {
                blockId = target.parentNode.getAttribute('data-id');
                break;
            }
        }
    } else {
        target = document.elementFromPoint(ev.clientX, ev.clientY);

        if (!target || target.className !== 'block__active') { return; }

        blockId = target.parentNode.getAttribute('data-id');
    }

    if (!blockId) {
        this._afterRun();
        this._block = null;
        return;
    }

    var block = this.field.blocks[blockId];

    if (!block) { return; }

    this._afterRun();

    this._block = block;

    this._beforeRun();
};

Hammer.prototype._beforeRun = function() {
    util.addClass(this._block.element, '_targetAbility');
};

Hammer.prototype._run = function() {
    this.field.blockRemove(this._block.id);
    this.field.checkPositions();
};

Hammer.prototype._afterRun = function() {
    if (this._block) {
        util.removeClass(this._block.element, '_targetAbility');
    }
};

module.exports = Hammer;

},{"../util.js":20}],4:[function(require,module,exports){
var Hammer = require('./hammer.js');
var util = require('../util.js');

function Lightning(name, options, abilities) {
    this._targets = [];

    Hammer.call(this, name, options, abilities);
}

Lightning.prototype = Object.create(Hammer.prototype);
Lightning.prototype.constructor = Lightning;

Lightning.prototype._beforeRun = function() {
    var value = this._block.value;

    util.forEach(this.field.blocks, function(bl) {
        if (bl.value === value) {
            this._targets.push(bl);
            util.addClass(bl.element, '_targetAbility');
        }
    }, this);
};

Lightning.prototype._run = function() {
    this._targets.forEach(function(block) {
        this.field.blockRemove(block.id);
    }, this);

    this.field.checkPositions();
};

Lightning.prototype._afterRun = function() {
    if (!this._block) { return; }

    this._targets.forEach(function(block) {
        util.removeClass(block.element, '_targetAbility');
    });

    this._targets = [];
};

module.exports = Lightning;

},{"../util.js":20,"./hammer.js":3}],5:[function(require,module,exports){
module.exports = {
    hammer: require('./abilities/hammer.js'),
    bomb: require('./abilities/bomb.js'),
    lightning: require('./abilities/lightning.js')
};

},{"./abilities/bomb.js":2,"./abilities/hammer.js":3,"./abilities/lightning.js":4}],6:[function(require,module,exports){
var abilityModules = require('../abilityModules.js');
var util = require('../util.js');

function Abilities(game, restoreData) {
    restoreData = restoreData || {};

    this.game = game;
    this.config = game.store;

    this.element = null;
    this.isEnable = false;
    this._lastUpAbilityScore = 0;
    this._abilities = {};
    this.currentAbility = null;

    this._initElements();
    this._restoreData(restoreData);
}

Abilities.prototype._initElements = function() {
    var element = document.createElement('div');
    element.className = 'abilities';

    if (this.config.ability) {
        util.forEach(this.config.ability, function(options, name) {
            var ability = new abilityModules[name](name, options, this);

            this._abilities[name] = ability;

            element.appendChild(ability.element);
        }, this);

        this.isEnable = true;
    }

    this.element = element;
};

Abilities.prototype._restoreData = function(data) {
    if (!data) { return; }

    if (data.list) {
        util.forEach(data.list, function(abilityData, name) {
            this._abilities[name].count = abilityData.count || 0;
            this._abilities[name].updateCount();
        }, this);
    }

    this._lastUpAbilityScore = data.lastUpAbilityScore || 0;
};

Abilities.prototype.checkUp = function() {
    if (!this.isEnable) { return; }

    if (this.game.score - this._lastUpAbilityScore < this.config.abilityPerScore) { return; }

    var numberUp = Math.floor((this.game.score - this._lastUpAbilityScore) / this.config.abilityPerScore);

    var randomAbilityName, randomAbility;

    var randomArray = [];

    util.forEach(this.config.ability, function(el, name) {
        randomArray.push([name, el.ratio || 1]);
    });

    for (var i = 0; i < numberUp; i++) {
        randomAbilityName = util.random(randomArray);

        if (!randomAbilityName) { continue; }

        randomAbility = this._abilities[randomAbilityName];
        randomAbility.count++;
        randomAbility.updateCount();
    }

    this._lastUpAbilityScore = this.game.score;

    this.game.saveState();
};

Abilities.prototype.runAbility = function(name) {
    if (this.currentAbility) {
        this._abilities[this.currentAbility].deactivate();
    }

    this._abilities[name].activate();
    this.currentAbility = name;
};

Abilities.prototype.stopAbility = function(name) {
    if (this.currentAbility == name) {
        this._abilities[name].deactivate();
        this.currentAbility = null;
    }
};

Abilities.prototype.getState = function() {
    var state = {};
    state.list = {};

    util.forEach(this._abilities, function(ability, name) {
        state.list[name] = {
            count: ability.count
        };
    });

    state.lastUpAbilityScore = this._lastUpAbilityScore;

    return state;
};

module.exports = Abilities;

},{"../abilityModules.js":5,"../util.js":20}],7:[function(require,module,exports){
var gameConfig = require('../gameConfig.js');
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
    this.game = field.game;

    this.x = x;
    this.y = y;

    this.value = null;
    this.element = null;

    this.fieldHeight = gameConfig.field.height;

    this.width = gameConfig.field.width / this.config.field.size[0];
    this.height = gameConfig.field.height / this.config.field.size[1];

    this.widthText = null;

    this._setRandomValue();
    this._createElement();
    this._bindEvents();
}

Block.prototype._createElement = function() {
    var element = document.createElement('div');
    element.className = 'block';

    element.style.transform = 'translate3d(' +
        Math.floor(this.x * this.width) + 'px,' +
        Math.floor(this.fieldHeight - (this.y + 1) * this.height) + 'px,0)';

    element.setAttribute('data-id', this.id);

    var inner = document.createElement('div');
    inner.className = 'block__inner';
    element.appendChild(inner);

    var border = document.createElement('div');
    border.className = 'block__innerBorder';
    inner.appendChild(border);

    var text = document.createElement('div');
    text.className = 'block__innerText';
    text.innerHTML = this.value;
    inner.appendChild(text);

    var active = document.createElement('div');
    active.className = 'block__active';
    element.appendChild(active);

    this.innerElement = inner;
    this.textElement = text;
    this.activeElement = active;
    this.element = element;

    this._updateColors();
};

Block.prototype._setRandomValue = function() {
    this.value = util.random(this.config.numbers.possibleValues);
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

    if (this.game.abilities.currentAbility) { return; }

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

    this.element.style.transform = 'translate3d(' +
        Math.floor(this.x * this.width) + 'px,' +
        Math.floor(this.fieldHeight - (this.y + 1) * this.height) + 'px,0)';
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

},{"../gameConfig.js":11,"../util.js":20,"./colors.js":8}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

Field.prototype.blockRemove = function(id) {
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

    this.selectedBlocks.forEach(this.blockRemove, this);

    this.checkPositions();

    this.game.saveState();
};

Field.prototype.checkPositions = function() {
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

Field.prototype.getBlock = function(x, y) {
    var rowY = this._blocksXY[x];

    if (!rowY) { return null; }

    var id = rowY[y];

    if (!id) { return null; }

    return this.blocks[id];
};

module.exports = Field;

},{"../gameConfig":11,"../util":20,"./block.js":7}],10:[function(require,module,exports){
var levelStore = require('../levelStore.js');
var Abilities = require('./abilities.js');
var Field = require('./field.js');
var util = require('../util');

function Game(name, state, restoreData) {
    restoreData = restoreData || {};

    this.name = name;
    this.state = state;
    this.store = levelStore.get(name);

    this.score = restoreData.score || 0;

    this.field = new Field(this, restoreData.field);
    this.abilities = new Abilities(this, restoreData.abilities);

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
            '<div class="game__maxScore">Max score: {{maxScore}}</div>' +
            '<div class="game__goal">{{goal}}</div>' +
        '</div>' +
        '<div class="game__body"></div>' +
        '<div class="game__footer">' +
            '<div class="game__abilities"></div>' +
            '<div class="game__buttons">' +
                '<div class="game__backButton">Menu</div>' +
                '<div class="game__restartButton">Restart</div>' +
                '<div class="game__nextButton">Next</div>' +
            '</div>' +
        '</div>';

    element.innerHTML = template
        .replace('{{score}}', this.score)
        .replace('{{goal}}', this._getGoalText())
        .replace('{{name}}', this.name)
        .replace('{{maxScore}}', this.store.maxScore);

    if (this.store.currentGoal > 0) {
        util.addClass(element, '_win');
    }

    this.backButton = element.getElementsByClassName('game__backButton')[0];
    this.restartButton = element.getElementsByClassName('game__restartButton')[0];
    this.nextButton = element.getElementsByClassName('game__nextButton')[0];

    this.abilitiesElement = element.getElementsByClassName('game__abilities')[0];
    this.abilitiesElement.appendChild(this.abilities.element);

    this.goalElement = element.getElementsByClassName('game__goal')[0];
    this.scoreElement = element.getElementsByClassName('game__score')[0];
    this.chainSumElement = element.getElementsByClassName('game__chainSum')[0];
    this.maxScoreElement = element.getElementsByClassName('game__maxScore')[0];

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
    if (this.store.currentGoal <= 3) {
        return this.store.goals[this.store.currentGoal];
    }

    return '';
};

Game.prototype._nextLevel = function() {
    this.state.runLevelMenu();
};

Game.prototype.restart = function() {
    this.score = 0;
    this.scoreElement.innerHTML = 0;

    var newField = new Field(this);
    this.bodyElement.replaceChild(newField.element, this.field.element);
    this.field = newField;

    var newAbilities = new Abilities(this);
    this.abilitiesElement.replaceChild(newAbilities.element, this.abilities.element);
    this.abilities = newAbilities;

    this.saveState();
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

    if (this.store.maxScore < this.score) {
        this.store.maxScore = this.score;
        this.maxScoreElement.innerHTML = 'Max score: ' + this.score;
    }

    this._checkGoal();

    this.abilities.checkUp();

    levelStore.saveLevels();
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
        abilities: this.abilities.getState(),
        name: this.name,
        score: this.score
    };
};

Game.prototype.saveState = function() {
    this.state.saveActiveLevel();
};

module.exports = Game;

},{"../levelStore.js":14,"../util":20,"./abilities.js":6,"./field.js":9}],11:[function(require,module,exports){
module.exports = {
    field: {
        width: 500,
        height: 500
    },
    path: {
        color: 'rgba(255, 255, 255, 0.25)',
        width: 10
    },
    progressBar: {
        width: 490
    },
    levels: [1, 2, 3, 4, 5, 6],
    minOpenLevels: 5
};

},{}],12:[function(require,module,exports){
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
    this._updateProgress();
}

LevelMenu.prototype._createElement = function() {
    var element = document.createElement('div');
    element.className = 'levelMenu';
    element.innerHTML =
        '<div class="levelMenu__header">' +
            '<div class="levelMenu__headerLevels">Levels:</div>' +
        '</div>' +
        '<div class="levelMenu__body">' +
            '<div class="levelMenu__progress">' +
                '<div class="levelMenu__progressBar"></div>' +
                '<div class="levelMenu__progressText"></div>' +
            '</div>' +
            '<div class="levelMenu__levelList"></div>' +
        '</div>' +
        '<div class="levelMenu__footer">' +
            '<div class="levelMenu__backButton">Back</div>' +
        '</div>';

    var list = element.getElementsByClassName('levelMenu__levelList')[0];
    var fragment = document.createDocumentFragment();

    gameConfig.levels.forEach(function(name, i) {
        var level = new Level(this, name, i);

        this.levels[name] = level;

        fragment.appendChild(level.element);
    }, this);

    list.appendChild(fragment);

    this.backButton = element.getElementsByClassName('levelMenu__backButton')[0];
    this.progressBarElement = element.getElementsByClassName('levelMenu__progressBar')[0];
    this.progressTextElement = element.getElementsByClassName('levelMenu__progressText')[0];
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

    this._updateProgress();
};

LevelMenu.prototype.runLevel = function(name) {
    if (levelStore.get(name).isOpen) {
        this.state.runLevel(name);
    }
};

LevelMenu.prototype._updateProgress = function() {
    var length = Object.keys(this.levels).length;
    var goalsCount = 3;
    var sum = 0;

    util.forEach(this.levels, function(level) {
        sum += level.store.currentGoal;
    });

    var progressValue = sum / (length * goalsCount);

    this.progressBarElement.style.width = Math.floor(progressValue * gameConfig.progressBar.width) + 'px';
    this.progressTextElement.innerHTML = Math.floor(progressValue * 100) + '%';
};

module.exports = LevelMenu;

},{"../gameConfig.js":11,"../levelStore.js":14,"../util.js":20}],13:[function(require,module,exports){
module.exports = {
    1: require('./levels/1'),
    2: require('./levels/2'),
    3: require('./levels/2'),
    4: require('./levels/2'),
    5: require('./levels/2'),
    6: require('./levels/2')/*,
    7: require('./levels/2'),
    8: require('./levels/2'),
    9: require('./levels/2')*/
};

},{"./levels/1":15,"./levels/2":16}],14:[function(require,module,exports){
var gameConfig = require('./gameConfig.js');
var saves = require('./saves.js');
var util = require('./util.js');

var levelConfig = config.levels;

var levelStore = {};

var levels = {};

function initLevels() {
    var savedLevels = saves.getLevels();

    gameConfig.levels.forEach(function(name) {
        var level = levelConfig[name];
        level.name = name;

        savedLevels[name] = savedLevels[name] || {};

        level.currentGoal = savedLevels[name].currentGoal || 0;
        level.maxScore = savedLevels[name].maxScore || 0;

        levels[name] = level;
    });

    levelStore.checkOpenLevels();
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

levelStore.saveLevels = function() {
    var dataToSave = {};

    util.forEach(levels, function(level, name) {
        dataToSave[name] = {
            maxScore: level.maxScore,
            currentGoal: level.currentGoal
        }
    });

    saves.setLevels(dataToSave);
};

initLevels();

module.exports = levelStore;

},{"./gameConfig.js":11,"./saves.js":18,"./util.js":20}],15:[function(require,module,exports){
var Game = require('../game/game.js');

function Level(name, state, restoreData) {
    Game.call(this, name, state, restoreData);
}

Level.prototype = Object.create(Game.prototype);
Level.prototype.constructor = Level;

module.exports = Level;

},{"../game/game.js":10}],16:[function(require,module,exports){
var Game = require('../game/game.js');

module.exports = Game;

},{"../game/game.js":10}],17:[function(require,module,exports){
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

},{"../util.js":20}],18:[function(require,module,exports){
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

saves.setAbilities = function(data) {
    setToLocalStorage('abilities', data);
};

saves.getAbilities = function() {
    return getFromLocalStorage('abilities');
};

module.exports = saves;

},{}],19:[function(require,module,exports){
var LevelMenu = require('./levelMenu/levelMenu');
var MainMenu = require('./mainMenu/mainMenu');
var levelModules = require('./levelModules');

var saves = require('./saves');
var util = require('./util');

function State() {
    this._activeElement = null;
    this._activeLevel = null;

    this.levelMenu = new LevelMenu(this);
    this.mainMenu = new MainMenu(this);

    this._createElement();
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

State.prototype.saveActiveLevel = function() {
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
},{"./levelMenu/levelMenu":12,"./levelModules":13,"./mainMenu/mainMenu":17,"./saves":18,"./util":20}],20:[function(require,module,exports){
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

util.on = function(node, type, callback, useCapture) {
    node.addEventListener(type, callback, useCapture);
};

util.off = function(node, type, callback, useCapture) {
    node.removeEventListener(type, callback, useCapture);
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


// get random value from array with relations
// [ [value, ratio], ... ]
util.random = function(array) {
    var sumRation = 0;

    array.forEach(function(el) {
        sumRation += el[1];
    });

    var sum = 0;

    var chanceArray = array.map(function(el) {
        var val = el[1] / sumRation + sum;

        sum = val;

        return val;
    });

    var roll = Math.random();

    var value = 0;

    for (var i = 0; i < chanceArray.length; i++) {
        if (roll <= chanceArray[i]) {
            value = array[i][0];
            break;
        }
    }

    return value;
};

module.exports = util;

},{}]},{},[1])


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvaW5kZXguanMiLCJzcmMvanMvYWJpbGl0aWVzL2JvbWIuanMiLCJzcmMvanMvYWJpbGl0aWVzL2hhbW1lci5qcyIsInNyYy9qcy9hYmlsaXRpZXMvbGlnaHRuaW5nLmpzIiwic3JjL2pzL2FiaWxpdHlNb2R1bGVzLmpzIiwic3JjL2pzL2dhbWUvYWJpbGl0aWVzLmpzIiwic3JjL2pzL2dhbWUvYmxvY2suanMiLCJzcmMvanMvZ2FtZS9jb2xvcnMuanMiLCJzcmMvanMvZ2FtZS9maWVsZC5qcyIsInNyYy9qcy9nYW1lL2dhbWUuanMiLCJzcmMvanMvZ2FtZUNvbmZpZy5qcyIsInNyYy9qcy9sZXZlbE1lbnUvbGV2ZWxNZW51LmpzIiwic3JjL2pzL2xldmVsTW9kdWxlcy5qcyIsInNyYy9qcy9sZXZlbFN0b3JlLmpzIiwic3JjL2pzL2xldmVscy8xLmpzIiwic3JjL2pzL2xldmVscy8yLmpzIiwic3JjL2pzL21haW5NZW51L21haW5NZW51LmpzIiwic3JjL2pzL3NhdmVzLmpzIiwic3JjL2pzL3N0YXRlLmpzIiwic3JjL2pzL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgU3RhdGUgPSByZXF1aXJlKCcuL3N0YXRlLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG5pZiAoIXV0aWwuaXNNb2JpbGUpIHtcbiAgICB1dGlsLmFkZENsYXNzKGRvY3VtZW50LmJvZHksICduby10b3VjaCcpO1xufVxuXG52YXIgaHRtbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdnYW1lJyk7XG5cbnZhciBzdGF0ZSA9IG5ldyBTdGF0ZSgpO1xuXG5odG1sLmFwcGVuZENoaWxkKHN0YXRlLmVsZW1lbnQpO1xuXG5zdGF0ZS5ydW5NYWluTWVudSgpO1xuIiwidmFyIEhhbW1lciA9IHJlcXVpcmUoJy4vaGFtbWVyLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcblxuZnVuY3Rpb24gQm9tYihuYW1lLCBvcHRpb25zLCBhYmlsaXRpZXMpIHtcbiAgICB0aGlzLl90YXJnZXRzID0gW107XG5cbiAgICBIYW1tZXIuY2FsbCh0aGlzLCBuYW1lLCBvcHRpb25zLCBhYmlsaXRpZXMpO1xufVxuXG5Cb21iLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSGFtbWVyLnByb3RvdHlwZSk7XG5Cb21iLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEJvbWI7XG5cbkJvbWIucHJvdG90eXBlLl9hZGRUYXJnZXQgPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdmFyIGJsb2NrID0gdGhpcy5maWVsZC5nZXRCbG9jayh4LCB5KTtcblxuICAgIGlmIChibG9jaykge1xuICAgICAgICB0aGlzLl90YXJnZXRzLnB1c2goYmxvY2spO1xuICAgICAgICB1dGlsLmFkZENsYXNzKGJsb2NrLmVsZW1lbnQsICdfdGFyZ2V0QWJpbGl0eScpO1xuICAgIH1cbn07XG5Cb21iLnByb3RvdHlwZS5fcmVtb3ZlVGFyZ2V0cyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX3RhcmdldHMuZm9yRWFjaChmdW5jdGlvbihibG9jaykge1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKGJsb2NrLmVsZW1lbnQsICdfdGFyZ2V0QWJpbGl0eScpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fdGFyZ2V0cyA9IFtdO1xufTtcblxuQm9tYi5wcm90b3R5cGUuX2JlZm9yZVJ1biA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBibG9jayA9IHRoaXMuX2Jsb2NrLFxuICAgICAgICB4ID0gYmxvY2sueCxcbiAgICAgICAgeSA9IGJsb2NrLnk7XG5cbiAgICB0aGlzLl9hZGRUYXJnZXQoeCwgeSk7XG5cbiAgICAvLyB1cFxuICAgIHRoaXMuX2FkZFRhcmdldCh4LCB5ICsgMSk7XG5cbiAgICAvLyBkb3duXG4gICAgdGhpcy5fYWRkVGFyZ2V0KHgsIHkgLSAxKTtcblxuICAgIC8vIGxlZnRcbiAgICB0aGlzLl9hZGRUYXJnZXQoeCAtIDEsIHkpO1xuXG4gICAgLy8gcmlnaHRcbiAgICB0aGlzLl9hZGRUYXJnZXQoeCArIDEsIHkpO1xufTtcblxuQm9tYi5wcm90b3R5cGUuX3J1biA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX3RhcmdldHMuZm9yRWFjaChmdW5jdGlvbihibG9jaykge1xuICAgICAgICB0aGlzLmZpZWxkLmJsb2NrUmVtb3ZlKGJsb2NrLmlkKTtcbiAgICB9LCB0aGlzKTtcblxuICAgIHRoaXMuZmllbGQuY2hlY2tQb3NpdGlvbnMoKTtcbn07XG5cbkJvbWIucHJvdG90eXBlLl9hZnRlclJ1biA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5fYmxvY2spIHsgcmV0dXJuOyB9XG5cbiAgICB0aGlzLl9yZW1vdmVUYXJnZXRzKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJvbWI7XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcblxuZnVuY3Rpb24gSGFtbWVyKG5hbWUsIG9wdGlvbnMsIGFiaWxpdGllcykge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5hYmlsaXRpZXMgPSBhYmlsaXRpZXM7XG4gICAgdGhpcy5maWVsZCA9IGFiaWxpdGllcy5nYW1lLmZpZWxkO1xuXG4gICAgdGhpcy5jb3VudCA9IG9wdGlvbnMuY291bnQgfHwgMDtcblxuICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG4gICAgdGhpcy5fYmxvY2sgPSBudWxsO1xuXG4gICAgdGhpcy5pc0FjdGl2ZSA9IGZhbHNlO1xuICAgIHRoaXMuX2lzTW91c2VEb3duID0gZmFsc2U7XG5cbiAgICB0aGlzLl9jcmVhdGVFbGVtZW50KCk7XG4gICAgdGhpcy5fYmluZEV2ZW50cygpO1xuICAgIHRoaXMudXBkYXRlQ291bnQoKTtcbn1cblxuSGFtbWVyLnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWxlbWVudC5jbGFzc05hbWUgPSAnYWJpbGl0eV9fJyArIHRoaXMubmFtZTtcblxuICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJhYmlsaXR5X19ib3JkZXJcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiYWJpbGl0eV9fY291bnRcIj48L2Rpdj4nO1xuXG5cbiAgICB0aGlzLmNvdW50RWxlbWVudCA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnYWJpbGl0eV9fY291bnQnKVswXTtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xufTtcblxuSGFtbWVyLnByb3RvdHlwZS5fYmluZEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBldmVudENsaWNrID0gdXRpbC5pc01vYmlsZSA/ICd0b3VjaGVuZCcgOiAnY2xpY2snO1xuXG4gICAgdXRpbC5vbih0aGlzLmVsZW1lbnQsIGV2ZW50Q2xpY2ssIHRoaXMuX29uQ2xpY2tIYW5kbGVyLmJpbmQodGhpcykpO1xufTtcblxuSGFtbWVyLnByb3RvdHlwZS5fb25DbGlja0hhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5jb3VudCA9PSAwKSB7IHJldHVybjsgfVxuXG4gICAgaWYgKCF0aGlzLmlzQWN0aXZlKSB7XG4gICAgICAgIHRoaXMuYWJpbGl0aWVzLnJ1bkFiaWxpdHkodGhpcy5uYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmFiaWxpdGllcy5zdG9wQWJpbGl0eSh0aGlzLm5hbWUpO1xuICAgIH1cbn07XG5cbkhhbW1lci5wcm90b3R5cGUudXBkYXRlQ291bnQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNvdW50RWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLmNvdW50O1xuXG4gICAgaWYgKHRoaXMuY291bnQgPT0gMCkge1xuICAgICAgICB1dGlsLmFkZENsYXNzKHRoaXMuZWxlbWVudCwgJ19uby1jb3VudCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5lbGVtZW50LCAnX25vLWNvdW50Jyk7XG4gICAgfVxufTtcblxuSGFtbWVyLnByb3RvdHlwZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5lbGVtZW50LCAnX2FjdGl2ZScpO1xuXG4gICAgdmFyIHN0YXJ0RXZlbnQgPSB1dGlsLmlzTW9iaWxlID8gJ3RvdWNoc3RhcnQnIDogJ21vdXNlZG93bic7XG4gICAgdmFyIGVuZEV2ZW50ID0gdXRpbC5pc01vYmlsZSA/ICd0b3VjaGVuZCcgOiAnbW91c2V1cCc7XG4gICAgdmFyIG1vdmVFdmVudCA9IHV0aWwuaXNNb2JpbGUgPyAndG91Y2htb3ZlJyA6ICdtb3VzZW1vdmUnO1xuXG4gICAgdGhpcy5fZmllbGRDbGlja0hhbmRsZXJCaW5kID0gdGhpcy5fZmllbGRDbGlja0hhbmRsZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLl9maWVsZE1vdXNlRG93bkhhbmRsZXJCaW5kID0gdGhpcy5fZmllbGRNb3VzZURvd25IYW5kbGVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fYm9keUVuZENsaWNrQmluZCA9IHRoaXMuX2JvZHlFbmRDbGljay5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX2ZpZWxkTW91c2VNb3ZlSGFuZGxlckJpbmQgPSB0aGlzLl9maWVsZE1vdXNlTW92ZUhhbmRsZXIuYmluZCh0aGlzKTtcblxuICAgIHV0aWwub24odGhpcy5maWVsZC5lbGVtZW50LCBlbmRFdmVudCwgdGhpcy5fZmllbGRDbGlja0hhbmRsZXJCaW5kKTtcbiAgICB1dGlsLm9uKHRoaXMuZmllbGQuZWxlbWVudCwgc3RhcnRFdmVudCwgdGhpcy5fZmllbGRNb3VzZURvd25IYW5kbGVyQmluZCk7XG4gICAgdXRpbC5vbihkb2N1bWVudC5ib2R5LCBlbmRFdmVudCwgdGhpcy5fYm9keUVuZENsaWNrQmluZCk7XG4gICAgdXRpbC5vbih0aGlzLmZpZWxkLmVsZW1lbnQsIG1vdmVFdmVudCwgdGhpcy5fZmllbGRNb3VzZU1vdmVIYW5kbGVyQmluZCk7XG5cbiAgICB0aGlzLmlzQWN0aXZlID0gdHJ1ZTtcbn07XG5cbkhhbW1lci5wcm90b3R5cGUuZGVhY3RpdmF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5lbGVtZW50LCAnX2FjdGl2ZScpO1xuXG4gICAgdmFyIHN0YXJ0RXZlbnQgPSB1dGlsLmlzTW9iaWxlID8gJ3RvdWNoc3RhcnQnIDogJ21vdXNlZG93bic7XG4gICAgdmFyIGVuZEV2ZW50ID0gdXRpbC5pc01vYmlsZSA/ICd0b3VjaGVuZCcgOiAnbW91c2V1cCc7XG4gICAgdmFyIG1vdmVFdmVudCA9IHV0aWwuaXNNb2JpbGUgPyAndG91Y2htb3ZlJyA6ICdtb3VzZW1vdmUnO1xuXG4gICAgdXRpbC5vZmYodGhpcy5maWVsZC5lbGVtZW50LCBlbmRFdmVudCwgdGhpcy5fZmllbGRDbGlja0hhbmRsZXJCaW5kKTtcbiAgICB1dGlsLm9mZih0aGlzLmZpZWxkLmVsZW1lbnQsIHN0YXJ0RXZlbnQsIHRoaXMuX2ZpZWxkTW91c2VEb3duSGFuZGxlckJpbmQpO1xuICAgIHV0aWwub2ZmKGRvY3VtZW50LmJvZHksIGVuZEV2ZW50LCB0aGlzLl9ib2R5RW5kQ2xpY2tCaW5kKTtcbiAgICB1dGlsLm9mZih0aGlzLmZpZWxkLmVsZW1lbnQsIG1vdmVFdmVudCwgdGhpcy5fZmllbGRNb3VzZU1vdmVIYW5kbGVyQmluZCk7XG5cbiAgICB0aGlzLmlzQWN0aXZlID0gZmFsc2U7XG59O1xuXG5IYW1tZXIucHJvdG90eXBlLl9maWVsZE1vdXNlRG93bkhhbmRsZXIgPSBmdW5jdGlvbihldikge1xuICAgIHRoaXMuX2lzTW91c2VEb3duID0gdHJ1ZTtcblxuICAgIGlmICghZXYudGFyZ2V0IHx8IGV2LnRhcmdldC5jbGFzc05hbWUgIT09ICdibG9ja19fYWN0aXZlJykgeyByZXR1cm47IH1cblxuICAgIHZhciBibG9ja0lkID0gZXYudGFyZ2V0LnBhcmVudE5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyk7XG4gICAgdmFyIGJsb2NrID0gdGhpcy5maWVsZC5ibG9ja3NbYmxvY2tJZF07XG5cbiAgICBpZiAoIWJsb2NrKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5fYmxvY2sgPSBibG9jaztcblxuICAgIHRoaXMuX2JlZm9yZVJ1bigpO1xufTtcblxuSGFtbWVyLnByb3RvdHlwZS5fZmllbGRDbGlja0hhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuX2Jsb2NrKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5faXNNb3VzZURvd24gPSBmYWxzZTtcblxuICAgIHRoaXMuX3J1bigpO1xuXG4gICAgdGhpcy5jb3VudC0tO1xuICAgIHRoaXMudXBkYXRlQ291bnQoKTtcblxuICAgIHRoaXMuYWJpbGl0aWVzLmdhbWUuc2F2ZVN0YXRlKCk7XG5cbiAgICB0aGlzLmFiaWxpdGllcy5zdG9wQWJpbGl0eSh0aGlzLm5hbWUpO1xufTtcblxuSGFtbWVyLnByb3RvdHlwZS5fYm9keUVuZENsaWNrID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5faXNNb3VzZURvd24gPSBmYWxzZTtcbiAgICB0aGlzLl9hZnRlclJ1bigpO1xufTtcblxuSGFtbWVyLnByb3RvdHlwZS5fZmllbGRNb3VzZU1vdmVIYW5kbGVyID0gZnVuY3Rpb24oZXYpIHtcbiAgICB2YXIgaSwgdGFyZ2V0LCB0b3VjaCwgYmxvY2tJZDtcblxuICAgIGlmICghdGhpcy5faXNNb3VzZURvd24pIHsgcmV0dXJuOyB9XG5cbiAgICBpZiAodXRpbC5pc01vYmlsZSkge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZXYuY2hhbmdlZFRvdWNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRvdWNoID0gZXYuY2hhbmdlZFRvdWNoZXNbaV07XG4gICAgICAgICAgICB0YXJnZXQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHRvdWNoLmNsaWVudFgsIHRvdWNoLmNsaWVudFkpO1xuXG4gICAgICAgICAgICBpZiAoIXRhcmdldCkgeyBjb250aW51ZTsgfVxuXG4gICAgICAgICAgICBpZiAodGFyZ2V0LmNsYXNzTmFtZSA9PT0gJ2Jsb2NrX19hY3RpdmUnKSB7XG4gICAgICAgICAgICAgICAgYmxvY2tJZCA9IHRhcmdldC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGFyZ2V0ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChldi5jbGllbnRYLCBldi5jbGllbnRZKTtcblxuICAgICAgICBpZiAoIXRhcmdldCB8fCB0YXJnZXQuY2xhc3NOYW1lICE9PSAnYmxvY2tfX2FjdGl2ZScpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgYmxvY2tJZCA9IHRhcmdldC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpO1xuICAgIH1cblxuICAgIGlmICghYmxvY2tJZCkge1xuICAgICAgICB0aGlzLl9hZnRlclJ1bigpO1xuICAgICAgICB0aGlzLl9ibG9jayA9IG51bGw7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgYmxvY2sgPSB0aGlzLmZpZWxkLmJsb2Nrc1tibG9ja0lkXTtcblxuICAgIGlmICghYmxvY2spIHsgcmV0dXJuOyB9XG5cbiAgICB0aGlzLl9hZnRlclJ1bigpO1xuXG4gICAgdGhpcy5fYmxvY2sgPSBibG9jaztcblxuICAgIHRoaXMuX2JlZm9yZVJ1bigpO1xufTtcblxuSGFtbWVyLnByb3RvdHlwZS5fYmVmb3JlUnVuID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5hZGRDbGFzcyh0aGlzLl9ibG9jay5lbGVtZW50LCAnX3RhcmdldEFiaWxpdHknKTtcbn07XG5cbkhhbW1lci5wcm90b3R5cGUuX3J1biA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZmllbGQuYmxvY2tSZW1vdmUodGhpcy5fYmxvY2suaWQpO1xuICAgIHRoaXMuZmllbGQuY2hlY2tQb3NpdGlvbnMoKTtcbn07XG5cbkhhbW1lci5wcm90b3R5cGUuX2FmdGVyUnVuID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX2Jsb2NrKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5fYmxvY2suZWxlbWVudCwgJ190YXJnZXRBYmlsaXR5Jyk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBIYW1tZXI7XG4iLCJ2YXIgSGFtbWVyID0gcmVxdWlyZSgnLi9oYW1tZXIuanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xuXG5mdW5jdGlvbiBMaWdodG5pbmcobmFtZSwgb3B0aW9ucywgYWJpbGl0aWVzKSB7XG4gICAgdGhpcy5fdGFyZ2V0cyA9IFtdO1xuXG4gICAgSGFtbWVyLmNhbGwodGhpcywgbmFtZSwgb3B0aW9ucywgYWJpbGl0aWVzKTtcbn1cblxuTGlnaHRuaW5nLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSGFtbWVyLnByb3RvdHlwZSk7XG5MaWdodG5pbmcucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTGlnaHRuaW5nO1xuXG5MaWdodG5pbmcucHJvdG90eXBlLl9iZWZvcmVSdW4gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLl9ibG9jay52YWx1ZTtcblxuICAgIHV0aWwuZm9yRWFjaCh0aGlzLmZpZWxkLmJsb2NrcywgZnVuY3Rpb24oYmwpIHtcbiAgICAgICAgaWYgKGJsLnZhbHVlID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fdGFyZ2V0cy5wdXNoKGJsKTtcbiAgICAgICAgICAgIHV0aWwuYWRkQ2xhc3MoYmwuZWxlbWVudCwgJ190YXJnZXRBYmlsaXR5Jyk7XG4gICAgICAgIH1cbiAgICB9LCB0aGlzKTtcbn07XG5cbkxpZ2h0bmluZy5wcm90b3R5cGUuX3J1biA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX3RhcmdldHMuZm9yRWFjaChmdW5jdGlvbihibG9jaykge1xuICAgICAgICB0aGlzLmZpZWxkLmJsb2NrUmVtb3ZlKGJsb2NrLmlkKTtcbiAgICB9LCB0aGlzKTtcblxuICAgIHRoaXMuZmllbGQuY2hlY2tQb3NpdGlvbnMoKTtcbn07XG5cbkxpZ2h0bmluZy5wcm90b3R5cGUuX2FmdGVyUnVuID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLl9ibG9jaykgeyByZXR1cm47IH1cblxuICAgIHRoaXMuX3RhcmdldHMuZm9yRWFjaChmdW5jdGlvbihibG9jaykge1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKGJsb2NrLmVsZW1lbnQsICdfdGFyZ2V0QWJpbGl0eScpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fdGFyZ2V0cyA9IFtdO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBMaWdodG5pbmc7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBoYW1tZXI6IHJlcXVpcmUoJy4vYWJpbGl0aWVzL2hhbW1lci5qcycpLFxuICAgIGJvbWI6IHJlcXVpcmUoJy4vYWJpbGl0aWVzL2JvbWIuanMnKSxcbiAgICBsaWdodG5pbmc6IHJlcXVpcmUoJy4vYWJpbGl0aWVzL2xpZ2h0bmluZy5qcycpXG59O1xuIiwidmFyIGFiaWxpdHlNb2R1bGVzID0gcmVxdWlyZSgnLi4vYWJpbGl0eU1vZHVsZXMuanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xuXG5mdW5jdGlvbiBBYmlsaXRpZXMoZ2FtZSwgcmVzdG9yZURhdGEpIHtcbiAgICByZXN0b3JlRGF0YSA9IHJlc3RvcmVEYXRhIHx8IHt9O1xuXG4gICAgdGhpcy5nYW1lID0gZ2FtZTtcbiAgICB0aGlzLmNvbmZpZyA9IGdhbWUuc3RvcmU7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgIHRoaXMuaXNFbmFibGUgPSBmYWxzZTtcbiAgICB0aGlzLl9sYXN0VXBBYmlsaXR5U2NvcmUgPSAwO1xuICAgIHRoaXMuX2FiaWxpdGllcyA9IHt9O1xuICAgIHRoaXMuY3VycmVudEFiaWxpdHkgPSBudWxsO1xuXG4gICAgdGhpcy5faW5pdEVsZW1lbnRzKCk7XG4gICAgdGhpcy5fcmVzdG9yZURhdGEocmVzdG9yZURhdGEpO1xufVxuXG5BYmlsaXRpZXMucHJvdG90eXBlLl9pbml0RWxlbWVudHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2FiaWxpdGllcyc7XG5cbiAgICBpZiAodGhpcy5jb25maWcuYWJpbGl0eSkge1xuICAgICAgICB1dGlsLmZvckVhY2godGhpcy5jb25maWcuYWJpbGl0eSwgZnVuY3Rpb24ob3B0aW9ucywgbmFtZSkge1xuICAgICAgICAgICAgdmFyIGFiaWxpdHkgPSBuZXcgYWJpbGl0eU1vZHVsZXNbbmFtZV0obmFtZSwgb3B0aW9ucywgdGhpcyk7XG5cbiAgICAgICAgICAgIHRoaXMuX2FiaWxpdGllc1tuYW1lXSA9IGFiaWxpdHk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoYWJpbGl0eS5lbGVtZW50KTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5pc0VuYWJsZSA9IHRydWU7XG4gICAgfVxuXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbn07XG5cbkFiaWxpdGllcy5wcm90b3R5cGUuX3Jlc3RvcmVEYXRhID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIGlmICghZGF0YSkgeyByZXR1cm47IH1cblxuICAgIGlmIChkYXRhLmxpc3QpIHtcbiAgICAgICAgdXRpbC5mb3JFYWNoKGRhdGEubGlzdCwgZnVuY3Rpb24oYWJpbGl0eURhdGEsIG5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuX2FiaWxpdGllc1tuYW1lXS5jb3VudCA9IGFiaWxpdHlEYXRhLmNvdW50IHx8IDA7XG4gICAgICAgICAgICB0aGlzLl9hYmlsaXRpZXNbbmFtZV0udXBkYXRlQ291bnQoKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fbGFzdFVwQWJpbGl0eVNjb3JlID0gZGF0YS5sYXN0VXBBYmlsaXR5U2NvcmUgfHwgMDtcbn07XG5cbkFiaWxpdGllcy5wcm90b3R5cGUuY2hlY2tVcCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5pc0VuYWJsZSkgeyByZXR1cm47IH1cblxuICAgIGlmICh0aGlzLmdhbWUuc2NvcmUgLSB0aGlzLl9sYXN0VXBBYmlsaXR5U2NvcmUgPCB0aGlzLmNvbmZpZy5hYmlsaXR5UGVyU2NvcmUpIHsgcmV0dXJuOyB9XG5cbiAgICB2YXIgbnVtYmVyVXAgPSBNYXRoLmZsb29yKCh0aGlzLmdhbWUuc2NvcmUgLSB0aGlzLl9sYXN0VXBBYmlsaXR5U2NvcmUpIC8gdGhpcy5jb25maWcuYWJpbGl0eVBlclNjb3JlKTtcblxuICAgIHZhciByYW5kb21BYmlsaXR5TmFtZSwgcmFuZG9tQWJpbGl0eTtcblxuICAgIHZhciByYW5kb21BcnJheSA9IFtdO1xuXG4gICAgdXRpbC5mb3JFYWNoKHRoaXMuY29uZmlnLmFiaWxpdHksIGZ1bmN0aW9uKGVsLCBuYW1lKSB7XG4gICAgICAgIHJhbmRvbUFycmF5LnB1c2goW25hbWUsIGVsLnJhdGlvIHx8IDFdKTtcbiAgICB9KTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtYmVyVXA7IGkrKykge1xuICAgICAgICByYW5kb21BYmlsaXR5TmFtZSA9IHV0aWwucmFuZG9tKHJhbmRvbUFycmF5KTtcblxuICAgICAgICBpZiAoIXJhbmRvbUFiaWxpdHlOYW1lKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgcmFuZG9tQWJpbGl0eSA9IHRoaXMuX2FiaWxpdGllc1tyYW5kb21BYmlsaXR5TmFtZV07XG4gICAgICAgIHJhbmRvbUFiaWxpdHkuY291bnQrKztcbiAgICAgICAgcmFuZG9tQWJpbGl0eS51cGRhdGVDb3VudCgpO1xuICAgIH1cblxuICAgIHRoaXMuX2xhc3RVcEFiaWxpdHlTY29yZSA9IHRoaXMuZ2FtZS5zY29yZTtcblxuICAgIHRoaXMuZ2FtZS5zYXZlU3RhdGUoKTtcbn07XG5cbkFiaWxpdGllcy5wcm90b3R5cGUucnVuQWJpbGl0eSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAodGhpcy5jdXJyZW50QWJpbGl0eSkge1xuICAgICAgICB0aGlzLl9hYmlsaXRpZXNbdGhpcy5jdXJyZW50QWJpbGl0eV0uZGVhY3RpdmF0ZSgpO1xuICAgIH1cblxuICAgIHRoaXMuX2FiaWxpdGllc1tuYW1lXS5hY3RpdmF0ZSgpO1xuICAgIHRoaXMuY3VycmVudEFiaWxpdHkgPSBuYW1lO1xufTtcblxuQWJpbGl0aWVzLnByb3RvdHlwZS5zdG9wQWJpbGl0eSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAodGhpcy5jdXJyZW50QWJpbGl0eSA9PSBuYW1lKSB7XG4gICAgICAgIHRoaXMuX2FiaWxpdGllc1tuYW1lXS5kZWFjdGl2YXRlKCk7XG4gICAgICAgIHRoaXMuY3VycmVudEFiaWxpdHkgPSBudWxsO1xuICAgIH1cbn07XG5cbkFiaWxpdGllcy5wcm90b3R5cGUuZ2V0U3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3RhdGUgPSB7fTtcbiAgICBzdGF0ZS5saXN0ID0ge307XG5cbiAgICB1dGlsLmZvckVhY2godGhpcy5fYWJpbGl0aWVzLCBmdW5jdGlvbihhYmlsaXR5LCBuYW1lKSB7XG4gICAgICAgIHN0YXRlLmxpc3RbbmFtZV0gPSB7XG4gICAgICAgICAgICBjb3VudDogYWJpbGl0eS5jb3VudFxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgc3RhdGUubGFzdFVwQWJpbGl0eVNjb3JlID0gdGhpcy5fbGFzdFVwQWJpbGl0eVNjb3JlO1xuXG4gICAgcmV0dXJuIHN0YXRlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBYmlsaXRpZXM7XG4iLCJ2YXIgZ2FtZUNvbmZpZyA9IHJlcXVpcmUoJy4uL2dhbWVDb25maWcuanMnKTtcbnZhciBjb2xvcnMgPSByZXF1aXJlKCcuL2NvbG9ycy5qcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsLmpzJyk7XG5cbnZhciBwcmltZU51bWJlcnMgPSBbMSwgMiwgMywgNSwgNywgMTEsIDEzXTtcblxudmFyIGlkQ291bnRlciA9IDA7XG5cbi8vIGNhc2hlIG9mIGNvbG9ycywgdmFsdWUgLT4gcmdiKC4uLC4uLC4uKVxudmFyIGNvbG9yc0NhY2hlID0ge307XG5cbmZ1bmN0aW9uIEJsb2NrKHgsIHksIGZpZWxkKSB7XG4gICAgdGhpcy5pZCA9ICsraWRDb3VudGVyO1xuXG4gICAgdGhpcy5maWVsZCA9IGZpZWxkO1xuICAgIHRoaXMuY29uZmlnID0gZmllbGQuY29uZmlnO1xuICAgIHRoaXMuZ2FtZSA9IGZpZWxkLmdhbWU7XG5cbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG5cbiAgICB0aGlzLnZhbHVlID0gbnVsbDtcbiAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuXG4gICAgdGhpcy5maWVsZEhlaWdodCA9IGdhbWVDb25maWcuZmllbGQuaGVpZ2h0O1xuXG4gICAgdGhpcy53aWR0aCA9IGdhbWVDb25maWcuZmllbGQud2lkdGggLyB0aGlzLmNvbmZpZy5maWVsZC5zaXplWzBdO1xuICAgIHRoaXMuaGVpZ2h0ID0gZ2FtZUNvbmZpZy5maWVsZC5oZWlnaHQgLyB0aGlzLmNvbmZpZy5maWVsZC5zaXplWzFdO1xuXG4gICAgdGhpcy53aWR0aFRleHQgPSBudWxsO1xuXG4gICAgdGhpcy5fc2V0UmFuZG9tVmFsdWUoKTtcbiAgICB0aGlzLl9jcmVhdGVFbGVtZW50KCk7XG4gICAgdGhpcy5fYmluZEV2ZW50cygpO1xufVxuXG5CbG9jay5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2Jsb2NrJztcblxuICAgIGVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZTNkKCcgK1xuICAgICAgICBNYXRoLmZsb29yKHRoaXMueCAqIHRoaXMud2lkdGgpICsgJ3B4LCcgK1xuICAgICAgICBNYXRoLmZsb29yKHRoaXMuZmllbGRIZWlnaHQgLSAodGhpcy55ICsgMSkgKiB0aGlzLmhlaWdodCkgKyAncHgsMCknO1xuXG4gICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnLCB0aGlzLmlkKTtcblxuICAgIHZhciBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGlubmVyLmNsYXNzTmFtZSA9ICdibG9ja19faW5uZXInO1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoaW5uZXIpO1xuXG4gICAgdmFyIGJvcmRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGJvcmRlci5jbGFzc05hbWUgPSAnYmxvY2tfX2lubmVyQm9yZGVyJztcbiAgICBpbm5lci5hcHBlbmRDaGlsZChib3JkZXIpO1xuXG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0ZXh0LmNsYXNzTmFtZSA9ICdibG9ja19faW5uZXJUZXh0JztcbiAgICB0ZXh0LmlubmVySFRNTCA9IHRoaXMudmFsdWU7XG4gICAgaW5uZXIuYXBwZW5kQ2hpbGQodGV4dCk7XG5cbiAgICB2YXIgYWN0aXZlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgYWN0aXZlLmNsYXNzTmFtZSA9ICdibG9ja19fYWN0aXZlJztcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGFjdGl2ZSk7XG5cbiAgICB0aGlzLmlubmVyRWxlbWVudCA9IGlubmVyO1xuICAgIHRoaXMudGV4dEVsZW1lbnQgPSB0ZXh0O1xuICAgIHRoaXMuYWN0aXZlRWxlbWVudCA9IGFjdGl2ZTtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXG4gICAgdGhpcy5fdXBkYXRlQ29sb3JzKCk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuX3NldFJhbmRvbVZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy52YWx1ZSA9IHV0aWwucmFuZG9tKHRoaXMuY29uZmlnLm51bWJlcnMucG9zc2libGVWYWx1ZXMpO1xufTtcblxuQmxvY2sucHJvdG90eXBlLl9iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHV0aWwuaXNNb2JpbGUpIHtcbiAgICAgICAgdXRpbC5vbih0aGlzLmVsZW1lbnQsICd0b3VjaHN0YXJ0JywgdGhpcy5fbW91c2VEb3duSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1dGlsLm9uKHRoaXMuZWxlbWVudCwgJ21vdXNlZG93bicsIHRoaXMuX21vdXNlRG93bkhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgICAgIHV0aWwub24odGhpcy5hY3RpdmVFbGVtZW50LCAnbW91c2VvdmVyJywgdGhpcy5fbW91c2VPdmVySGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICAgICAgLy91dGlsLm9uKHRoaXMuYWN0aXZlRWxlbWVudCwgJ21vdXNlb3V0JywgdGhpcy5fbW91c2VPdXRIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgIH1cbn07XG5cbkJsb2NrLnByb3RvdHlwZS5fbW91c2VEb3duSGFuZGxlciA9IGZ1bmN0aW9uKGV2KSB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcblxuICAgIGlmICh0aGlzLmdhbWUuYWJpbGl0aWVzLmN1cnJlbnRBYmlsaXR5KSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5maWVsZC5ibG9ja01vdXNlRG93bih0aGlzLmlkKTtcbn07XG5cblxuQmxvY2sucHJvdG90eXBlLl9tb3VzZU92ZXJIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5maWVsZC5ibG9ja01vdXNlT3Zlcih0aGlzLmlkKTtcbn07XG5cblxuQmxvY2sucHJvdG90eXBlLl9tb3VzZU91dEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmZpZWxkLmJsb2NrTW91c2VPdXQodGhpcy5pZCk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuY2hhbmdlUG9zaXRpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuXG4gICAgdGhpcy5lbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGUzZCgnICtcbiAgICAgICAgTWF0aC5mbG9vcih0aGlzLnggKiB0aGlzLndpZHRoKSArICdweCwnICtcbiAgICAgICAgTWF0aC5mbG9vcih0aGlzLmZpZWxkSGVpZ2h0IC0gKHRoaXMueSArIDEpICogdGhpcy5oZWlnaHQpICsgJ3B4LDApJztcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5fdXBkYXRlQ29sb3JzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCFjb2xvcnNDYWNoZVt0aGlzLnZhbHVlXSkge1xuICAgICAgICAvLyA3IC0+IDMgKHByaW1lTnVtYmVyIC0+IHJhdGlvKVxuICAgICAgICB2YXIgcHJpbWVBcnJheSA9IFtdO1xuICAgICAgICB2YXIgaTtcblxuICAgICAgICBmb3IgKGkgPSBwcmltZU51bWJlcnMubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgJSBwcmltZU51bWJlcnNbaV0gPT09IDApIHtcbiAgICAgICAgICAgICAgICBwcmltZUFycmF5LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJpbWVOdW1iZXJzW2ldLFxuICAgICAgICAgICAgICAgICAgICByZ2I6IGNvbG9yc1tpXS5yZ2IsXG4gICAgICAgICAgICAgICAgICAgIHJhdGlvOiB0aGlzLnZhbHVlIC8gcHJpbWVOdW1iZXJzW2ldXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY29sb3I7XG5cbiAgICAgICAgaWYgKHByaW1lQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb2xvciA9IHV0aWwucmdiU3VtKHByaW1lQXJyYXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29sb3IgPSBjb2xvcnNbMF0ucmdiO1xuICAgICAgICB9XG5cbiAgICAgICAgY29sb3JzQ2FjaGVbdGhpcy52YWx1ZV0gPSAncmdiKCcgKyBjb2xvci5qb2luKCcsJykgKyAnKSc7XG4gICAgfVxuXG4gICAgdGhpcy5pbm5lckVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3JzQ2FjaGVbdGhpcy52YWx1ZV07XG59O1xuXG5CbG9jay5wcm90b3R5cGUuY2hhbmdlVmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLnRleHRFbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuXG4gICAgdmFyIHRleHRMZW5ndGggPSB0aGlzLnZhbHVlLnRvU3RyaW5nKCkubGVuZ3RoO1xuXG4gICAgaWYgKHRleHRMZW5ndGggPj0gNSAmJiB0ZXh0TGVuZ3RoIDw9IDEwICYmIHRoaXMud2lkdGhUZXh0ICE9PSB0ZXh0TGVuZ3RoKSB7XG4gICAgICAgIGlmICh0aGlzLndpZHRoVGV4dCkge1xuICAgICAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyh0aGlzLmVsZW1lbnQsICdfbGVuXycgKyB0ZXh0TGVuZ3RoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5lbGVtZW50LCAnX2xlbl8nICsgdGV4dExlbmd0aCk7XG4gICAgfVxuXG4gICAgdGhpcy5fdXBkYXRlQ29sb3JzKCk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5hZGRDbGFzcyh0aGlzLmVsZW1lbnQsICdfc2VsZWN0ZWQnKTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS51bnNlbGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5lbGVtZW50LCAnX3NlbGVjdGVkJyk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuYW5pbWF0ZUNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5lbGVtZW50LCAnX2JsaW5rJyk7XG5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHNlbGYuZWxlbWVudCwgJ19ibGluaycpO1xuICAgIH0sIDE1KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQmxvY2s7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgICB7XG4gICAgICAgIHdlYjogJyM5OWI0MzMnLFxuICAgICAgICByZ2I6IFsxNTQsIDE4MCwgNTFdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjREE1MzJDJyxcbiAgICAgICAgcmdiOiBbMjE4LCA4MywgNDRdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjMWU3MTQ1JyxcbiAgICAgICAgcmdiOiBbMzAsIDExMywgNjldXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjMkM4OUEwJyxcbiAgICAgICAgcmdiOiBbNDQsIDEzNywgMTYwXVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnIzAwQUE4OCcsXG4gICAgICAgIHJnYjogWzAsIDE3MCwgMTM2XVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnIzAwZDQ1NScsXG4gICAgICAgIHJnYjogWzAsIDIxMiwgODVdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjZmYyYTJhJyxcbiAgICAgICAgcmdiOiBbMjU1LCA0MiwgNDJdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjQ0I1MDAwJyxcbiAgICAgICAgcmdiOiBbMjAzLCA4MCwgMF1cbiAgICB9XG5dO1xuIiwidmFyIEJsb2NrID0gcmVxdWlyZSgnLi9ibG9jay5qcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG52YXIgZ2FtZUNvbmZpZyA9IHJlcXVpcmUoJy4uL2dhbWVDb25maWcnKTtcblxuZnVuY3Rpb24gRmllbGQoZ2FtZSwgcmVzdG9yZURhdGEpIHtcbiAgICByZXN0b3JlRGF0YSA9IHJlc3RvcmVEYXRhIHx8IHt9O1xuXG4gICAgdGhpcy5nYW1lID0gZ2FtZTtcbiAgICB0aGlzLmNvbmZpZyA9IGdhbWUuc3RvcmU7XG5cbiAgICB0aGlzLmJsb2NrcyA9IHt9O1xuICAgIHRoaXMuX2Jsb2Nrc1hZID0ge307XG4gICAgdGhpcy5zaXplID0gdGhpcy5jb25maWcuZmllbGQuc2l6ZTtcblxuICAgIHRoaXMuc2VsZWN0ZWRCbG9ja3MgPSBbXTtcbiAgICB0aGlzLnNlbGVjdGVkTW9kZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLl9jcmVhdGVFbGVtZW50KCk7XG4gICAgdGhpcy5fYmluZEV2ZW50cygpO1xuICAgIHRoaXMuX3Jlc3RvcmVEYXRhKHJlc3RvcmVEYXRhKTtcbn1cblxuRmllbGQucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNpemVbMF07IGkrKykge1xuICAgICAgICB0aGlzLl9ibG9ja3NYWVtpXSA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5zaXplWzFdOyBqKyspIHtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQmxvY2soaSwgaiwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX3Jlc3RvcmVEYXRhID0gZnVuY3Rpb24ocmVzdG9yZURhdGEpIHtcbiAgICBpZiAocmVzdG9yZURhdGEuYmxvY2tzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zaXplWzBdOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5zaXplWzFdOyBqKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJsb2Nrc1t0aGlzLl9ibG9ja3NYWVtpXVtqXV0uY2hhbmdlVmFsdWUocmVzdG9yZURhdGEuYmxvY2tzW2ldW2pdLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5jcmVhdGVCbG9jayA9IGZ1bmN0aW9uKHgsIHksIGlzSW5pdCkge1xuICAgIHZhciBibG9jayA9IG5ldyBCbG9jayh4LCB5LCB0aGlzKTtcblxuICAgIHRoaXMuYmxvY2tzW2Jsb2NrLmlkXSA9IGJsb2NrO1xuXG4gICAgdGhpcy5fYmxvY2tzWFlbeF1beV0gPSBibG9jay5pZDtcblxuICAgIGlmICghaXNJbml0KSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChibG9jay5lbGVtZW50KTtcbiAgICAgICAgYmxvY2suYW5pbWF0ZUNyZWF0ZSgpO1xuICAgIH1cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdGhpcy5jYW52YXMuY2xhc3NOYW1lID0gJ2ZpZWxkX19jYW52YXMnO1xuXG4gICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgdGhpcy5jYW52YXMud2lkdGggPSBnYW1lQ29uZmlnLmZpZWxkLndpZHRoO1xuICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IGdhbWVDb25maWcuZmllbGQuaGVpZ2h0O1xuICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKHRoaXMuY2FudmFzKTtcblxuICAgIHV0aWwuZm9yRWFjaCh0aGlzLmJsb2NrcywgZnVuY3Rpb24oYmwpIHtcbiAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoYmwuZWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gJ2ZpZWxkJyArXG4gICAgICAgICcgX3dpZHRoXycgKyB0aGlzLnNpemVbMF0gK1xuICAgICAgICAnIF9oZWlnaHRfJyArIHRoaXMuc2l6ZVsxXTtcblxuICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChmcmFnbWVudCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2JpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodXRpbC5pc01vYmlsZSkge1xuICAgICAgICB1dGlsLm9uKGRvY3VtZW50LmJvZHksICd0b3VjaGVuZCcsIHRoaXMuX21vdXNlVXBIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgICAgICB1dGlsLm9uKGRvY3VtZW50LmJvZHksICd0b3VjaG1vdmUnLCB0aGlzLl90b3VjaE1vdmVIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHV0aWwub24oZG9jdW1lbnQuYm9keSwgJ21vdXNldXAnLCB0aGlzLl9tb3VzZVVwSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX3RvdWNoTW92ZUhhbmRsZXIgPSBmdW5jdGlvbihldikge1xuICAgIHZhciBpc0JyZWFrLCBibG9jaywga2V5cyx0b3VjaCwgdGFyZ2V0LCBpLCBqO1xuICAgIHZhciBibG9ja3MgPSB0aGlzLmJsb2NrcztcblxuICAgIGZvciAoaSA9IDA7IGkgPCBldi5jaGFuZ2VkVG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0b3VjaCA9IGV2LmNoYW5nZWRUb3VjaGVzW2ldO1xuICAgICAgICB0YXJnZXQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHRvdWNoLmNsaWVudFgsIHRvdWNoLmNsaWVudFkpO1xuXG4gICAgICAgIGlmICghdGFyZ2V0IHx8IHRhcmdldC5jbGFzc05hbWUuaW5kZXhPZignYmxvY2tfX2FjdGl2ZScpID09IC0xKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgLy8g0LTQtdC70LDQtdC8IGZvciwg0LAg0L3QtSBmb3JFYWNoLCDRh9GC0L7QsdGLINC80L7QttC90L4g0LHRi9C70L4g0YHRgtC+0L/QvdGD0YLRjFxuICAgICAgICBrZXlzID0gT2JqZWN0LmtleXMoYmxvY2tzKTtcblxuICAgICAgICBmb3IgKGogPSAwOyBqIDwga2V5cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgYmxvY2sgPSBibG9ja3Nba2V5c1tqXV07XG5cbiAgICAgICAgICAgIGlmIChibG9jay5hY3RpdmVFbGVtZW50ID09PSB0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJsb2NrTW91c2VPdmVyKGJsb2NrLmlkKTtcbiAgICAgICAgICAgICAgICBpc0JyZWFrID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0JyZWFrKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fbW91c2VVcEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuc2VsZWN0ZWRNb2RlKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5zZWxlY3RlZE1vZGUgPSBmYWxzZTtcblxuICAgIHRoaXMuX3J1blNlbGVjdGVkKCk7XG5cbiAgICB1dGlsLmZvckVhY2godGhpcy5ibG9ja3MsIGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgIGJsb2NrLnVuc2VsZWN0KCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW0oKTtcblxuICAgIHRoaXMuX2NsZWFyUGF0aCgpO1xufTtcblxuRmllbGQucHJvdG90eXBlLmJsb2NrTW91c2VEb3duID0gZnVuY3Rpb24oaWQpIHtcbiAgICB0aGlzLnNlbGVjdGVkTW9kZSA9IHRydWU7XG4gICAgdGhpcy5zZWxlY3RlZEJsb2NrcyA9IFtpZF07XG5cbiAgICB0aGlzLmJsb2Nrc1tpZF0uc2VsZWN0KCk7XG5cbiAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW0oKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY2hlY2tXaXRoTGFzdCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGxhc3RCbCA9IHRoaXMuYmxvY2tzW3RoaXMuc2VsZWN0ZWRCbG9ja3NbdGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggLSAxXV07XG4gICAgdmFyIG5ld0JsID0gdGhpcy5ibG9ja3NbaWRdO1xuXG4gICAgcmV0dXJuIGxhc3RCbC52YWx1ZSA9PSBuZXdCbC52YWx1ZSAmJlxuICAgICAgICBNYXRoLmFicyhsYXN0QmwueCAtIG5ld0JsLngpIDw9IDEgJiZcbiAgICAgICAgTWF0aC5hYnMobGFzdEJsLnkgLSBuZXdCbC55KSA8PSAxO1xufTtcblxuRmllbGQucHJvdG90eXBlLmJsb2NrTW91c2VPdmVyID0gZnVuY3Rpb24oaWQpIHtcbiAgICBpZiAoIXRoaXMuc2VsZWN0ZWRNb2RlKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIHNlbEJsb2NrcyA9IHRoaXMuc2VsZWN0ZWRCbG9ja3M7XG5cbiAgICBpZiAoc2VsQmxvY2tzLmluZGV4T2YoaWQpID09IC0xKSB7XG4gICAgICAgIGlmICh0aGlzLl9jaGVja1dpdGhMYXN0KGlkKSkge1xuICAgICAgICAgICAgc2VsQmxvY2tzLnB1c2goaWQpO1xuICAgICAgICAgICAgdGhpcy5ibG9ja3NbaWRdLnNlbGVjdCgpO1xuXG4gICAgICAgICAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW0oKTtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVBhdGgoKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChzZWxCbG9ja3Nbc2VsQmxvY2tzLmxlbmd0aCAtIDJdID09IGlkKSB7XG4gICAgICAgICAgICB2YXIgbGFzdEJsSWQgPSBzZWxCbG9ja3MucG9wKCk7XG4gICAgICAgICAgICB0aGlzLmJsb2Nrc1tsYXN0QmxJZF0udW5zZWxlY3QoKTtcblxuICAgICAgICAgICAgdGhpcy5nYW1lLnVwZGF0ZUNoYWluU3VtKCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVQYXRoKCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX3VwZGF0ZVBhdGggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgY3R4ID0gdGhpcy5jdHg7XG4gICAgdmFyIGZpZWxkSGVpZ2h0ID0gZ2FtZUNvbmZpZy5maWVsZC5oZWlnaHQ7XG5cbiAgICB0aGlzLl9jbGVhclBhdGgoKTtcblxuICAgIGN0eC5iZWdpblBhdGgoKTtcblxuICAgIGN0eC5zdHJva2VTdHlsZSA9IGdhbWVDb25maWcucGF0aC5jb2xvcjtcbiAgICBjdHgubGluZVdpZHRoID0gZ2FtZUNvbmZpZy5wYXRoLndpZHRoO1xuXG4gICAgdGhpcy5zZWxlY3RlZEJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uKGlkLCBpKSB7XG4gICAgICAgIHZhciBibG9jayA9IHRoaXMuYmxvY2tzW2lkXTtcbiAgICAgICAgdmFyIHggPSAoYmxvY2sueCArIDAuNSkgKiBibG9jay53aWR0aDtcbiAgICAgICAgdmFyIHkgPSBmaWVsZEhlaWdodCAtIChibG9jay55ICsgMC41KSAqIGJsb2NrLmhlaWdodDtcblxuICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgY3R4Lm1vdmVUbyh4LCB5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN0eC5saW5lVG8oeCwgeSk7XG4gICAgICAgIH1cbiAgICB9LCB0aGlzKTtcblxuICAgIGN0eC5zdHJva2UoKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY2xlYXJQYXRoID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIGdhbWVDb25maWcuZmllbGQud2lkdGgsIGdhbWVDb25maWcuZmllbGQuaGVpZ2h0KTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5ibG9ja01vdXNlT3V0ID0gZnVuY3Rpb24oaWQpIHtcblxufTtcblxuRmllbGQucHJvdG90eXBlLmJsb2NrUmVtb3ZlID0gZnVuY3Rpb24oaWQpIHtcbiAgICB2YXIgYmxvY2sgPSB0aGlzLmJsb2Nrc1tpZF07XG5cbiAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQ2hpbGQoYmxvY2suZWxlbWVudCk7XG5cbiAgICB0aGlzLl9ibG9ja3NYWVtibG9jay54XVtibG9jay55XSA9IG51bGw7XG4gICAgZGVsZXRlIHRoaXMuYmxvY2tzW2lkXTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fcnVuU2VsZWN0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggPCB0aGlzLmNvbmZpZy5jaGFpbi5taW5MZW5ndGgpIHsgcmV0dXJuOyB9XG5cbiAgICB0aGlzLmdhbWUudXBkYXRlU2NvcmUoKTtcblxuICAgIHZhciBsYXN0QmxJZCA9IHRoaXMuc2VsZWN0ZWRCbG9ja3MucG9wKCk7XG4gICAgdmFyIGxhc3RCbCA9IHRoaXMuYmxvY2tzW2xhc3RCbElkXTtcbiAgICB2YXIgdmFsdWUgPSBsYXN0QmwudmFsdWUgKiAodGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggKyAxKTsgLy8gKzEgYmVjYXVzZSBwb3AgYWJvdmVcblxuICAgIGxhc3RCbC5jaGFuZ2VWYWx1ZSh2YWx1ZSk7XG5cbiAgICB0aGlzLnNlbGVjdGVkQmxvY2tzLmZvckVhY2godGhpcy5ibG9ja1JlbW92ZSwgdGhpcyk7XG5cbiAgICB0aGlzLmNoZWNrUG9zaXRpb25zKCk7XG5cbiAgICB0aGlzLmdhbWUuc2F2ZVN0YXRlKCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuY2hlY2tQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB2YXIgYmxvY2tzWFkgPSB0aGlzLl9ibG9ja3NYWTtcbiAgICB2YXIgYmxvY2tzID0gdGhpcy5ibG9ja3M7XG5cbiAgICB1dGlsLmZvckVhY2goYmxvY2tzWFksIGZ1bmN0aW9uKGJsb2Nrc1kpIHtcbiAgICAgICAgdmFyIGFyciA9IFtdO1xuXG4gICAgICAgIC8vINC00L7QsdCw0LLQu9GP0LXQvCDQsiDQvNCw0YHRgdC40LIg0YHRg9GJ0LXRgdGC0LLRg9GO0YnQuNC1INCy0LXRgNGC0LjQutCw0LvRjNC90YvQtSDRjdC70LXQvNC10L3RgtGLXG4gICAgICAgIHV0aWwuZm9yRWFjaChibG9ja3NZLCBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgaWYgKGlkKSB7IGFyci5wdXNoKGlkKTsgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyDQtdGB0LvQuCDQv9C+0LvQvdGL0Lkg0LjQu9C4INC/0YPRgdGC0L7QuVxuICAgICAgICBpZiAoYXJyLmxlbmd0aCA9PSBzZWxmLnNpemVbMV0gfHwgIWFycikgeyByZXR1cm47IH1cblxuICAgICAgICAvLyDRgdC+0YDRgtC40YDRg9C10LxcbiAgICAgICAgYXJyLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGJsb2Nrc1thXS55ID4gYmxvY2tzW2JdLnk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vINGB0LTQstC40LPQsNC10Lwg0L7RgtGB0L7RgNGC0LjRgNC+0LLQsNC90L3Ri9C5INGB0L/QuNGB0L7QuiDQuiDQvdC40LfRg1xuICAgICAgICBhcnIuZm9yRWFjaChmdW5jdGlvbihpZCwgeSkge1xuICAgICAgICAgICAgdmFyIGJsb2NrID0gYmxvY2tzW2lkXTtcblxuICAgICAgICAgICAgaWYgKGJsb2NrLnkgIT0geSkge1xuICAgICAgICAgICAgICAgIGJsb2Nrc1lbYmxvY2sueV0gPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgYmxvY2suY2hhbmdlUG9zaXRpb24oYmxvY2sueCwgeSk7XG5cbiAgICAgICAgICAgICAgICBibG9ja3NZW3ldID0gaWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fYWRkTmV3QmxvY2tzKCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2FkZE5ld0Jsb2NrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBibG9ja3NYWSA9IHRoaXMuX2Jsb2Nrc1hZO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNpemVbMF07IGkrKykge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuc2l6ZVsxXTsgaisrKSB7XG4gICAgICAgICAgICBpZiAoIWJsb2Nrc1hZW2ldW2pdKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVCbG9jayhpLCBqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5nZXRTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdGF0ZSA9IHtcbiAgICAgICAgYmxvY2tzOiB7fVxuICAgIH07XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2l6ZVswXTsgaSsrKSB7XG4gICAgICAgIHN0YXRlLmJsb2Nrc1tpXSA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5zaXplWzFdOyBqKyspIHtcbiAgICAgICAgICAgIHN0YXRlLmJsb2Nrc1tpXVtqXSA9IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogdGhpcy5ibG9ja3NbdGhpcy5fYmxvY2tzWFlbaV1bal1dLnZhbHVlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0YXRlO1xufTtcblxuRmllbGQucHJvdG90eXBlLmdldEJsb2NrID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHZhciByb3dZID0gdGhpcy5fYmxvY2tzWFlbeF07XG5cbiAgICBpZiAoIXJvd1kpIHsgcmV0dXJuIG51bGw7IH1cblxuICAgIHZhciBpZCA9IHJvd1lbeV07XG5cbiAgICBpZiAoIWlkKSB7IHJldHVybiBudWxsOyB9XG5cbiAgICByZXR1cm4gdGhpcy5ibG9ja3NbaWRdO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGaWVsZDtcbiIsInZhciBsZXZlbFN0b3JlID0gcmVxdWlyZSgnLi4vbGV2ZWxTdG9yZS5qcycpO1xudmFyIEFiaWxpdGllcyA9IHJlcXVpcmUoJy4vYWJpbGl0aWVzLmpzJyk7XG52YXIgRmllbGQgPSByZXF1aXJlKCcuL2ZpZWxkLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuZnVuY3Rpb24gR2FtZShuYW1lLCBzdGF0ZSwgcmVzdG9yZURhdGEpIHtcbiAgICByZXN0b3JlRGF0YSA9IHJlc3RvcmVEYXRhIHx8IHt9O1xuXG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG4gICAgdGhpcy5zdG9yZSA9IGxldmVsU3RvcmUuZ2V0KG5hbWUpO1xuXG4gICAgdGhpcy5zY29yZSA9IHJlc3RvcmVEYXRhLnNjb3JlIHx8IDA7XG5cbiAgICB0aGlzLmZpZWxkID0gbmV3IEZpZWxkKHRoaXMsIHJlc3RvcmVEYXRhLmZpZWxkKTtcbiAgICB0aGlzLmFiaWxpdGllcyA9IG5ldyBBYmlsaXRpZXModGhpcywgcmVzdG9yZURhdGEuYWJpbGl0aWVzKTtcblxuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbiAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XG59XG5cbkdhbWUucHJvdG90eXBlLl9jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBlbGVtZW50LmNsYXNzTmFtZSA9ICdnYW1lJztcblxuICAgIHZhciB0ZW1wbGF0ZSA9XG4gICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9faGVhZGVyXCI+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX2xldmVsTmFtZVwiPkxldmVsOiB7e25hbWV9fTwvZGl2PicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19zY29yZVwiPnt7c2NvcmV9fTwvZGl2PicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19jaGFpblN1bVwiPjwvZGl2PicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19tYXhTY29yZVwiPk1heCBzY29yZToge3ttYXhTY29yZX19PC9kaXY+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX2dvYWxcIj57e2dvYWx9fTwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9fYm9keVwiPjwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX2Zvb3RlclwiPicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19hYmlsaXRpZXNcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9fYnV0dG9uc1wiPicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9fYmFja0J1dHRvblwiPk1lbnU8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX3Jlc3RhcnRCdXR0b25cIj5SZXN0YXJ0PC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19uZXh0QnV0dG9uXCI+TmV4dDwvZGl2PicgK1xuICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JztcblxuICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gdGVtcGxhdGVcbiAgICAgICAgLnJlcGxhY2UoJ3t7c2NvcmV9fScsIHRoaXMuc2NvcmUpXG4gICAgICAgIC5yZXBsYWNlKCd7e2dvYWx9fScsIHRoaXMuX2dldEdvYWxUZXh0KCkpXG4gICAgICAgIC5yZXBsYWNlKCd7e25hbWV9fScsIHRoaXMubmFtZSlcbiAgICAgICAgLnJlcGxhY2UoJ3t7bWF4U2NvcmV9fScsIHRoaXMuc3RvcmUubWF4U2NvcmUpO1xuXG4gICAgaWYgKHRoaXMuc3RvcmUuY3VycmVudEdvYWwgPiAwKSB7XG4gICAgICAgIHV0aWwuYWRkQ2xhc3MoZWxlbWVudCwgJ193aW4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmJhY2tCdXR0b24gPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dhbWVfX2JhY2tCdXR0b24nKVswXTtcbiAgICB0aGlzLnJlc3RhcnRCdXR0b24gPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dhbWVfX3Jlc3RhcnRCdXR0b24nKVswXTtcbiAgICB0aGlzLm5leHRCdXR0b24gPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dhbWVfX25leHRCdXR0b24nKVswXTtcblxuICAgIHRoaXMuYWJpbGl0aWVzRWxlbWVudCA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnZ2FtZV9fYWJpbGl0aWVzJylbMF07XG4gICAgdGhpcy5hYmlsaXRpZXNFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuYWJpbGl0aWVzLmVsZW1lbnQpO1xuXG4gICAgdGhpcy5nb2FsRWxlbWVudCA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnZ2FtZV9fZ29hbCcpWzBdO1xuICAgIHRoaXMuc2NvcmVFbGVtZW50ID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdnYW1lX19zY29yZScpWzBdO1xuICAgIHRoaXMuY2hhaW5TdW1FbGVtZW50ID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdnYW1lX19jaGFpblN1bScpWzBdO1xuICAgIHRoaXMubWF4U2NvcmVFbGVtZW50ID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdnYW1lX19tYXhTY29yZScpWzBdO1xuXG4gICAgdGhpcy5ib2R5RWxlbWVudCA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnZ2FtZV9fYm9keScpWzBdO1xuICAgIHRoaXMuYm9keUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5maWVsZC5lbGVtZW50KTtcblxuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG59O1xuXG5HYW1lLnByb3RvdHlwZS5fYmluZEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwub24odGhpcy5yZXN0YXJ0QnV0dG9uLCAnY2xpY2snLCB0aGlzLnJlc3RhcnQuYmluZCh0aGlzKSk7XG4gICAgdXRpbC5vbih0aGlzLmJhY2tCdXR0b24sICdjbGljaycsIHRoaXMuX2JhY2tUb01lbnUuYmluZCh0aGlzKSk7XG4gICAgdXRpbC5vbih0aGlzLm5leHRCdXR0b24sICdjbGljaycsIHRoaXMuX25leHRMZXZlbC5iaW5kKHRoaXMpKTtcbn07XG5cbkdhbWUucHJvdG90eXBlLl9nZXRHb2FsVGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnN0b3JlLmN1cnJlbnRHb2FsIDw9IDMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RvcmUuZ29hbHNbdGhpcy5zdG9yZS5jdXJyZW50R29hbF07XG4gICAgfVxuXG4gICAgcmV0dXJuICcnO1xufTtcblxuR2FtZS5wcm90b3R5cGUuX25leHRMZXZlbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3RhdGUucnVuTGV2ZWxNZW51KCk7XG59O1xuXG5HYW1lLnByb3RvdHlwZS5yZXN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zY29yZSA9IDA7XG4gICAgdGhpcy5zY29yZUVsZW1lbnQuaW5uZXJIVE1MID0gMDtcblxuICAgIHZhciBuZXdGaWVsZCA9IG5ldyBGaWVsZCh0aGlzKTtcbiAgICB0aGlzLmJvZHlFbGVtZW50LnJlcGxhY2VDaGlsZChuZXdGaWVsZC5lbGVtZW50LCB0aGlzLmZpZWxkLmVsZW1lbnQpO1xuICAgIHRoaXMuZmllbGQgPSBuZXdGaWVsZDtcblxuICAgIHZhciBuZXdBYmlsaXRpZXMgPSBuZXcgQWJpbGl0aWVzKHRoaXMpO1xuICAgIHRoaXMuYWJpbGl0aWVzRWxlbWVudC5yZXBsYWNlQ2hpbGQobmV3QWJpbGl0aWVzLmVsZW1lbnQsIHRoaXMuYWJpbGl0aWVzLmVsZW1lbnQpO1xuICAgIHRoaXMuYWJpbGl0aWVzID0gbmV3QWJpbGl0aWVzO1xuXG4gICAgdGhpcy5zYXZlU3RhdGUoKTtcbn07XG5cbkdhbWUucHJvdG90eXBlLl9iYWNrVG9NZW51ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdGF0ZS5iYWNrRnJvbUxldmVsKCk7XG59O1xuXG5HYW1lLnByb3RvdHlwZS51cGRhdGVDaGFpblN1bSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5maWVsZC5zZWxlY3RlZE1vZGUpIHtcbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyh0aGlzLmNoYWluU3VtRWxlbWVudCwgJ19zaG93ZWQnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBmaWVsZCA9IHRoaXMuZmllbGQ7XG5cbiAgICB2YXIgYmxvY2tWYWx1ZSA9IGZpZWxkLmJsb2Nrc1tmaWVsZC5zZWxlY3RlZEJsb2Nrc1swXV0udmFsdWUgfHwgMDtcbiAgICB0aGlzLmNoYWluU3VtRWxlbWVudC5pbm5lckhUTUwgPSBibG9ja1ZhbHVlICogZmllbGQuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoO1xuICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5jaGFpblN1bUVsZW1lbnQsICdfc2hvd2VkJyk7XG59O1xuXG5HYW1lLnByb3RvdHlwZS51cGRhdGVTY29yZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmaWVsZCA9IHRoaXMuZmllbGQ7XG5cbiAgICB2YXIgYmxvY2tWYWx1ZSA9IGZpZWxkLmJsb2Nrc1tmaWVsZC5zZWxlY3RlZEJsb2Nrc1swXV0udmFsdWUgfHwgMDtcbiAgICB2YXIgayA9IDEgKyAwLjIgKiAoZmllbGQuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoIC0gMyk7XG4gICAgdGhpcy5zY29yZSArPSBNYXRoLnJvdW5kKGJsb2NrVmFsdWUgKiBmaWVsZC5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggKiBrKTtcbiAgICB0aGlzLnNjb3JlRWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLnNjb3JlO1xuXG4gICAgaWYgKHRoaXMuc3RvcmUubWF4U2NvcmUgPCB0aGlzLnNjb3JlKSB7XG4gICAgICAgIHRoaXMuc3RvcmUubWF4U2NvcmUgPSB0aGlzLnNjb3JlO1xuICAgICAgICB0aGlzLm1heFNjb3JlRWxlbWVudC5pbm5lckhUTUwgPSAnTWF4IHNjb3JlOiAnICsgdGhpcy5zY29yZTtcbiAgICB9XG5cbiAgICB0aGlzLl9jaGVja0dvYWwoKTtcblxuICAgIHRoaXMuYWJpbGl0aWVzLmNoZWNrVXAoKTtcblxuICAgIGxldmVsU3RvcmUuc2F2ZUxldmVscygpO1xufTtcblxuR2FtZS5wcm90b3R5cGUuX2NoZWNrR29hbCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnN0b3JlLmN1cnJlbnRHb2FsID09IDMpIHsgcmV0dXJuOyB9XG5cbiAgICB2YXIgc3RvcmUgPSB0aGlzLnN0b3JlO1xuXG4gICAgaWYgKHRoaXMuc2NvcmUgPj0gc3RvcmUud2luQ29uZGl0aW9uc1tzdG9yZS5jdXJyZW50R29hbF0pIHtcbiAgICAgICAgc3RvcmUuY3VycmVudEdvYWwgPSBNYXRoLm1pbihzdG9yZS5jdXJyZW50R29hbCArIDEsIDMpO1xuXG4gICAgICAgIGlmIChzdG9yZS5jdXJyZW50R29hbCA9PSAxKSB7IHRoaXMuX3dpbigpOyB9XG5cbiAgICAgICAgdGhpcy5nb2FsRWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLl9nZXRHb2FsVGV4dCgpO1xuICAgIH1cbn07XG5cbkdhbWUucHJvdG90eXBlLl93aW4gPSBmdW5jdGlvbigpIHtcbiAgICB1dGlsLmFkZENsYXNzKHRoaXMuZWxlbWVudCwgJ193aW4nKTtcbiAgICBsZXZlbFN0b3JlLmNoZWNrT3BlbkxldmVscygpO1xufTtcblxuR2FtZS5wcm90b3R5cGUuZ2V0U3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWVsZDogdGhpcy5maWVsZC5nZXRTdGF0ZSgpLFxuICAgICAgICBhYmlsaXRpZXM6IHRoaXMuYWJpbGl0aWVzLmdldFN0YXRlKCksXG4gICAgICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICAgICAgc2NvcmU6IHRoaXMuc2NvcmVcbiAgICB9O1xufTtcblxuR2FtZS5wcm90b3R5cGUuc2F2ZVN0YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdGF0ZS5zYXZlQWN0aXZlTGV2ZWwoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR2FtZTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGZpZWxkOiB7XG4gICAgICAgIHdpZHRoOiA1MDAsXG4gICAgICAgIGhlaWdodDogNTAwXG4gICAgfSxcbiAgICBwYXRoOiB7XG4gICAgICAgIGNvbG9yOiAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjI1KScsXG4gICAgICAgIHdpZHRoOiAxMFxuICAgIH0sXG4gICAgcHJvZ3Jlc3NCYXI6IHtcbiAgICAgICAgd2lkdGg6IDQ5MFxuICAgIH0sXG4gICAgbGV2ZWxzOiBbMSwgMiwgMywgNCwgNSwgNl0sXG4gICAgbWluT3BlbkxldmVsczogNVxufTtcbiIsInZhciBnYW1lQ29uZmlnID0gcmVxdWlyZSgnLi4vZ2FtZUNvbmZpZy5qcycpO1xudmFyIGxldmVsU3RvcmUgPSByZXF1aXJlKCcuLi9sZXZlbFN0b3JlLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcblxuZnVuY3Rpb24gTGV2ZWwobGV2ZWxNZW51LCBuYW1lLCBvcmRlcikge1xuICAgIHRoaXMubGV2ZWxNZW51ID0gbGV2ZWxNZW51O1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG5cbiAgICB0aGlzLnN0b3JlID0gbGV2ZWxTdG9yZS5nZXQodGhpcy5uYW1lKTtcblxuICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSAnbGV2ZWxNZW51X19sZXZlbEJsb2NrICcgK1xuICAgICAgICAnX2xldmVsXycgKyBvcmRlciAlIDI7XG5cbiAgICB2YXIgdGVtcGxhdGUgPVxuICAgICAgICAnPGRpdiBjbGFzcz1cImxldmVsTWVudV9fbGV2ZWxCbG9ja0dvYWxTdGF0ZVwiPjwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImxldmVsTWVudV9fbGV2ZWxCbG9ja1RleHRcIj57e25hbWV9fTwvZGl2Pic7XG5cbiAgICB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MID0gdGVtcGxhdGUucmVwbGFjZSgne3tuYW1lfX0nLCBuYW1lKTtcbiAgICB0aGlzLmdvYWwgPSBudWxsO1xuXG4gICAgdGhpcy5pc09wZW4gPSBmYWxzZTtcblxuICAgIHV0aWwub24odGhpcy5lbGVtZW50LCAnY2xpY2snLCB0aGlzLl9vbkNsaWNrLmJpbmQodGhpcykpO1xufVxuXG5MZXZlbC5wcm90b3R5cGUuX29uQ2xpY2sgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmxldmVsTWVudS5ydW5MZXZlbCh0aGlzLm5hbWUpO1xufTtcblxuTGV2ZWwucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXdHb2FsID0gdGhpcy5zdG9yZS5jdXJyZW50R29hbDtcblxuICAgIGlmICh0aGlzLmdvYWwgIT09IG5ld0dvYWwpIHtcbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyh0aGlzLmVsZW1lbnQsICdfZ29hbF8nICsgdGhpcy5nb2FsKTtcbiAgICAgICAgdXRpbC5hZGRDbGFzcyh0aGlzLmVsZW1lbnQsICdfZ29hbF8nICsgbmV3R29hbCk7XG4gICAgICAgIHRoaXMuZ29hbCA9IG5ld0dvYWw7XG4gICAgfVxuXG4gICAgdmFyIG5ld0lzT3BlbiA9IHRoaXMuc3RvcmUuaXNPcGVuO1xuXG4gICAgaWYgKHRoaXMuaXNPcGVuICE9PSBuZXdJc09wZW4pIHtcbiAgICAgICAgdXRpbC5hZGRDbGFzcyh0aGlzLmVsZW1lbnQsICdfb3BlbicpO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIExldmVsTWVudShzdGF0ZSkge1xuICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB0aGlzLmxldmVscyA9IHt9O1xuXG4gICAgdGhpcy5fY3JlYXRlRWxlbWVudCgpO1xuICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcbiAgICB0aGlzLl91cGRhdGVQcm9ncmVzcygpO1xufVxuXG5MZXZlbE1lbnUucHJvdG90eXBlLl9jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBlbGVtZW50LmNsYXNzTmFtZSA9ICdsZXZlbE1lbnUnO1xuICAgIGVsZW1lbnQuaW5uZXJIVE1MID1cbiAgICAgICAgJzxkaXYgY2xhc3M9XCJsZXZlbE1lbnVfX2hlYWRlclwiPicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJsZXZlbE1lbnVfX2hlYWRlckxldmVsc1wiPkxldmVsczo8L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImxldmVsTWVudV9fYm9keVwiPicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJsZXZlbE1lbnVfX3Byb2dyZXNzXCI+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJsZXZlbE1lbnVfX3Byb2dyZXNzQmFyXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJsZXZlbE1lbnVfX3Byb2dyZXNzVGV4dFwiPjwvZGl2PicgK1xuICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJsZXZlbE1lbnVfX2xldmVsTGlzdFwiPjwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwibGV2ZWxNZW51X19mb290ZXJcIj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwibGV2ZWxNZW51X19iYWNrQnV0dG9uXCI+QmFjazwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JztcblxuICAgIHZhciBsaXN0ID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdsZXZlbE1lbnVfX2xldmVsTGlzdCcpWzBdO1xuICAgIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgIGdhbWVDb25maWcubGV2ZWxzLmZvckVhY2goZnVuY3Rpb24obmFtZSwgaSkge1xuICAgICAgICB2YXIgbGV2ZWwgPSBuZXcgTGV2ZWwodGhpcywgbmFtZSwgaSk7XG5cbiAgICAgICAgdGhpcy5sZXZlbHNbbmFtZV0gPSBsZXZlbDtcblxuICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChsZXZlbC5lbGVtZW50KTtcbiAgICB9LCB0aGlzKTtcblxuICAgIGxpc3QuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xuXG4gICAgdGhpcy5iYWNrQnV0dG9uID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdsZXZlbE1lbnVfX2JhY2tCdXR0b24nKVswXTtcbiAgICB0aGlzLnByb2dyZXNzQmFyRWxlbWVudCA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbGV2ZWxNZW51X19wcm9ncmVzc0JhcicpWzBdO1xuICAgIHRoaXMucHJvZ3Jlc3NUZXh0RWxlbWVudCA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbGV2ZWxNZW51X19wcm9ncmVzc1RleHQnKVswXTtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xufTtcblxuTGV2ZWxNZW51LnByb3RvdHlwZS5fYmluZEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwub24odGhpcy5iYWNrQnV0dG9uLCAnY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zdGF0ZS5ydW5NYWluTWVudSgpO1xuICAgIH0uYmluZCh0aGlzKSk7XG59O1xuXG5MZXZlbE1lbnUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwuZm9yRWFjaCh0aGlzLmxldmVscywgZnVuY3Rpb24obGV2ZWwpIHtcbiAgICAgICAgbGV2ZWwudXBkYXRlKCk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICB0aGlzLl91cGRhdGVQcm9ncmVzcygpO1xufTtcblxuTGV2ZWxNZW51LnByb3RvdHlwZS5ydW5MZXZlbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAobGV2ZWxTdG9yZS5nZXQobmFtZSkuaXNPcGVuKSB7XG4gICAgICAgIHRoaXMuc3RhdGUucnVuTGV2ZWwobmFtZSk7XG4gICAgfVxufTtcblxuTGV2ZWxNZW51LnByb3RvdHlwZS5fdXBkYXRlUHJvZ3Jlc3MgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGVuZ3RoID0gT2JqZWN0LmtleXModGhpcy5sZXZlbHMpLmxlbmd0aDtcbiAgICB2YXIgZ29hbHNDb3VudCA9IDM7XG4gICAgdmFyIHN1bSA9IDA7XG5cbiAgICB1dGlsLmZvckVhY2godGhpcy5sZXZlbHMsIGZ1bmN0aW9uKGxldmVsKSB7XG4gICAgICAgIHN1bSArPSBsZXZlbC5zdG9yZS5jdXJyZW50R29hbDtcbiAgICB9KTtcblxuICAgIHZhciBwcm9ncmVzc1ZhbHVlID0gc3VtIC8gKGxlbmd0aCAqIGdvYWxzQ291bnQpO1xuXG4gICAgdGhpcy5wcm9ncmVzc0JhckVsZW1lbnQuc3R5bGUud2lkdGggPSBNYXRoLmZsb29yKHByb2dyZXNzVmFsdWUgKiBnYW1lQ29uZmlnLnByb2dyZXNzQmFyLndpZHRoKSArICdweCc7XG4gICAgdGhpcy5wcm9ncmVzc1RleHRFbGVtZW50LmlubmVySFRNTCA9IE1hdGguZmxvb3IocHJvZ3Jlc3NWYWx1ZSAqIDEwMCkgKyAnJSc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExldmVsTWVudTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIDE6IHJlcXVpcmUoJy4vbGV2ZWxzLzEnKSxcbiAgICAyOiByZXF1aXJlKCcuL2xldmVscy8yJyksXG4gICAgMzogcmVxdWlyZSgnLi9sZXZlbHMvMicpLFxuICAgIDQ6IHJlcXVpcmUoJy4vbGV2ZWxzLzInKSxcbiAgICA1OiByZXF1aXJlKCcuL2xldmVscy8yJyksXG4gICAgNjogcmVxdWlyZSgnLi9sZXZlbHMvMicpLyosXG4gICAgNzogcmVxdWlyZSgnLi9sZXZlbHMvMicpLFxuICAgIDg6IHJlcXVpcmUoJy4vbGV2ZWxzLzInKSxcbiAgICA5OiByZXF1aXJlKCcuL2xldmVscy8yJykqL1xufTtcbiIsInZhciBnYW1lQ29uZmlnID0gcmVxdWlyZSgnLi9nYW1lQ29uZmlnLmpzJyk7XG52YXIgc2F2ZXMgPSByZXF1aXJlKCcuL3NhdmVzLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG52YXIgbGV2ZWxDb25maWcgPSBjb25maWcubGV2ZWxzO1xuXG52YXIgbGV2ZWxTdG9yZSA9IHt9O1xuXG52YXIgbGV2ZWxzID0ge307XG5cbmZ1bmN0aW9uIGluaXRMZXZlbHMoKSB7XG4gICAgdmFyIHNhdmVkTGV2ZWxzID0gc2F2ZXMuZ2V0TGV2ZWxzKCk7XG5cbiAgICBnYW1lQ29uZmlnLmxldmVscy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdmFyIGxldmVsID0gbGV2ZWxDb25maWdbbmFtZV07XG4gICAgICAgIGxldmVsLm5hbWUgPSBuYW1lO1xuXG4gICAgICAgIHNhdmVkTGV2ZWxzW25hbWVdID0gc2F2ZWRMZXZlbHNbbmFtZV0gfHwge307XG5cbiAgICAgICAgbGV2ZWwuY3VycmVudEdvYWwgPSBzYXZlZExldmVsc1tuYW1lXS5jdXJyZW50R29hbCB8fCAwO1xuICAgICAgICBsZXZlbC5tYXhTY29yZSA9IHNhdmVkTGV2ZWxzW25hbWVdLm1heFNjb3JlIHx8IDA7XG5cbiAgICAgICAgbGV2ZWxzW25hbWVdID0gbGV2ZWw7XG4gICAgfSk7XG5cbiAgICBsZXZlbFN0b3JlLmNoZWNrT3BlbkxldmVscygpO1xufVxuXG5sZXZlbFN0b3JlLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gbGV2ZWxzW25hbWVdO1xufTtcblxubGV2ZWxTdG9yZS5jaGVja09wZW5MZXZlbHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3BlbkxldmVsc0xlbmd0aCA9IDA7XG5cbiAgICBnYW1lQ29uZmlnLmxldmVscy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUsIGkpIHtcbiAgICAgICAgdmFyIGxldmVsID0gbGV2ZWxzW25hbWVdO1xuXG4gICAgICAgIGlmIChsZXZlbC5jdXJyZW50R29hbCA+IDApIHtcbiAgICAgICAgICAgIG9wZW5MZXZlbHNMZW5ndGgrKztcbiAgICAgICAgfVxuXG4gICAgICAgIGxldmVsLmlzT3BlbiA9IGkgPCBvcGVuTGV2ZWxzTGVuZ3RoICsgZ2FtZUNvbmZpZy5taW5PcGVuTGV2ZWxzO1xuICAgIH0pO1xufTtcblxubGV2ZWxTdG9yZS5zYXZlTGV2ZWxzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRhdGFUb1NhdmUgPSB7fTtcblxuICAgIHV0aWwuZm9yRWFjaChsZXZlbHMsIGZ1bmN0aW9uKGxldmVsLCBuYW1lKSB7XG4gICAgICAgIGRhdGFUb1NhdmVbbmFtZV0gPSB7XG4gICAgICAgICAgICBtYXhTY29yZTogbGV2ZWwubWF4U2NvcmUsXG4gICAgICAgICAgICBjdXJyZW50R29hbDogbGV2ZWwuY3VycmVudEdvYWxcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgc2F2ZXMuc2V0TGV2ZWxzKGRhdGFUb1NhdmUpO1xufTtcblxuaW5pdExldmVscygpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxldmVsU3RvcmU7XG4iLCJ2YXIgR2FtZSA9IHJlcXVpcmUoJy4uL2dhbWUvZ2FtZS5qcycpO1xuXG5mdW5jdGlvbiBMZXZlbChuYW1lLCBzdGF0ZSwgcmVzdG9yZURhdGEpIHtcbiAgICBHYW1lLmNhbGwodGhpcywgbmFtZSwgc3RhdGUsIHJlc3RvcmVEYXRhKTtcbn1cblxuTGV2ZWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShHYW1lLnByb3RvdHlwZSk7XG5MZXZlbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBMZXZlbDtcblxubW9kdWxlLmV4cG9ydHMgPSBMZXZlbDtcbiIsInZhciBHYW1lID0gcmVxdWlyZSgnLi4vZ2FtZS9nYW1lLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gR2FtZTtcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xuXG5mdW5jdGlvbiBNZW51KHN0YXRlKSB7XG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgIHRoaXMuX2lzUmVzdW1lQWN0aXZlID0gZmFsc2U7XG5cbiAgICB0aGlzLl9jcmVhdGVFbGVtZW50KCk7XG4gICAgdGhpcy5fYmluZEV2ZW50cygpO1xufVxuXG5NZW51LnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWxlbWVudC5jbGFzc05hbWUgPSAnbWFpbk1lbnUnO1xuICAgIGVsZW1lbnQuaW5uZXJIVE1MID1cbiAgICAgICAgJzxkaXYgY2xhc3M9XCJtYWluTWVudV9faGVhZGVyXCI+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cIm1haW5NZW51X190aXRsZVwiPkNoYWludW1iZXI8L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cIm1haW5NZW51X19ib2R5XCI+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cIm1haW5NZW51X19uZXdHYW1lXCI+TmV3IGdhbWU8L2Rpdj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwibWFpbk1lbnVfX3Jlc3VtZUdhbWVcIj5SZXN1bWUgZ2FtZTwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwibWFpbk1lbnVfX2Zvb3RlclwiPicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJtYWluTWVudV9fdmVyc2lvblwiPnYwLjAuMTwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JztcblxuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5uZXdHYW1lQnV0dG9uID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdtYWluTWVudV9fbmV3R2FtZScpWzBdO1xuICAgIHRoaXMucmVzdW1lR2FtZUJ1dHRvbiA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbWFpbk1lbnVfX3Jlc3VtZUdhbWUnKVswXTtcbn07XG5cbk1lbnUucHJvdG90eXBlLl9iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5vbih0aGlzLm5ld0dhbWVCdXR0b24sICdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnN0YXRlLnJ1bkxldmVsTWVudSgpO1xuICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICB1dGlsLm9uKHRoaXMucmVzdW1lR2FtZUJ1dHRvbiwgJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc3RhdGUucmVzdW1lTGV2ZWwoKTtcbiAgICB9LmJpbmQodGhpcykpO1xufTtcblxuTWVudS5wcm90b3R5cGUucmVzdW1lTGV2ZWxBY3RpdmUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5faXNSZXN1bWVBY3RpdmUpIHsgcmV0dXJuOyB9XG5cbiAgICB0aGlzLl9pc1Jlc3VtZUFjdGl2ZSA9IHRydWU7XG4gICAgdXRpbC5hZGRDbGFzcyh0aGlzLmVsZW1lbnQsICdfYWN0aXZlTGV2ZWwnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWVudTtcbiIsInZhciBzYXZlcyA9IHt9O1xuXG5mdW5jdGlvbiBnZXRGcm9tTG9jYWxTdG9yYWdlKG5hbWUpIHtcbiAgICB2YXIgbGV2ZWxzSlNPTiA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKG5hbWUpO1xuICAgIHZhciBsZXZlbHM7XG5cbiAgICBpZiAobGV2ZWxzSlNPTikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV2ZWxzID0gSlNPTi5wYXJzZShsZXZlbHNKU09OKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgbGV2ZWxzID0ge307XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBsZXZlbHMgPSB7fTtcbiAgICB9XG5cbiAgICByZXR1cm4gbGV2ZWxzO1xufVxuXG5mdW5jdGlvbiBzZXRUb0xvY2FsU3RvcmFnZShuYW1lLCBkYXRhKSB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0obmFtZSwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xufVxuXG5zYXZlcy5nZXRMZXZlbHMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZ2V0RnJvbUxvY2FsU3RvcmFnZSgnbGV2ZWxzJyk7XG59O1xuXG5zYXZlcy5zZXRMZXZlbHMgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgc2V0VG9Mb2NhbFN0b3JhZ2UoJ2xldmVscycsIGRhdGEpO1xufTtcblxuc2F2ZXMuc2V0QWN0aXZlTGV2ZWwgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgc2V0VG9Mb2NhbFN0b3JhZ2UoJ2FjdGl2ZUxldmVsJywgZGF0YSk7XG59O1xuXG5zYXZlcy5nZXRBY3RpdmVMZXZlbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBnZXRGcm9tTG9jYWxTdG9yYWdlKCdhY3RpdmVMZXZlbCcpO1xufTtcblxuc2F2ZXMuc2V0QWJpbGl0aWVzID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHNldFRvTG9jYWxTdG9yYWdlKCdhYmlsaXRpZXMnLCBkYXRhKTtcbn07XG5cbnNhdmVzLmdldEFiaWxpdGllcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBnZXRGcm9tTG9jYWxTdG9yYWdlKCdhYmlsaXRpZXMnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2F2ZXM7XG4iLCJ2YXIgTGV2ZWxNZW51ID0gcmVxdWlyZSgnLi9sZXZlbE1lbnUvbGV2ZWxNZW51Jyk7XG52YXIgTWFpbk1lbnUgPSByZXF1aXJlKCcuL21haW5NZW51L21haW5NZW51Jyk7XG52YXIgbGV2ZWxNb2R1bGVzID0gcmVxdWlyZSgnLi9sZXZlbE1vZHVsZXMnKTtcblxudmFyIHNhdmVzID0gcmVxdWlyZSgnLi9zYXZlcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuZnVuY3Rpb24gU3RhdGUoKSB7XG4gICAgdGhpcy5fYWN0aXZlRWxlbWVudCA9IG51bGw7XG4gICAgdGhpcy5fYWN0aXZlTGV2ZWwgPSBudWxsO1xuXG4gICAgdGhpcy5sZXZlbE1lbnUgPSBuZXcgTGV2ZWxNZW51KHRoaXMpO1xuICAgIHRoaXMubWFpbk1lbnUgPSBuZXcgTWFpbk1lbnUodGhpcyk7XG5cbiAgICB0aGlzLl9jcmVhdGVFbGVtZW50KCk7XG4gICAgdGhpcy5fY2hlY2tBY3RpdmVMZXZlbCgpO1xufVxuXG5TdGF0ZS5wcm90b3R5cGUuX2NoZWNrQWN0aXZlTGV2ZWwgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYWN0aXZlU2F2ZWRMZXZlbCA9IHNhdmVzLmdldEFjdGl2ZUxldmVsKCk7XG5cbiAgICBpZiAoT2JqZWN0LmtleXMoYWN0aXZlU2F2ZWRMZXZlbCkubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuX2FjdGl2ZUxldmVsID0gbmV3IGxldmVsTW9kdWxlc1thY3RpdmVTYXZlZExldmVsLm5hbWVdKGFjdGl2ZVNhdmVkTGV2ZWwubmFtZSwgdGhpcywgYWN0aXZlU2F2ZWRMZXZlbCk7XG4gICAgICAgIHRoaXMuYWN0aXZlTGV2ZWxFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX2FjdGl2ZUxldmVsLmVsZW1lbnQpO1xuICAgICAgICB0aGlzLm1haW5NZW51LnJlc3VtZUxldmVsQWN0aXZlKCk7XG4gICAgfVxufTtcblxuU3RhdGUucHJvdG90eXBlLl9jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9ICdzdGF0ZSc7XG4gICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9XG4gICAgICAgICc8ZGl2IGNsYXNzPVwic3RhdGVfX21haW5NZW51XCI+PC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwic3RhdGVfX2xldmVsTWVudVwiPjwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cInN0YXRlX19hY3RpdmVMZXZlbFwiPjwvZGl2Pic7XG5cbiAgICB0aGlzLm1haW5NZW51RWxlbWVudCA9IHRoaXMuZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzdGF0ZV9fbWFpbk1lbnUnKVswXTtcbiAgICB0aGlzLm1haW5NZW51RWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLm1haW5NZW51LmVsZW1lbnQpO1xuXG4gICAgdGhpcy5sZXZlbE1lbnVFbGVtZW50ID0gdGhpcy5lbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3N0YXRlX19sZXZlbE1lbnUnKVswXTtcbiAgICB0aGlzLmxldmVsTWVudUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5sZXZlbE1lbnUuZWxlbWVudCk7XG5cbiAgICB0aGlzLmFjdGl2ZUxldmVsRWxlbWVudCA9IHRoaXMuZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzdGF0ZV9fYWN0aXZlTGV2ZWwnKVswXTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5zYXZlQWN0aXZlTGV2ZWwgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fYWN0aXZlTGV2ZWwpIHtcbiAgICAgICAgc2F2ZXMuc2V0QWN0aXZlTGV2ZWwodGhpcy5fYWN0aXZlTGV2ZWwuZ2V0U3RhdGUoKSk7XG4gICAgfVxufTtcblxuU3RhdGUucHJvdG90eXBlLl9hY3RpdmF0ZSA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBpZiAodGhpcy5fYWN0aXZlRWxlbWVudCA9PT0gZWxlbWVudCkgeyByZXR1cm47IH1cblxuICAgIGlmICh0aGlzLl9hY3RpdmVFbGVtZW50KSB7XG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5fYWN0aXZlRWxlbWVudCwgJ19zaG93ZWQnKTtcbiAgICB9XG5cbiAgICB1dGlsLmFkZENsYXNzKGVsZW1lbnQsICdfc2hvd2VkJyk7XG4gICAgdGhpcy5fYWN0aXZlRWxlbWVudCA9IGVsZW1lbnQ7XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUucnVuTGV2ZWxNZW51ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5sZXZlbE1lbnUudXBkYXRlKCk7XG4gICAgdGhpcy5fYWN0aXZhdGUodGhpcy5sZXZlbE1lbnVFbGVtZW50KTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5ydW5NYWluTWVudSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX2FjdGl2YXRlKHRoaXMubWFpbk1lbnVFbGVtZW50KTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5ydW5MZXZlbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAodGhpcy5fYWN0aXZlTGV2ZWwgJiYgdGhpcy5fYWN0aXZlTGV2ZWwubmFtZSA9PSBuYW1lKSB7IHJldHVybiB0aGlzLnJlc3VtZUxldmVsKCk7IH1cblxuICAgIHRoaXMubWFpbk1lbnUucmVzdW1lTGV2ZWxBY3RpdmUoKTtcblxuICAgIHZhciBuZXdMZXZlbCA9IG5ldyBsZXZlbE1vZHVsZXNbbmFtZV0obmFtZSwgdGhpcyk7XG5cbiAgICBpZiAodGhpcy5fYWN0aXZlTGV2ZWwpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVMZXZlbEVsZW1lbnQucmVwbGFjZUNoaWxkKG5ld0xldmVsLmVsZW1lbnQsIHRoaXMuX2FjdGl2ZUxldmVsLmVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYWN0aXZlTGV2ZWxFbGVtZW50LmFwcGVuZENoaWxkKG5ld0xldmVsLmVsZW1lbnQpO1xuICAgIH1cblxuICAgIHRoaXMuX2FjdGl2ZUxldmVsID0gbmV3TGV2ZWw7XG5cbiAgICB0aGlzLl9hY3RpdmF0ZSh0aGlzLmFjdGl2ZUxldmVsRWxlbWVudCk7XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUuYmFja0Zyb21MZXZlbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucnVuTWFpbk1lbnUoKTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5yZXN1bWVMZXZlbCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9hY3RpdmVMZXZlbCkge1xuICAgICAgICB0aGlzLl9hY3RpdmF0ZSh0aGlzLmFjdGl2ZUxldmVsRWxlbWVudCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZTsiLCJ2YXIgdXRpbCA9IHt9O1xuXG51dGlsLmFkZENsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgIHZhciBpbmRleCA9IGNsYXNzTmFtZXMuaW5kZXhPZihuYW1lKTtcblxuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgY2xhc3NOYW1lcy5wdXNoKG5hbWUpO1xuICAgICAgICBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWVzLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWw7XG59O1xuXG51dGlsLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgIHZhciBpbmRleCA9IGNsYXNzTmFtZXMuaW5kZXhPZihuYW1lKTtcblxuICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgY2xhc3NOYW1lcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWVzLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWw7XG59O1xuXG51dGlsLmhhc0NsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuXG4gICAgcmV0dXJuIGNsYXNzTmFtZXMuaW5kZXhPZihuYW1lKSAhPSAtMTtcbn07XG5cbnV0aWwuZm9yRWFjaCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqLmxlbmd0aCkge1xuICAgICAgICBvYmouZm9yRWFjaChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5XSwga2V5KTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxudXRpbC5vbiA9IGZ1bmN0aW9uKG5vZGUsIHR5cGUsIGNhbGxiYWNrLCB1c2VDYXB0dXJlKSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGNhbGxiYWNrLCB1c2VDYXB0dXJlKTtcbn07XG5cbnV0aWwub2ZmID0gZnVuY3Rpb24obm9kZSwgdHlwZSwgY2FsbGJhY2ssIHVzZUNhcHR1cmUpIHtcbiAgICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgY2FsbGJhY2ssIHVzZUNhcHR1cmUpO1xufTtcblxuXG4vLyBTZWVtIGxlZ2l0XG52YXIgaXNNb2JpbGUgPSAoJ0RldmljZU9yaWVudGF0aW9uRXZlbnQnIGluIHdpbmRvdyB8fCAnb3JpZW50YXRpb24nIGluIHdpbmRvdyk7XG4vLyBCdXQgd2l0aCBteSBDaHJvbWUgb24gd2luZG93cywgRGV2aWNlT3JpZW50YXRpb25FdmVudCA9PSBmY3QoKVxuaWYgKC9XaW5kb3dzIE5UfE1hY2ludG9zaHxNYWMgT1MgWHxMaW51eC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIGlzTW9iaWxlID0gZmFsc2U7XG4vLyBNeSBhbmRyb2lkIGhhdmUgXCJsaW51eFwiIHRvb1xuaWYgKC9Nb2JpbGUvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSBpc01vYmlsZSA9IHRydWU7XG5cbnV0aWwuaXNNb2JpbGUgPSBpc01vYmlsZTtcblxudXRpbC5yZ2JTdW0gPSBmdW5jdGlvbihhcnIpIHtcbiAgICAvL1t7cmdiLCByYXRpb30sIC4uLl1cblxuICAgIHZhciBzdW0gPSBbMCwgMCwgMF07XG4gICAgdmFyIG4gPSAwO1xuICAgIHZhciBlbCwgaSwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZWwgPSBhcnJbaV07XG5cbiAgICAgICAgZm9yIChqID0gMDsgaiA8IDM7IGorKykge1xuICAgICAgICAgICAgc3VtW2pdICs9IGVsLnJnYltqXSAqIGVsLnJhdGlvO1xuICAgICAgICB9XG5cbiAgICAgICAgbiArPSBlbC5yYXRpbztcbiAgICB9XG5cbiAgICBmb3IgKGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICAgIHN1bVtqXSA9IE1hdGguZmxvb3Ioc3VtW2pdIC8gbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1bTtcbn07XG5cbnV0aWwubnVsbEZuID0gZnVuY3Rpb24oKSB7fTtcblxuXG4vLyBnZXQgcmFuZG9tIHZhbHVlIGZyb20gYXJyYXkgd2l0aCByZWxhdGlvbnNcbi8vIFsgW3ZhbHVlLCByYXRpb10sIC4uLiBdXG51dGlsLnJhbmRvbSA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHN1bVJhdGlvbiA9IDA7XG5cbiAgICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgIHN1bVJhdGlvbiArPSBlbFsxXTtcbiAgICB9KTtcblxuICAgIHZhciBzdW0gPSAwO1xuXG4gICAgdmFyIGNoYW5jZUFycmF5ID0gYXJyYXkubWFwKGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgIHZhciB2YWwgPSBlbFsxXSAvIHN1bVJhdGlvbiArIHN1bTtcblxuICAgICAgICBzdW0gPSB2YWw7XG5cbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9KTtcblxuICAgIHZhciByb2xsID0gTWF0aC5yYW5kb20oKTtcblxuICAgIHZhciB2YWx1ZSA9IDA7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoYW5jZUFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChyb2xsIDw9IGNoYW5jZUFycmF5W2ldKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGFycmF5W2ldWzBdO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWw7XG4iXX0=