(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var analytics = require('./analytics');
var State = require('./state');
var util = require('./util');

if (!util.isMobile) {
    util.addClass(document.body, 'no-touch');
}

analytics.init();

var html = document.getElementById('game');

var state = new State();

html.appendChild(state.element);

state.runMainMenu();

},{"./analytics":6,"./state":20,"./util":21}],2:[function(require,module,exports){
var Hammer = require('./hammer');
var util = require('../util');

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

    var sum = 0;

    this._targets.forEach(function(block) {
        sum += block.value;
    }, this);

    this.abilities.game.updateChainSum(sum);
};

Bomb.prototype._run = function() {
    var score = 0;

    this._targets.forEach(function(block) {
        this.field.blockRemove(block.id);
        score += block.value;
    }, this);

    this.field.checkPositions();

    this.abilities.game.upScore(score);

    this.abilities.game.updateChainSum();
};

Bomb.prototype._afterRun = function() {
    if (!this._block) { return; }

    this._removeTargets();

    this.abilities.game.updateChainSum();
};

module.exports = Bomb;

},{"../util":21,"./hammer":3}],3:[function(require,module,exports){
var analytics = require('../analytics');
var util = require('../util');

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

    element.innerHTML =
        '<div class="ability__border"></div>' +
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

Hammer.prototype.updateCount = function(isAnimate) {
    this.countElement.innerHTML = this.count;

    if (this.count == 0) {
        util.addClass(this.element, '_no-count');
    } else {
        util.removeClass(this.element, '_no-count');

        if (isAnimate) {
            this._blink();
        }
    }
};

Hammer.prototype._blink = function() {
    var self = this;

    util.addClass(this.element, '_blink');

    setTimeout(function() {
        util.removeClass(self.element, '_blink');
    }, 350);
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

    analytics.abilityUsed(this.name, this._block.value);

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
    this.abilities.game.updateChainSum(this._block.value);
};

Hammer.prototype._run = function() {
    this.field.blockRemove(this._block.id);
    this.field.checkPositions();

    this.abilities.game.upScore(this._block.value);
    this.abilities.game.updateChainSum();
};

Hammer.prototype._afterRun = function() {
    if (this._block) {
        util.removeClass(this._block.element, '_targetAbility');
    }
    this.abilities.game.updateChainSum();
};

module.exports = Hammer;

},{"../analytics":6,"../util":21}],4:[function(require,module,exports){
var Hammer = require('./hammer');
var util = require('../util');

function Lightning(name, options, abilities) {
    this._targets = [];

    Hammer.call(this, name, options, abilities);
}

Lightning.prototype = Object.create(Hammer.prototype);
Lightning.prototype.constructor = Lightning;

Lightning.prototype._beforeRun = function() {
    var value = this._block.value;
    var sum = 0;

    util.forEach(this.field.blocks, function(bl) {
        if (bl.value === value) {
            this._targets.push(bl);
            util.addClass(bl.element, '_targetAbility');
            sum += value;
        }
    }, this);

    this.abilities.game.updateChainSum(sum);
};

Lightning.prototype._run = function() {
    this._targets.forEach(function(block) {
        this.field.blockRemove(block.id);
    }, this);

    this.field.checkPositions();
    this.abilities.game.upScore(this._targets[0].value * this._targets.length);
    this.abilities.game.updateChainSum();
};

Lightning.prototype._afterRun = function() {
    if (!this._block) { return; }

    this._targets.forEach(function(block) {
        util.removeClass(block.element, '_targetAbility');
    });

    this._targets = [];
    this.abilities.game.updateChainSum();
};

module.exports = Lightning;

},{"../util":21,"./hammer":3}],5:[function(require,module,exports){
module.exports = {
    hammer: require('./abilities/hammer'),
    bomb: require('./abilities/bomb'),
    lightning: require('./abilities/lightning')
};

},{"./abilities/bomb":2,"./abilities/hammer":3,"./abilities/lightning":4}],6:[function(require,module,exports){
var saves = require('./saves');

var unitID;

function genUnitID() {
    return Math.round(Math.random() * 1e17);
}

function initUnitID() {
    unitID = saves.getUnitID();

    if (!unitID) {
        unitID = genUnitID();
        saves.setUnitID(unitID);
    }
}


module.exports = {
    init: function() {
        initUnitID();

        ga('create', 'UA-61340943-1', 'auto');
        ga('set', '&uid', unitID);
        ga('set', 'dimension1', unitID);
        ga('send', 'pageview');
    },

    goalAchived: function(goalNumber) {
        ga('send', 'event', 'game', 'goal achived', String(goalNumber));
    },

    abilityUsed: function(abilityName, blockValue) {
        ga('send', 'event', 'game', 'ability used', String(abilityName), blockValue);
    },

    levelStarted: function(levelName) {
        ga('send', 'event', 'game', 'level started', String(levelName));
    },

    levelResumed: function(levelName) {
        ga('send', 'event', 'game', 'level resume', String(levelName));
    },

    levelRestart: function(levelName) {
        ga('send', 'event', 'game', 'level restart', String(levelName));
    },

    maxScoreUp: function(score) {
        ga('send', 'event', 'game', 'max score up', String(score));
    }
};

},{"./saves":19}],7:[function(require,module,exports){
var abilityModules = require('../abilityModules');
var util = require('../util');

function Abilities(game, restoreData) {
    restoreData = restoreData || {};

    this.game = game;
    this.config = game.store;

    this.element = null;
    this.isEnable = false;
    this._lastUpAbilityIndex = 1;
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

    this._lastUpAbilityIndex = data.lastUpAbilityIndex || 1;
};

Abilities.prototype.checkUp = function() {
    if (!this.isEnable) { return; }

    if (this.game.score < this.config.abilityPerScore * this._lastUpAbilityIndex) { return; }

    var numberUp = Math.floor(this.game.score / this.config.abilityPerScore - this._lastUpAbilityIndex + 1);

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
        randomAbility.updateCount(true);
    }

    this._lastUpAbilityIndex++;

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

    state.lastUpAbilityIndex = this._lastUpAbilityIndex;

    return state;
};

module.exports = Abilities;

},{"../abilityModules":5,"../util":21}],8:[function(require,module,exports){
var gameConfig = require('../gameConfig');
var colors = require('./colors');
var util = require('../util');

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

    util.setPosition(element, [
        Math.floor(this.x * this.width),
        Math.floor(this.fieldHeight - (this.y + 1) * this.height)
    ]);

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

    util.setPosition(this.element, [
        this.x * this.width,
        this.fieldHeight - (this.y + 1) * this.height
    ]);
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
                    hsl: colors[i].hsl,
                    ratio: this.value / primeNumbers[i]
                });
            }
        }

        var color;

        if (primeArray.length) {
            color = util.hslSum(primeArray);
        } else {
            color = colors[0].hsl;
        }

        colorsCache[this.value] = 'hsl(' + color[0] + ',' + color[1] * 100 + '%,' + color[2] * 100 + '%)';
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

},{"../gameConfig":12,"../util":21,"./colors":9}],9:[function(require,module,exports){
module.exports = [
    {
        web: '#99b433',
        rgb: [154, 180, 51],
        hsl: [72.09302, 0.55844, 0.45294]
    }, {
        web: '#DA532C',
        rgb: [218, 83, 44],
        hsl: [13.44827, 0.70161, 0.51372]
    }, {
        web: '#1e7145',
        rgb: [30, 113, 69],
        hsl: [148.19277, 0.58041, 0.28039]
    }, {
        web: '#2C89A0',
        rgb: [44, 137, 160],
        hsl: [191.89655, 0.56862, 0.4]
    }, {
        web: '#00AA88',
        rgb: [0, 170, 136],
        hsl: [168, 1, 0.33333]
    }, {
        web: '#00d455',
        rgb: [0, 212, 85],
        hsl: [144.05660, 1, 0.41568]
    }, {
        web: '#ff2a2a',
        rgb: [255, 42, 42],
        hsl: [0, 1, 0.58235]
    }, {
        web: '#CB5000',
        rgb: [203, 80, 0],
        hsl: [23.64532, 1, 0.39803]
    }
];

},{}],10:[function(require,module,exports){
var Block = require('./block');
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

Field.prototype._updateGameChainSum = function() {
    if (!this.selectedMode) {
        this.game.updateChainSum();
        return;
    }

    var blockValue = this.blocks[this.selectedBlocks[0]].value || 0;
    this.game.updateChainSum(blockValue * this.selectedBlocks.length);
};

Field.prototype._mouseUpHandler = function() {
    if (!this.selectedMode) { return; }

    this.selectedMode = false;

    this._runSelected();

    util.forEach(this.blocks, function(block) {
        block.unselect();
    });

    this._updateGameChainSum();

    this._clearPath();
};

Field.prototype.blockMouseDown = function(id) {
    this.selectedMode = true;
    this.selectedBlocks = [id];

    this.blocks[id].select();

    this._updateGameChainSum();
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

            this._updateGameChainSum();
            this._updatePath();
        }
    } else {
        if (selBlocks[selBlocks.length - 2] == id) {
            var lastBlId = selBlocks.pop();
            this.blocks[lastBlId].unselect();

            this._updateGameChainSum();
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

    var blockValue = this.blocks[this.selectedBlocks[0]].value || 0;
    var k = 1 + 0.2 * (this.selectedBlocks.length - 3);
    this.game.upScore(blockValue * this.selectedBlocks.length * k);

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

},{"../gameConfig":12,"../util":21,"./block":8}],11:[function(require,module,exports){
var levelStore = require('../levelStore');
var gameConfig = require('../gameConfig');
var analytics = require('../analytics');
var Abilities = require('./abilities');
var Field = require('./field');
var saves = require('../saves');
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
    this._checkFirst();
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
        '<div class="game__body">' +
            '<div class="game__message">' +
                '<div class="game__messageInner">' +
                    '<div class="game__messageText"></div>' +
                    '<div class="game__messageButtons">' +
                        '<div class="game__messageReturn">Continue</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="game__field"></div>' +
        '</div>' +
        '<div class="game__footer">' +
            '<div class="game__abilities"></div>' +
            '<div class="game__buttons">' +
                '<div class="game__backButton">Back</div>' +
                '<div class="game__restartButton">Restart</div>' +
            '</div>' +
        '</div>';

    element.innerHTML = template
        .replace('{{score}}', this.score)
        .replace('{{goal}}', this._getGoalText())
        .replace('{{name}}', this.name)
        .replace('{{maxScore}}', this.store.maxScore);

    this.backButton = element.getElementsByClassName('game__backButton')[0];
    this.restartButton = element.getElementsByClassName('game__restartButton')[0];

    this.abilitiesElement = element.getElementsByClassName('game__abilities')[0];
    this.abilitiesElement.appendChild(this.abilities.element);

    this.goalElement = element.getElementsByClassName('game__goal')[0];
    this.scoreElement = element.getElementsByClassName('game__score')[0];
    this.chainSumElement = element.getElementsByClassName('game__chainSum')[0];
    this.maxScoreElement = element.getElementsByClassName('game__maxScore')[0];

    this.messageElement = element.getElementsByClassName('game__message')[0];
    this.messageTextElement = element.getElementsByClassName('game__messageText')[0];
    this.messageReturnButton = element.getElementsByClassName('game__messageReturn')[0];

    this.fieldElement = element.getElementsByClassName('game__field')[0];
    this.fieldElement.appendChild(this.field.element);

    this.element = element;
};

Game.prototype._bindEvents = function() {
    util.on(this.restartButton, 'click', this.restart.bind(this));
    util.on(this.backButton, 'click', this._backToMenu.bind(this));
    util.on(this.messageReturnButton, 'click', this._hideMessage.bind(this));
};

Game.prototype._checkFirst = function() {
    if (saves.isFirstGame()) {
        this.showMessage(gameConfig.message.first);
    }
};

Game.prototype._getGoalText = function() {
    if (this.store.currentGoal <= 3) {
        return this.store.goals[this.store.currentGoal];
    }

    return '';
};

Game.prototype.restart = function() {
    this.score = 0;
    this.scoreElement.innerHTML = 0;

    var newField = new Field(this);
    this.fieldElement.replaceChild(newField.element, this.field.element);
    this.field = newField;

    var newAbilities = new Abilities(this);
    this.abilitiesElement.replaceChild(newAbilities.element, this.abilities.element);
    this.abilities = newAbilities;

    this.saveState();

    analytics.levelRestart(this.name);
};

Game.prototype._backToMenu = function() {
    this.state.backFromLevel();
};

Game.prototype.updateChainSum = function(value) {
    if (value === undefined) {
        util.removeClass(this.chainSumElement, '_showed');
        return;
    }

    this.chainSumElement.innerHTML = value;
    util.addClass(this.chainSumElement, '_showed');
};

Game.prototype.upScore = function(value) {
    this.score += Math.round(value);
    this.scoreElement.innerHTML = this.score;

    if (this.store.maxScore < this.score) {
        this.store.maxScore = this.score;
        this.maxScoreElement.innerHTML = 'Max score: ' + this.score;
        analytics.maxScoreUp(this.score);
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

        analytics.goalAchived(store.currentGoal);
    }
};

Game.prototype._win = function() {
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

Game.prototype.showMessage = function(text) {
    this.messageTextElement.innerHTML = text;
    util.addClass(this.messageElement, '_active');
};

Game.prototype._hideMessage = function() {
    util.removeClass(this.messageElement, '_active');
};

module.exports = Game;

},{"../analytics":6,"../gameConfig":12,"../levelStore":15,"../saves":19,"../util":21,"./abilities":7,"./field":10}],12:[function(require,module,exports){
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
    levels: [1, 2, 3, 4, 5],
    minOpenLevels: 5,

    message: {
        first: 'Join three or more blocks with equal numbers to get points'
    }
};

},{}],13:[function(require,module,exports){
module.exports = {
    1: {
        field: {
            size: [4, 4]
        },
        numbers: {
            possibleValues: [
                [1, 1],
                [2, 1]
            ]
        },
        chain: {
            minLength: 3
        },
        winConditions: [1000, 3000, 6000],
        goals: [
            'Goal: 1000',
            'Next goal: 3000',
            'Last goal: 6000',
            'Achieved!'
        ],
        ability: {
            hammer: {
                count: 1,
                ratio: 10
            },
            bomb: {
                count: 0,
                ratio: 1
            },
            lightning: {
                count: 0,
                ratio: 1
            }
        },
        abilityPerScore: 700
    },
    2: {
        field: {
            size: [5, 5]
        },
        numbers: {
            possibleValues: [
                [1, 1],
                [2, 1],
                [3, 1]
            ]
        },
        chain: {
            minLength: 3
        },
        winConditions: [10000, 25000, 50000],
        goals: [
            'Goal: 10000',
            'Next goal: 25000',
            'Last goal: 50000',
            'Achieved!'
        ],
        ability: {
            hammer: {
                count: 1,
                ratio: 10
            },
            bomb: {
                count: 0,
                ratio: 1
            },
            lightning: {
                count: 0,
                ratio: 1
            }
        },
        abilityPerScore: 3000
    },
    3: {
        field: {
            size: [4, 4]
        },
        numbers: {
            possibleValues: [
                [3, 1],
                [5, 1],
                [7, 1]
            ]
        },
        chain: {
            minLength: 3
        },
        winConditions: [500, 1250, 2500],
        goals: [
            'Goal: 500',
            'Next goal: 1250',
            'Last goal: 2500',
            'Achieved!'
        ],
        ability: {
            hammer: {
                count: 1,
                ratio: 5
            },
            bomb: {
                count: 0,
                ratio: 1
            },
            lightning: {
                count: 0,
                ratio: 3
            }
        },
        abilityPerScore: 150
    },
    4: {
        field: {
            size: [5, 5]
        },
        numbers: {
            possibleValues: [
                [1, 32],
                [3, 32],
                [5, 32],
                [135, 4]
            ]
        },
        chain: {
            minLength: 3
        },
        winConditions: [8000, 32000, 150000],
        goals: [
            'Goal: 80000',
            'Next goal: 32000',
            'Last goal: 150000',
            'Achieved!'
        ],
        ability: {
            hammer: {
                count: 1,
                ratio: 5
            },
            bomb: {
                count: 0,
                ratio: 1
            },
            lightning: {
                count: 0,
                ratio: 1
            }
        },
        abilityPerScore: 1000
    },
    5: {
        field: {
            size: [5, 5]
        },
        numbers: {
            possibleValues: [
                [1, 1],
                [2, 1],
                [3, 1],
                [5, 1]
            ]
        },
        chain: {
            minLength: 3
        },
        winConditions: [50, 100, 150],
        goals: [
            'Goal: 50',
            'Next goal: 100',
            'Last goal: 150',
            'Achieved!'
        ],
        ability: {
            hammer: {
                count: 2,
                ratio: 5
            },
            bomb: {
                count: 1,
                ratio: 1
            },
            lightning: {
                count: 1,
                ratio: 1
            }
        },
        abilityPerScore: 20
    }
};

},{}],14:[function(require,module,exports){
module.exports = {
    1: require('./levels/1'),
    2: require('./levels/1'),
    3: require('./levels/1'),
    4: require('./levels/1'),
    5: require('./levels/1')
};

},{"./levels/1":16}],15:[function(require,module,exports){
var levelConfig = require('./levelConfig');
var gameConfig = require('./gameConfig');
var saves = require('./saves');
var util = require('./util');

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

},{"./gameConfig":12,"./levelConfig":13,"./saves":19,"./util":21}],16:[function(require,module,exports){
module.exports = require('../game/game');

},{"../game/game":11}],17:[function(require,module,exports){
var levelStore = require('../levelStore');
var util = require('../util');

function LevelBlock(levelMenu, name, order) {
    this.levelMenu = levelMenu;
    this.name = name;

    this.store = levelStore.get(this.name);

    this.element = document.createElement('div');
    this.element.className = 'levelBlock _level_' + order % 3;

    var template =
        '<div class="levelBlock__score"></div>' +
        '<div class="levelBlock__text">{{name}}</div>' +
        '<div class="levelBlock__goal">' +
            '<div class="levelBlock__goalPoint"></div>' +
            '<div class="levelBlock__goalPoint"></div>' +
            '<div class="levelBlock__goalPoint"></div>' +
        '</div>';

    this.element.innerHTML = template.replace('{{name}}', name);

    this.scoreElement = this.element.getElementsByClassName('levelBlock__score')[0];
    this.goalElements = this.element.getElementsByClassName('levelBlock__goalPoint');

    this.isOpen = false;

    util.on(this.element, 'click', this._onClick.bind(this));
}

LevelBlock.prototype._onClick = function() {
    this.levelMenu.runLevel(this.name);
};

LevelBlock.prototype.update = function() {
    for (var i = 0; i < this.goalElements.length; i++) {
        if (i + 1 <= this.store.currentGoal) {
            util.addClass(this.goalElements[i], '_active');
        } else {
            util.removeClass(this.goalElements[i], '_active');
        }
    }

    this.scoreElement.innerHTML = 'Score: ' + this.store.maxScore;

    var newIsOpen = this.store.isOpen;

    if (this.isOpen !== newIsOpen) {
        util.addClass(this.element, '_open');
    }
};

module.exports = LevelBlock;

},{"../levelStore":15,"../util":21}],18:[function(require,module,exports){
var gameConfig = require('../gameConfig');
var levelStore = require('../levelStore');
var LevelBlock = require('./levelBlock');
var util = require('../util');

function Menu(state) {
    this.state = state;
    this._isResumeActive = false;
    this.levelBlocks = {};

    this._createElement();
    this._bindEvents();
    this.update();
}

Menu.prototype._createElement = function() {
    var element = document.createElement('div');
    element.className = 'mainMenu';
    element.innerHTML =
        '<div class="mainMenu__header">' +
            '<div class="mainMenu__title">Chainumber</div>' +
            '<div class="mainMenu__version">v0.0.1</div>' +
        '</div>' +
        '<div class="mainMenu__body">' +
            '<div class="mainMenu__levelList"></div>' +
            '<div class="mainMenu__progress">' +
                '<div class="mainMenu__progressBar"></div>' +
                '<div class="mainMenu__progressText"></div>' +
            '</div>' +
        '</div>' +
        '<div class="mainMenu__footer">' +
        '<div class="mainMenu__resumeGame">Resume</div>' +
        '</div>';

    var list = element.getElementsByClassName('mainMenu__levelList')[0];
    var fragment = document.createDocumentFragment();

    gameConfig.levels.forEach(function(name, i) {
        var level = new LevelBlock(this, name, i);

        this.levelBlocks[name] = level;

        fragment.appendChild(level.element);
    }, this);

    list.appendChild(fragment);

    this.element = element;
    this.resumeGameButton = element.getElementsByClassName('mainMenu__resumeGame')[0];
    this.progressBarElement = element.getElementsByClassName('mainMenu__progressBar')[0];
    this.progressTextElement = element.getElementsByClassName('mainMenu__progressText')[0];
};

Menu.prototype._bindEvents = function() {
    util.on(this.resumeGameButton, 'click', function() {
        this.state.resumeLevel();
    }.bind(this));
};

Menu.prototype.update = function() {
    util.forEach(this.levelBlocks, function(level) {
        level.update();
    }, this);

    this._updateProgress();
};

Menu.prototype._updateProgress = function() {
    var length = Object.keys(this.levelBlocks).length;
    var goalsCount = 3;
    var sum = 0;

    util.forEach(this.levelBlocks, function(level) {
        sum += level.store.currentGoal;
    });

    var progressValue = sum / (length * goalsCount);

    this.progressBarElement.style.width = Math.floor(progressValue * gameConfig.progressBar.width) + 'px';
    this.progressTextElement.innerHTML = Math.floor(progressValue * 100) + '%';
};

Menu.prototype.resumeLevelActive = function() {
    if (this._isResumeActive) { return; }

    this._isResumeActive = true;
    util.addClass(this.element, '_activeLevel');
};

Menu.prototype.runLevel = function(name) {
    if (levelStore.get(name).isOpen) {
        this.state.runLevel(name);
    }
};

module.exports = Menu;

},{"../gameConfig":12,"../levelStore":15,"../util":21,"./levelBlock":17}],19:[function(require,module,exports){
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

saves.setUnitID = function(id) {
    localStorage.setItem('unitID', id);
};

saves.getUnitID = function() {
    return localStorage.getItem('unitID');
};

saves.isFirstGame = function() {
    if (localStorage.getItem('isFirstGame') == null) {
        localStorage.setItem('isFirstGame', '1');
        return true;
    }

    return false;
};

module.exports = saves;

},{}],20:[function(require,module,exports){
var MainMenu = require('./mainMenu/mainMenu');
var levelModules = require('./levelModules');
var analytics = require('./analytics');

var saves = require('./saves');
var util = require('./util');

function State() {
    this._activeElement = null;
    this._activeLevel = null;

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
        '<div class="state__activeLevel"></div>';

    this.mainMenuElement = this.element.getElementsByClassName('state__mainMenu')[0];
    this.mainMenuElement.appendChild(this.mainMenu.element);

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
State.prototype.runMainMenu = function() {
    this.mainMenu.update();
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

    analytics.levelStarted(this._activeLevel.name);
};

State.prototype.backFromLevel = function() {
    this.runMainMenu();
};

State.prototype.resumeLevel = function() {
    if (this._activeLevel) {
        this._activate(this.activeLevelElement);

        analytics.levelResumed(this._activeLevel.name);
    }
};

module.exports = State;
},{"./analytics":6,"./levelModules":14,"./mainMenu/mainMenu":18,"./saves":19,"./util":21}],21:[function(require,module,exports){
var util = {};

util.addClass = function(el, name) {
    if (el.classList !== undefined) {
            el.classList.add(name);
    } else {
        var classNames = el.className.split(' ');
        var index = classNames.indexOf(name);

        if (index === -1) {
            classNames.push(name);
            el.className = classNames.join(' ');
        }
    }

    return this;
};

util.removeClass = function(el, name) {
    if (el.classList !== undefined) {
        el.classList.remove(name);
    } else {
        var classNames = el.className.split(' ');
        var index = classNames.indexOf(name);

        if (index !== -1) {
            classNames.splice(index, 1);
            el.className = classNames.join(' ');
        }
    }

    return this;
};

util.hasClass = function(el, name) {
    if (el.classList !== undefined) {
        return el.classList.contains(name);
    }

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

util.isMobile = 'ontouchstart' in window || (window.DocumentTouch && document instanceof window.DocumentTouch);

util.hslSum = function(arr) {
    //[{hsl, ratio}, ...]
    var hsl = [0, 0, 0];
    var n = 0;
    var i, j;

    for (i = 0; i < arr.length; i++) {
        hsl[0] += arr[i].hsl[0] + 5 * arr[i].ratio;
        for (j = 1; j < 3; j++) {
            hsl[j] += arr[i].hsl[j] * arr[i].ratio;
        }

        n += arr[i].ratio;
    }

    hsl[0] %= 360;
    hsl[1] = Math.max(Math.min(hsl[1] / n, 0.7), 0.2);
    hsl[2] = Math.max(Math.min(hsl[2] / n, 0.9), 0.1);

    return hsl;
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

var ua = navigator.userAgent.toLowerCase(),
    docEl = document.documentElement,

    ie = 'ActiveXObject' in window,
    android23 = ua.search('android [23]') !== -1,

    ie3d = ie && ('transition' in docEl.style),
    webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23,
    gecko3d = 'MozPerspective' in docEl.style,

    supportsTransition3d = ie3d || webkit3d || gecko3d;

function testProps(props) {
    var style = document.documentElement.style;

    for (var i = 0; i < props.length; i++) {
        if (props[i] in style) {
            return props[i];
        }
    }

    return false;
}

var TRANSFORM = testProps(['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']);

util.setPosition = function(el, point) {
    if (supportsTransition3d) {
        el.style[TRANSFORM] = 'translate3d(' + point[0] + 'px,' + point[1] + 'px' + ',0)';
    } else {
        el.style.left = point[0] + 'px';
        el.style.top = point[1] + 'px';
    }
};

module.exports = util;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvaW5kZXguanMiLCJzcmMvanMvYWJpbGl0aWVzL2JvbWIuanMiLCJzcmMvanMvYWJpbGl0aWVzL2hhbW1lci5qcyIsInNyYy9qcy9hYmlsaXRpZXMvbGlnaHRuaW5nLmpzIiwic3JjL2pzL2FiaWxpdHlNb2R1bGVzLmpzIiwic3JjL2pzL2FuYWx5dGljcy5qcyIsInNyYy9qcy9nYW1lL2FiaWxpdGllcy5qcyIsInNyYy9qcy9nYW1lL2Jsb2NrLmpzIiwic3JjL2pzL2dhbWUvY29sb3JzLmpzIiwic3JjL2pzL2dhbWUvZmllbGQuanMiLCJzcmMvanMvZ2FtZS9nYW1lLmpzIiwic3JjL2pzL2dhbWVDb25maWcuanMiLCJzcmMvanMvbGV2ZWxDb25maWcuanMiLCJzcmMvanMvbGV2ZWxNb2R1bGVzLmpzIiwic3JjL2pzL2xldmVsU3RvcmUuanMiLCJzcmMvanMvbGV2ZWxzLzEuanMiLCJzcmMvanMvbWFpbk1lbnUvbGV2ZWxCbG9jay5qcyIsInNyYy9qcy9tYWluTWVudS9tYWluTWVudS5qcyIsInNyYy9qcy9zYXZlcy5qcyIsInNyYy9qcy9zdGF0ZS5qcyIsInNyYy9qcy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBhbmFseXRpY3MgPSByZXF1aXJlKCcuL2FuYWx5dGljcycpO1xudmFyIFN0YXRlID0gcmVxdWlyZSgnLi9zdGF0ZScpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuaWYgKCF1dGlsLmlzTW9iaWxlKSB7XG4gICAgdXRpbC5hZGRDbGFzcyhkb2N1bWVudC5ib2R5LCAnbm8tdG91Y2gnKTtcbn1cblxuYW5hbHl0aWNzLmluaXQoKTtcblxudmFyIGh0bWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ2FtZScpO1xuXG52YXIgc3RhdGUgPSBuZXcgU3RhdGUoKTtcblxuaHRtbC5hcHBlbmRDaGlsZChzdGF0ZS5lbGVtZW50KTtcblxuc3RhdGUucnVuTWFpbk1lbnUoKTtcbiIsInZhciBIYW1tZXIgPSByZXF1aXJlKCcuL2hhbW1lcicpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbmZ1bmN0aW9uIEJvbWIobmFtZSwgb3B0aW9ucywgYWJpbGl0aWVzKSB7XG4gICAgdGhpcy5fdGFyZ2V0cyA9IFtdO1xuXG4gICAgSGFtbWVyLmNhbGwodGhpcywgbmFtZSwgb3B0aW9ucywgYWJpbGl0aWVzKTtcbn1cblxuQm9tYi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhhbW1lci5wcm90b3R5cGUpO1xuQm9tYi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBCb21iO1xuXG5Cb21iLnByb3RvdHlwZS5fYWRkVGFyZ2V0ID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHZhciBibG9jayA9IHRoaXMuZmllbGQuZ2V0QmxvY2soeCwgeSk7XG5cbiAgICBpZiAoYmxvY2spIHtcbiAgICAgICAgdGhpcy5fdGFyZ2V0cy5wdXNoKGJsb2NrKTtcbiAgICAgICAgdXRpbC5hZGRDbGFzcyhibG9jay5lbGVtZW50LCAnX3RhcmdldEFiaWxpdHknKTtcbiAgICB9XG59O1xuQm9tYi5wcm90b3R5cGUuX3JlbW92ZVRhcmdldHMgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl90YXJnZXRzLmZvckVhY2goZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyhibG9jay5lbGVtZW50LCAnX3RhcmdldEFiaWxpdHknKTtcbiAgICB9KTtcblxuICAgIHRoaXMuX3RhcmdldHMgPSBbXTtcbn07XG5cbkJvbWIucHJvdG90eXBlLl9iZWZvcmVSdW4gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYmxvY2sgPSB0aGlzLl9ibG9jayxcbiAgICAgICAgeCA9IGJsb2NrLngsXG4gICAgICAgIHkgPSBibG9jay55O1xuXG4gICAgdGhpcy5fYWRkVGFyZ2V0KHgsIHkpO1xuXG4gICAgLy8gdXBcbiAgICB0aGlzLl9hZGRUYXJnZXQoeCwgeSArIDEpO1xuXG4gICAgLy8gZG93blxuICAgIHRoaXMuX2FkZFRhcmdldCh4LCB5IC0gMSk7XG5cbiAgICAvLyBsZWZ0XG4gICAgdGhpcy5fYWRkVGFyZ2V0KHggLSAxLCB5KTtcblxuICAgIC8vIHJpZ2h0XG4gICAgdGhpcy5fYWRkVGFyZ2V0KHggKyAxLCB5KTtcblxuICAgIHZhciBzdW0gPSAwO1xuXG4gICAgdGhpcy5fdGFyZ2V0cy5mb3JFYWNoKGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgIHN1bSArPSBibG9jay52YWx1ZTtcbiAgICB9LCB0aGlzKTtcblxuICAgIHRoaXMuYWJpbGl0aWVzLmdhbWUudXBkYXRlQ2hhaW5TdW0oc3VtKTtcbn07XG5cbkJvbWIucHJvdG90eXBlLl9ydW4gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2NvcmUgPSAwO1xuXG4gICAgdGhpcy5fdGFyZ2V0cy5mb3JFYWNoKGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgIHRoaXMuZmllbGQuYmxvY2tSZW1vdmUoYmxvY2suaWQpO1xuICAgICAgICBzY29yZSArPSBibG9jay52YWx1ZTtcbiAgICB9LCB0aGlzKTtcblxuICAgIHRoaXMuZmllbGQuY2hlY2tQb3NpdGlvbnMoKTtcblxuICAgIHRoaXMuYWJpbGl0aWVzLmdhbWUudXBTY29yZShzY29yZSk7XG5cbiAgICB0aGlzLmFiaWxpdGllcy5nYW1lLnVwZGF0ZUNoYWluU3VtKCk7XG59O1xuXG5Cb21iLnByb3RvdHlwZS5fYWZ0ZXJSdW4gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuX2Jsb2NrKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5fcmVtb3ZlVGFyZ2V0cygpO1xuXG4gICAgdGhpcy5hYmlsaXRpZXMuZ2FtZS51cGRhdGVDaGFpblN1bSgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCb21iO1xuIiwidmFyIGFuYWx5dGljcyA9IHJlcXVpcmUoJy4uL2FuYWx5dGljcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbmZ1bmN0aW9uIEhhbW1lcihuYW1lLCBvcHRpb25zLCBhYmlsaXRpZXMpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMuYWJpbGl0aWVzID0gYWJpbGl0aWVzO1xuICAgIHRoaXMuZmllbGQgPSBhYmlsaXRpZXMuZ2FtZS5maWVsZDtcblxuICAgIHRoaXMuY291bnQgPSBvcHRpb25zLmNvdW50IHx8IDA7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgIHRoaXMuX2Jsb2NrID0gbnVsbDtcblxuICAgIHRoaXMuaXNBY3RpdmUgPSBmYWxzZTtcbiAgICB0aGlzLl9pc01vdXNlRG93biA9IGZhbHNlO1xuXG4gICAgdGhpcy5fY3JlYXRlRWxlbWVudCgpO1xuICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcbiAgICB0aGlzLnVwZGF0ZUNvdW50KCk7XG59XG5cbkhhbW1lci5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2FiaWxpdHlfXycgKyB0aGlzLm5hbWU7XG5cbiAgICBlbGVtZW50LmlubmVySFRNTCA9XG4gICAgICAgICc8ZGl2IGNsYXNzPVwiYWJpbGl0eV9fYm9yZGVyXCI+PC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiYWJpbGl0eV9fY291bnRcIj48L2Rpdj4nO1xuXG5cbiAgICB0aGlzLmNvdW50RWxlbWVudCA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnYWJpbGl0eV9fY291bnQnKVswXTtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xufTtcblxuSGFtbWVyLnByb3RvdHlwZS5fYmluZEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBldmVudENsaWNrID0gdXRpbC5pc01vYmlsZSA/ICd0b3VjaGVuZCcgOiAnY2xpY2snO1xuXG4gICAgdXRpbC5vbih0aGlzLmVsZW1lbnQsIGV2ZW50Q2xpY2ssIHRoaXMuX29uQ2xpY2tIYW5kbGVyLmJpbmQodGhpcykpO1xufTtcblxuSGFtbWVyLnByb3RvdHlwZS5fb25DbGlja0hhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5jb3VudCA9PSAwKSB7IHJldHVybjsgfVxuXG4gICAgaWYgKCF0aGlzLmlzQWN0aXZlKSB7XG4gICAgICAgIHRoaXMuYWJpbGl0aWVzLnJ1bkFiaWxpdHkodGhpcy5uYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmFiaWxpdGllcy5zdG9wQWJpbGl0eSh0aGlzLm5hbWUpO1xuICAgIH1cbn07XG5cbkhhbW1lci5wcm90b3R5cGUudXBkYXRlQ291bnQgPSBmdW5jdGlvbihpc0FuaW1hdGUpIHtcbiAgICB0aGlzLmNvdW50RWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLmNvdW50O1xuXG4gICAgaWYgKHRoaXMuY291bnQgPT0gMCkge1xuICAgICAgICB1dGlsLmFkZENsYXNzKHRoaXMuZWxlbWVudCwgJ19uby1jb3VudCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5lbGVtZW50LCAnX25vLWNvdW50Jyk7XG5cbiAgICAgICAgaWYgKGlzQW5pbWF0ZSkge1xuICAgICAgICAgICAgdGhpcy5fYmxpbmsoKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkhhbW1lci5wcm90b3R5cGUuX2JsaW5rID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdXRpbC5hZGRDbGFzcyh0aGlzLmVsZW1lbnQsICdfYmxpbmsnKTtcblxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3Moc2VsZi5lbGVtZW50LCAnX2JsaW5rJyk7XG4gICAgfSwgMzUwKTtcbn07XG5cbkhhbW1lci5wcm90b3R5cGUuYWN0aXZhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB1dGlsLmFkZENsYXNzKHRoaXMuZWxlbWVudCwgJ19hY3RpdmUnKTtcblxuICAgIHZhciBzdGFydEV2ZW50ID0gdXRpbC5pc01vYmlsZSA/ICd0b3VjaHN0YXJ0JyA6ICdtb3VzZWRvd24nO1xuICAgIHZhciBlbmRFdmVudCA9IHV0aWwuaXNNb2JpbGUgPyAndG91Y2hlbmQnIDogJ21vdXNldXAnO1xuICAgIHZhciBtb3ZlRXZlbnQgPSB1dGlsLmlzTW9iaWxlID8gJ3RvdWNobW92ZScgOiAnbW91c2Vtb3ZlJztcblxuICAgIHRoaXMuX2ZpZWxkQ2xpY2tIYW5kbGVyQmluZCA9IHRoaXMuX2ZpZWxkQ2xpY2tIYW5kbGVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fZmllbGRNb3VzZURvd25IYW5kbGVyQmluZCA9IHRoaXMuX2ZpZWxkTW91c2VEb3duSGFuZGxlci5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX2JvZHlFbmRDbGlja0JpbmQgPSB0aGlzLl9ib2R5RW5kQ2xpY2suYmluZCh0aGlzKTtcbiAgICB0aGlzLl9maWVsZE1vdXNlTW92ZUhhbmRsZXJCaW5kID0gdGhpcy5fZmllbGRNb3VzZU1vdmVIYW5kbGVyLmJpbmQodGhpcyk7XG5cbiAgICB1dGlsLm9uKHRoaXMuZmllbGQuZWxlbWVudCwgZW5kRXZlbnQsIHRoaXMuX2ZpZWxkQ2xpY2tIYW5kbGVyQmluZCk7XG4gICAgdXRpbC5vbih0aGlzLmZpZWxkLmVsZW1lbnQsIHN0YXJ0RXZlbnQsIHRoaXMuX2ZpZWxkTW91c2VEb3duSGFuZGxlckJpbmQpO1xuICAgIHV0aWwub24oZG9jdW1lbnQuYm9keSwgZW5kRXZlbnQsIHRoaXMuX2JvZHlFbmRDbGlja0JpbmQpO1xuICAgIHV0aWwub24odGhpcy5maWVsZC5lbGVtZW50LCBtb3ZlRXZlbnQsIHRoaXMuX2ZpZWxkTW91c2VNb3ZlSGFuZGxlckJpbmQpO1xuXG4gICAgdGhpcy5pc0FjdGl2ZSA9IHRydWU7XG59O1xuXG5IYW1tZXIucHJvdG90eXBlLmRlYWN0aXZhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuZWxlbWVudCwgJ19hY3RpdmUnKTtcblxuICAgIHZhciBzdGFydEV2ZW50ID0gdXRpbC5pc01vYmlsZSA/ICd0b3VjaHN0YXJ0JyA6ICdtb3VzZWRvd24nO1xuICAgIHZhciBlbmRFdmVudCA9IHV0aWwuaXNNb2JpbGUgPyAndG91Y2hlbmQnIDogJ21vdXNldXAnO1xuICAgIHZhciBtb3ZlRXZlbnQgPSB1dGlsLmlzTW9iaWxlID8gJ3RvdWNobW92ZScgOiAnbW91c2Vtb3ZlJztcblxuICAgIHV0aWwub2ZmKHRoaXMuZmllbGQuZWxlbWVudCwgZW5kRXZlbnQsIHRoaXMuX2ZpZWxkQ2xpY2tIYW5kbGVyQmluZCk7XG4gICAgdXRpbC5vZmYodGhpcy5maWVsZC5lbGVtZW50LCBzdGFydEV2ZW50LCB0aGlzLl9maWVsZE1vdXNlRG93bkhhbmRsZXJCaW5kKTtcbiAgICB1dGlsLm9mZihkb2N1bWVudC5ib2R5LCBlbmRFdmVudCwgdGhpcy5fYm9keUVuZENsaWNrQmluZCk7XG4gICAgdXRpbC5vZmYodGhpcy5maWVsZC5lbGVtZW50LCBtb3ZlRXZlbnQsIHRoaXMuX2ZpZWxkTW91c2VNb3ZlSGFuZGxlckJpbmQpO1xuXG4gICAgdGhpcy5pc0FjdGl2ZSA9IGZhbHNlO1xufTtcblxuSGFtbWVyLnByb3RvdHlwZS5fZmllbGRNb3VzZURvd25IYW5kbGVyID0gZnVuY3Rpb24oZXYpIHtcbiAgICB0aGlzLl9pc01vdXNlRG93biA9IHRydWU7XG5cbiAgICBpZiAoIWV2LnRhcmdldCB8fCBldi50YXJnZXQuY2xhc3NOYW1lICE9PSAnYmxvY2tfX2FjdGl2ZScpIHsgcmV0dXJuOyB9XG5cbiAgICB2YXIgYmxvY2tJZCA9IGV2LnRhcmdldC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpO1xuICAgIHZhciBibG9jayA9IHRoaXMuZmllbGQuYmxvY2tzW2Jsb2NrSWRdO1xuXG4gICAgaWYgKCFibG9jaykgeyByZXR1cm47IH1cblxuICAgIHRoaXMuX2Jsb2NrID0gYmxvY2s7XG5cbiAgICB0aGlzLl9iZWZvcmVSdW4oKTtcbn07XG5cbkhhbW1lci5wcm90b3R5cGUuX2ZpZWxkQ2xpY2tIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLl9ibG9jaykgeyByZXR1cm47IH1cblxuICAgIHRoaXMuX2lzTW91c2VEb3duID0gZmFsc2U7XG5cbiAgICBhbmFseXRpY3MuYWJpbGl0eVVzZWQodGhpcy5uYW1lLCB0aGlzLl9ibG9jay52YWx1ZSk7XG5cbiAgICB0aGlzLl9ydW4oKTtcblxuICAgIHRoaXMuY291bnQtLTtcbiAgICB0aGlzLnVwZGF0ZUNvdW50KCk7XG5cbiAgICB0aGlzLmFiaWxpdGllcy5nYW1lLnNhdmVTdGF0ZSgpO1xuXG4gICAgdGhpcy5hYmlsaXRpZXMuc3RvcEFiaWxpdHkodGhpcy5uYW1lKTtcbn07XG5cbkhhbW1lci5wcm90b3R5cGUuX2JvZHlFbmRDbGljayA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX2lzTW91c2VEb3duID0gZmFsc2U7XG4gICAgdGhpcy5fYWZ0ZXJSdW4oKTtcbn07XG5cbkhhbW1lci5wcm90b3R5cGUuX2ZpZWxkTW91c2VNb3ZlSGFuZGxlciA9IGZ1bmN0aW9uKGV2KSB7XG4gICAgdmFyIGksIHRhcmdldCwgdG91Y2gsIGJsb2NrSWQ7XG5cbiAgICBpZiAoIXRoaXMuX2lzTW91c2VEb3duKSB7IHJldHVybjsgfVxuXG4gICAgaWYgKHV0aWwuaXNNb2JpbGUpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGV2LmNoYW5nZWRUb3VjaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0b3VjaCA9IGV2LmNoYW5nZWRUb3VjaGVzW2ldO1xuICAgICAgICAgICAgdGFyZ2V0ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh0b3VjaC5jbGllbnRYLCB0b3VjaC5jbGllbnRZKTtcblxuICAgICAgICAgICAgaWYgKCF0YXJnZXQpIHsgY29udGludWU7IH1cblxuICAgICAgICAgICAgaWYgKHRhcmdldC5jbGFzc05hbWUgPT09ICdibG9ja19fYWN0aXZlJykge1xuICAgICAgICAgICAgICAgIGJsb2NrSWQgPSB0YXJnZXQucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRhcmdldCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZXYuY2xpZW50WCwgZXYuY2xpZW50WSk7XG5cbiAgICAgICAgaWYgKCF0YXJnZXQgfHwgdGFyZ2V0LmNsYXNzTmFtZSAhPT0gJ2Jsb2NrX19hY3RpdmUnKSB7IHJldHVybjsgfVxuXG4gICAgICAgIGJsb2NrSWQgPSB0YXJnZXQucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKTtcbiAgICB9XG5cbiAgICBpZiAoIWJsb2NrSWQpIHtcbiAgICAgICAgdGhpcy5fYWZ0ZXJSdW4oKTtcbiAgICAgICAgdGhpcy5fYmxvY2sgPSBudWxsO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGJsb2NrID0gdGhpcy5maWVsZC5ibG9ja3NbYmxvY2tJZF07XG5cbiAgICBpZiAoIWJsb2NrKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5fYWZ0ZXJSdW4oKTtcblxuICAgIHRoaXMuX2Jsb2NrID0gYmxvY2s7XG5cbiAgICB0aGlzLl9iZWZvcmVSdW4oKTtcbn07XG5cbkhhbW1lci5wcm90b3R5cGUuX2JlZm9yZVJ1biA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5fYmxvY2suZWxlbWVudCwgJ190YXJnZXRBYmlsaXR5Jyk7XG4gICAgdGhpcy5hYmlsaXRpZXMuZ2FtZS51cGRhdGVDaGFpblN1bSh0aGlzLl9ibG9jay52YWx1ZSk7XG59O1xuXG5IYW1tZXIucHJvdG90eXBlLl9ydW4gPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmZpZWxkLmJsb2NrUmVtb3ZlKHRoaXMuX2Jsb2NrLmlkKTtcbiAgICB0aGlzLmZpZWxkLmNoZWNrUG9zaXRpb25zKCk7XG5cbiAgICB0aGlzLmFiaWxpdGllcy5nYW1lLnVwU2NvcmUodGhpcy5fYmxvY2sudmFsdWUpO1xuICAgIHRoaXMuYWJpbGl0aWVzLmdhbWUudXBkYXRlQ2hhaW5TdW0oKTtcbn07XG5cbkhhbW1lci5wcm90b3R5cGUuX2FmdGVyUnVuID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX2Jsb2NrKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5fYmxvY2suZWxlbWVudCwgJ190YXJnZXRBYmlsaXR5Jyk7XG4gICAgfVxuICAgIHRoaXMuYWJpbGl0aWVzLmdhbWUudXBkYXRlQ2hhaW5TdW0oKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSGFtbWVyO1xuIiwidmFyIEhhbW1lciA9IHJlcXVpcmUoJy4vaGFtbWVyJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuZnVuY3Rpb24gTGlnaHRuaW5nKG5hbWUsIG9wdGlvbnMsIGFiaWxpdGllcykge1xuICAgIHRoaXMuX3RhcmdldHMgPSBbXTtcblxuICAgIEhhbW1lci5jYWxsKHRoaXMsIG5hbWUsIG9wdGlvbnMsIGFiaWxpdGllcyk7XG59XG5cbkxpZ2h0bmluZy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEhhbW1lci5wcm90b3R5cGUpO1xuTGlnaHRuaW5nLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExpZ2h0bmluZztcblxuTGlnaHRuaW5nLnByb3RvdHlwZS5fYmVmb3JlUnVuID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZhbHVlID0gdGhpcy5fYmxvY2sudmFsdWU7XG4gICAgdmFyIHN1bSA9IDA7XG5cbiAgICB1dGlsLmZvckVhY2godGhpcy5maWVsZC5ibG9ja3MsIGZ1bmN0aW9uKGJsKSB7XG4gICAgICAgIGlmIChibC52YWx1ZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3RhcmdldHMucHVzaChibCk7XG4gICAgICAgICAgICB1dGlsLmFkZENsYXNzKGJsLmVsZW1lbnQsICdfdGFyZ2V0QWJpbGl0eScpO1xuICAgICAgICAgICAgc3VtICs9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfSwgdGhpcyk7XG5cbiAgICB0aGlzLmFiaWxpdGllcy5nYW1lLnVwZGF0ZUNoYWluU3VtKHN1bSk7XG59O1xuXG5MaWdodG5pbmcucHJvdG90eXBlLl9ydW4gPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl90YXJnZXRzLmZvckVhY2goZnVuY3Rpb24oYmxvY2spIHtcbiAgICAgICAgdGhpcy5maWVsZC5ibG9ja1JlbW92ZShibG9jay5pZCk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICB0aGlzLmZpZWxkLmNoZWNrUG9zaXRpb25zKCk7XG4gICAgdGhpcy5hYmlsaXRpZXMuZ2FtZS51cFNjb3JlKHRoaXMuX3RhcmdldHNbMF0udmFsdWUgKiB0aGlzLl90YXJnZXRzLmxlbmd0aCk7XG4gICAgdGhpcy5hYmlsaXRpZXMuZ2FtZS51cGRhdGVDaGFpblN1bSgpO1xufTtcblxuTGlnaHRuaW5nLnByb3RvdHlwZS5fYWZ0ZXJSdW4gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuX2Jsb2NrKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5fdGFyZ2V0cy5mb3JFYWNoKGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlQ2xhc3MoYmxvY2suZWxlbWVudCwgJ190YXJnZXRBYmlsaXR5Jyk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl90YXJnZXRzID0gW107XG4gICAgdGhpcy5hYmlsaXRpZXMuZ2FtZS51cGRhdGVDaGFpblN1bSgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBMaWdodG5pbmc7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBoYW1tZXI6IHJlcXVpcmUoJy4vYWJpbGl0aWVzL2hhbW1lcicpLFxuICAgIGJvbWI6IHJlcXVpcmUoJy4vYWJpbGl0aWVzL2JvbWInKSxcbiAgICBsaWdodG5pbmc6IHJlcXVpcmUoJy4vYWJpbGl0aWVzL2xpZ2h0bmluZycpXG59O1xuIiwidmFyIHNhdmVzID0gcmVxdWlyZSgnLi9zYXZlcycpO1xuXG52YXIgdW5pdElEO1xuXG5mdW5jdGlvbiBnZW5Vbml0SUQoKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDFlMTcpO1xufVxuXG5mdW5jdGlvbiBpbml0VW5pdElEKCkge1xuICAgIHVuaXRJRCA9IHNhdmVzLmdldFVuaXRJRCgpO1xuXG4gICAgaWYgKCF1bml0SUQpIHtcbiAgICAgICAgdW5pdElEID0gZ2VuVW5pdElEKCk7XG4gICAgICAgIHNhdmVzLnNldFVuaXRJRCh1bml0SUQpO1xuICAgIH1cbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaW5pdFVuaXRJRCgpO1xuXG4gICAgICAgIGdhKCdjcmVhdGUnLCAnVUEtNjEzNDA5NDMtMScsICdhdXRvJyk7XG4gICAgICAgIGdhKCdzZXQnLCAnJnVpZCcsIHVuaXRJRCk7XG4gICAgICAgIGdhKCdzZXQnLCAnZGltZW5zaW9uMScsIHVuaXRJRCk7XG4gICAgICAgIGdhKCdzZW5kJywgJ3BhZ2V2aWV3Jyk7XG4gICAgfSxcblxuICAgIGdvYWxBY2hpdmVkOiBmdW5jdGlvbihnb2FsTnVtYmVyKSB7XG4gICAgICAgIGdhKCdzZW5kJywgJ2V2ZW50JywgJ2dhbWUnLCAnZ29hbCBhY2hpdmVkJywgU3RyaW5nKGdvYWxOdW1iZXIpKTtcbiAgICB9LFxuXG4gICAgYWJpbGl0eVVzZWQ6IGZ1bmN0aW9uKGFiaWxpdHlOYW1lLCBibG9ja1ZhbHVlKSB7XG4gICAgICAgIGdhKCdzZW5kJywgJ2V2ZW50JywgJ2dhbWUnLCAnYWJpbGl0eSB1c2VkJywgU3RyaW5nKGFiaWxpdHlOYW1lKSwgYmxvY2tWYWx1ZSk7XG4gICAgfSxcblxuICAgIGxldmVsU3RhcnRlZDogZnVuY3Rpb24obGV2ZWxOYW1lKSB7XG4gICAgICAgIGdhKCdzZW5kJywgJ2V2ZW50JywgJ2dhbWUnLCAnbGV2ZWwgc3RhcnRlZCcsIFN0cmluZyhsZXZlbE5hbWUpKTtcbiAgICB9LFxuXG4gICAgbGV2ZWxSZXN1bWVkOiBmdW5jdGlvbihsZXZlbE5hbWUpIHtcbiAgICAgICAgZ2EoJ3NlbmQnLCAnZXZlbnQnLCAnZ2FtZScsICdsZXZlbCByZXN1bWUnLCBTdHJpbmcobGV2ZWxOYW1lKSk7XG4gICAgfSxcblxuICAgIGxldmVsUmVzdGFydDogZnVuY3Rpb24obGV2ZWxOYW1lKSB7XG4gICAgICAgIGdhKCdzZW5kJywgJ2V2ZW50JywgJ2dhbWUnLCAnbGV2ZWwgcmVzdGFydCcsIFN0cmluZyhsZXZlbE5hbWUpKTtcbiAgICB9LFxuXG4gICAgbWF4U2NvcmVVcDogZnVuY3Rpb24oc2NvcmUpIHtcbiAgICAgICAgZ2EoJ3NlbmQnLCAnZXZlbnQnLCAnZ2FtZScsICdtYXggc2NvcmUgdXAnLCBTdHJpbmcoc2NvcmUpKTtcbiAgICB9XG59O1xuIiwidmFyIGFiaWxpdHlNb2R1bGVzID0gcmVxdWlyZSgnLi4vYWJpbGl0eU1vZHVsZXMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG5mdW5jdGlvbiBBYmlsaXRpZXMoZ2FtZSwgcmVzdG9yZURhdGEpIHtcbiAgICByZXN0b3JlRGF0YSA9IHJlc3RvcmVEYXRhIHx8IHt9O1xuXG4gICAgdGhpcy5nYW1lID0gZ2FtZTtcbiAgICB0aGlzLmNvbmZpZyA9IGdhbWUuc3RvcmU7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgIHRoaXMuaXNFbmFibGUgPSBmYWxzZTtcbiAgICB0aGlzLl9sYXN0VXBBYmlsaXR5SW5kZXggPSAxO1xuICAgIHRoaXMuX2FiaWxpdGllcyA9IHt9O1xuICAgIHRoaXMuY3VycmVudEFiaWxpdHkgPSBudWxsO1xuXG4gICAgdGhpcy5faW5pdEVsZW1lbnRzKCk7XG4gICAgdGhpcy5fcmVzdG9yZURhdGEocmVzdG9yZURhdGEpO1xufVxuXG5BYmlsaXRpZXMucHJvdG90eXBlLl9pbml0RWxlbWVudHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2FiaWxpdGllcyc7XG5cbiAgICBpZiAodGhpcy5jb25maWcuYWJpbGl0eSkge1xuICAgICAgICB1dGlsLmZvckVhY2godGhpcy5jb25maWcuYWJpbGl0eSwgZnVuY3Rpb24ob3B0aW9ucywgbmFtZSkge1xuICAgICAgICAgICAgdmFyIGFiaWxpdHkgPSBuZXcgYWJpbGl0eU1vZHVsZXNbbmFtZV0obmFtZSwgb3B0aW9ucywgdGhpcyk7XG5cbiAgICAgICAgICAgIHRoaXMuX2FiaWxpdGllc1tuYW1lXSA9IGFiaWxpdHk7XG5cbiAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoYWJpbGl0eS5lbGVtZW50KTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5pc0VuYWJsZSA9IHRydWU7XG4gICAgfVxuXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbn07XG5cbkFiaWxpdGllcy5wcm90b3R5cGUuX3Jlc3RvcmVEYXRhID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIGlmICghZGF0YSkgeyByZXR1cm47IH1cblxuICAgIGlmIChkYXRhLmxpc3QpIHtcbiAgICAgICAgdXRpbC5mb3JFYWNoKGRhdGEubGlzdCwgZnVuY3Rpb24oYWJpbGl0eURhdGEsIG5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuX2FiaWxpdGllc1tuYW1lXS5jb3VudCA9IGFiaWxpdHlEYXRhLmNvdW50IHx8IDA7XG4gICAgICAgICAgICB0aGlzLl9hYmlsaXRpZXNbbmFtZV0udXBkYXRlQ291bnQoKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fbGFzdFVwQWJpbGl0eUluZGV4ID0gZGF0YS5sYXN0VXBBYmlsaXR5SW5kZXggfHwgMTtcbn07XG5cbkFiaWxpdGllcy5wcm90b3R5cGUuY2hlY2tVcCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5pc0VuYWJsZSkgeyByZXR1cm47IH1cblxuICAgIGlmICh0aGlzLmdhbWUuc2NvcmUgPCB0aGlzLmNvbmZpZy5hYmlsaXR5UGVyU2NvcmUgKiB0aGlzLl9sYXN0VXBBYmlsaXR5SW5kZXgpIHsgcmV0dXJuOyB9XG5cbiAgICB2YXIgbnVtYmVyVXAgPSBNYXRoLmZsb29yKHRoaXMuZ2FtZS5zY29yZSAvIHRoaXMuY29uZmlnLmFiaWxpdHlQZXJTY29yZSAtIHRoaXMuX2xhc3RVcEFiaWxpdHlJbmRleCArIDEpO1xuXG4gICAgdmFyIHJhbmRvbUFiaWxpdHlOYW1lLCByYW5kb21BYmlsaXR5O1xuXG4gICAgdmFyIHJhbmRvbUFycmF5ID0gW107XG5cbiAgICB1dGlsLmZvckVhY2godGhpcy5jb25maWcuYWJpbGl0eSwgZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICAgICAgcmFuZG9tQXJyYXkucHVzaChbbmFtZSwgZWwucmF0aW8gfHwgMV0pO1xuICAgIH0pO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1iZXJVcDsgaSsrKSB7XG4gICAgICAgIHJhbmRvbUFiaWxpdHlOYW1lID0gdXRpbC5yYW5kb20ocmFuZG9tQXJyYXkpO1xuXG4gICAgICAgIGlmICghcmFuZG9tQWJpbGl0eU5hbWUpIHsgY29udGludWU7IH1cblxuICAgICAgICByYW5kb21BYmlsaXR5ID0gdGhpcy5fYWJpbGl0aWVzW3JhbmRvbUFiaWxpdHlOYW1lXTtcbiAgICAgICAgcmFuZG9tQWJpbGl0eS5jb3VudCsrO1xuICAgICAgICByYW5kb21BYmlsaXR5LnVwZGF0ZUNvdW50KHRydWUpO1xuICAgIH1cblxuICAgIHRoaXMuX2xhc3RVcEFiaWxpdHlJbmRleCsrO1xuXG4gICAgdGhpcy5nYW1lLnNhdmVTdGF0ZSgpO1xufTtcblxuQWJpbGl0aWVzLnByb3RvdHlwZS5ydW5BYmlsaXR5ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGlmICh0aGlzLmN1cnJlbnRBYmlsaXR5KSB7XG4gICAgICAgIHRoaXMuX2FiaWxpdGllc1t0aGlzLmN1cnJlbnRBYmlsaXR5XS5kZWFjdGl2YXRlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fYWJpbGl0aWVzW25hbWVdLmFjdGl2YXRlKCk7XG4gICAgdGhpcy5jdXJyZW50QWJpbGl0eSA9IG5hbWU7XG59O1xuXG5BYmlsaXRpZXMucHJvdG90eXBlLnN0b3BBYmlsaXR5ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGlmICh0aGlzLmN1cnJlbnRBYmlsaXR5ID09IG5hbWUpIHtcbiAgICAgICAgdGhpcy5fYWJpbGl0aWVzW25hbWVdLmRlYWN0aXZhdGUoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50QWJpbGl0eSA9IG51bGw7XG4gICAgfVxufTtcblxuQWJpbGl0aWVzLnByb3RvdHlwZS5nZXRTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdGF0ZSA9IHt9O1xuICAgIHN0YXRlLmxpc3QgPSB7fTtcblxuICAgIHV0aWwuZm9yRWFjaCh0aGlzLl9hYmlsaXRpZXMsIGZ1bmN0aW9uKGFiaWxpdHksIG5hbWUpIHtcbiAgICAgICAgc3RhdGUubGlzdFtuYW1lXSA9IHtcbiAgICAgICAgICAgIGNvdW50OiBhYmlsaXR5LmNvdW50XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBzdGF0ZS5sYXN0VXBBYmlsaXR5SW5kZXggPSB0aGlzLl9sYXN0VXBBYmlsaXR5SW5kZXg7XG5cbiAgICByZXR1cm4gc3RhdGU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFiaWxpdGllcztcbiIsInZhciBnYW1lQ29uZmlnID0gcmVxdWlyZSgnLi4vZ2FtZUNvbmZpZycpO1xudmFyIGNvbG9ycyA9IHJlcXVpcmUoJy4vY29sb3JzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxudmFyIHByaW1lTnVtYmVycyA9IFsxLCAyLCAzLCA1LCA3LCAxMSwgMTNdO1xuXG52YXIgaWRDb3VudGVyID0gMDtcblxuLy8gY2FzaGUgb2YgY29sb3JzLCB2YWx1ZSAtPiByZ2IoLi4sLi4sLi4pXG52YXIgY29sb3JzQ2FjaGUgPSB7fTtcblxuZnVuY3Rpb24gQmxvY2soeCwgeSwgZmllbGQpIHtcbiAgICB0aGlzLmlkID0gKytpZENvdW50ZXI7XG5cbiAgICB0aGlzLmZpZWxkID0gZmllbGQ7XG4gICAgdGhpcy5jb25maWcgPSBmaWVsZC5jb25maWc7XG4gICAgdGhpcy5nYW1lID0gZmllbGQuZ2FtZTtcblxuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcblxuICAgIHRoaXMudmFsdWUgPSBudWxsO1xuICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG5cbiAgICB0aGlzLmZpZWxkSGVpZ2h0ID0gZ2FtZUNvbmZpZy5maWVsZC5oZWlnaHQ7XG5cbiAgICB0aGlzLndpZHRoID0gZ2FtZUNvbmZpZy5maWVsZC53aWR0aCAvIHRoaXMuY29uZmlnLmZpZWxkLnNpemVbMF07XG4gICAgdGhpcy5oZWlnaHQgPSBnYW1lQ29uZmlnLmZpZWxkLmhlaWdodCAvIHRoaXMuY29uZmlnLmZpZWxkLnNpemVbMV07XG5cbiAgICB0aGlzLndpZHRoVGV4dCA9IG51bGw7XG5cbiAgICB0aGlzLl9zZXRSYW5kb21WYWx1ZSgpO1xuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbiAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XG59XG5cbkJsb2NrLnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZWxlbWVudC5jbGFzc05hbWUgPSAnYmxvY2snO1xuXG4gICAgdXRpbC5zZXRQb3NpdGlvbihlbGVtZW50LCBbXG4gICAgICAgIE1hdGguZmxvb3IodGhpcy54ICogdGhpcy53aWR0aCksXG4gICAgICAgIE1hdGguZmxvb3IodGhpcy5maWVsZEhlaWdodCAtICh0aGlzLnkgKyAxKSAqIHRoaXMuaGVpZ2h0KVxuICAgIF0pO1xuXG4gICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnLCB0aGlzLmlkKTtcblxuICAgIHZhciBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGlubmVyLmNsYXNzTmFtZSA9ICdibG9ja19faW5uZXInO1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoaW5uZXIpO1xuXG4gICAgdmFyIGJvcmRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGJvcmRlci5jbGFzc05hbWUgPSAnYmxvY2tfX2lubmVyQm9yZGVyJztcbiAgICBpbm5lci5hcHBlbmRDaGlsZChib3JkZXIpO1xuXG4gICAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0ZXh0LmNsYXNzTmFtZSA9ICdibG9ja19faW5uZXJUZXh0JztcbiAgICB0ZXh0LmlubmVySFRNTCA9IHRoaXMudmFsdWU7XG4gICAgaW5uZXIuYXBwZW5kQ2hpbGQodGV4dCk7XG5cbiAgICB2YXIgYWN0aXZlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgYWN0aXZlLmNsYXNzTmFtZSA9ICdibG9ja19fYWN0aXZlJztcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGFjdGl2ZSk7XG5cbiAgICB0aGlzLmlubmVyRWxlbWVudCA9IGlubmVyO1xuICAgIHRoaXMudGV4dEVsZW1lbnQgPSB0ZXh0O1xuICAgIHRoaXMuYWN0aXZlRWxlbWVudCA9IGFjdGl2ZTtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXG4gICAgdGhpcy5fdXBkYXRlQ29sb3JzKCk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuX3NldFJhbmRvbVZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy52YWx1ZSA9IHV0aWwucmFuZG9tKHRoaXMuY29uZmlnLm51bWJlcnMucG9zc2libGVWYWx1ZXMpO1xufTtcblxuQmxvY2sucHJvdG90eXBlLl9iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHV0aWwuaXNNb2JpbGUpIHtcbiAgICAgICAgdXRpbC5vbih0aGlzLmVsZW1lbnQsICd0b3VjaHN0YXJ0JywgdGhpcy5fbW91c2VEb3duSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1dGlsLm9uKHRoaXMuZWxlbWVudCwgJ21vdXNlZG93bicsIHRoaXMuX21vdXNlRG93bkhhbmRsZXIuYmluZCh0aGlzKSk7XG4gICAgICAgIHV0aWwub24odGhpcy5hY3RpdmVFbGVtZW50LCAnbW91c2VvdmVyJywgdGhpcy5fbW91c2VPdmVySGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICAgICAgLy91dGlsLm9uKHRoaXMuYWN0aXZlRWxlbWVudCwgJ21vdXNlb3V0JywgdGhpcy5fbW91c2VPdXRIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgIH1cbn07XG5cbkJsb2NrLnByb3RvdHlwZS5fbW91c2VEb3duSGFuZGxlciA9IGZ1bmN0aW9uKGV2KSB7XG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcblxuICAgIGlmICh0aGlzLmdhbWUuYWJpbGl0aWVzLmN1cnJlbnRBYmlsaXR5KSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5maWVsZC5ibG9ja01vdXNlRG93bih0aGlzLmlkKTtcbn07XG5cblxuQmxvY2sucHJvdG90eXBlLl9tb3VzZU92ZXJIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5maWVsZC5ibG9ja01vdXNlT3Zlcih0aGlzLmlkKTtcbn07XG5cblxuQmxvY2sucHJvdG90eXBlLl9tb3VzZU91dEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmZpZWxkLmJsb2NrTW91c2VPdXQodGhpcy5pZCk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuY2hhbmdlUG9zaXRpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuXG4gICAgdXRpbC5zZXRQb3NpdGlvbih0aGlzLmVsZW1lbnQsIFtcbiAgICAgICAgdGhpcy54ICogdGhpcy53aWR0aCxcbiAgICAgICAgdGhpcy5maWVsZEhlaWdodCAtICh0aGlzLnkgKyAxKSAqIHRoaXMuaGVpZ2h0XG4gICAgXSk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuX3VwZGF0ZUNvbG9ycyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghY29sb3JzQ2FjaGVbdGhpcy52YWx1ZV0pIHtcbiAgICAgICAgLy8gNyAtPiAzIChwcmltZU51bWJlciAtPiByYXRpbylcbiAgICAgICAgdmFyIHByaW1lQXJyYXkgPSBbXTtcbiAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgZm9yIChpID0gcHJpbWVOdW1iZXJzLmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlICUgcHJpbWVOdW1iZXJzW2ldID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcHJpbWVBcnJheS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHByaW1lTnVtYmVyc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgaHNsOiBjb2xvcnNbaV0uaHNsLFxuICAgICAgICAgICAgICAgICAgICByYXRpbzogdGhpcy52YWx1ZSAvIHByaW1lTnVtYmVyc1tpXVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNvbG9yO1xuXG4gICAgICAgIGlmIChwcmltZUFycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgY29sb3IgPSB1dGlsLmhzbFN1bShwcmltZUFycmF5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbG9yID0gY29sb3JzWzBdLmhzbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbG9yc0NhY2hlW3RoaXMudmFsdWVdID0gJ2hzbCgnICsgY29sb3JbMF0gKyAnLCcgKyBjb2xvclsxXSAqIDEwMCArICclLCcgKyBjb2xvclsyXSAqIDEwMCArICclKSc7XG4gICAgfVxuXG4gICAgdGhpcy5pbm5lckVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY29sb3JzQ2FjaGVbdGhpcy52YWx1ZV07XG59O1xuXG5CbG9jay5wcm90b3R5cGUuY2hhbmdlVmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLnRleHRFbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuXG4gICAgdmFyIHRleHRMZW5ndGggPSB0aGlzLnZhbHVlLnRvU3RyaW5nKCkubGVuZ3RoO1xuXG4gICAgaWYgKHRleHRMZW5ndGggPj0gNSAmJiB0ZXh0TGVuZ3RoIDw9IDEwICYmIHRoaXMud2lkdGhUZXh0ICE9PSB0ZXh0TGVuZ3RoKSB7XG4gICAgICAgIGlmICh0aGlzLndpZHRoVGV4dCkge1xuICAgICAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyh0aGlzLmVsZW1lbnQsICdfbGVuXycgKyB0ZXh0TGVuZ3RoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5lbGVtZW50LCAnX2xlbl8nICsgdGV4dExlbmd0aCk7XG4gICAgfVxuXG4gICAgdGhpcy5fdXBkYXRlQ29sb3JzKCk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5hZGRDbGFzcyh0aGlzLmVsZW1lbnQsICdfc2VsZWN0ZWQnKTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS51bnNlbGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5lbGVtZW50LCAnX3NlbGVjdGVkJyk7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuYW5pbWF0ZUNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5lbGVtZW50LCAnX2JsaW5rJyk7XG5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHNlbGYuZWxlbWVudCwgJ19ibGluaycpO1xuICAgIH0sIDE1KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQmxvY2s7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAgICB7XG4gICAgICAgIHdlYjogJyM5OWI0MzMnLFxuICAgICAgICByZ2I6IFsxNTQsIDE4MCwgNTFdLFxuICAgICAgICBoc2w6IFs3Mi4wOTMwMiwgMC41NTg0NCwgMC40NTI5NF1cbiAgICB9LCB7XG4gICAgICAgIHdlYjogJyNEQTUzMkMnLFxuICAgICAgICByZ2I6IFsyMTgsIDgzLCA0NF0sXG4gICAgICAgIGhzbDogWzEzLjQ0ODI3LCAwLjcwMTYxLCAwLjUxMzcyXVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnIzFlNzE0NScsXG4gICAgICAgIHJnYjogWzMwLCAxMTMsIDY5XSxcbiAgICAgICAgaHNsOiBbMTQ4LjE5Mjc3LCAwLjU4MDQxLCAwLjI4MDM5XVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnIzJDODlBMCcsXG4gICAgICAgIHJnYjogWzQ0LCAxMzcsIDE2MF0sXG4gICAgICAgIGhzbDogWzE5MS44OTY1NSwgMC41Njg2MiwgMC40XVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnIzAwQUE4OCcsXG4gICAgICAgIHJnYjogWzAsIDE3MCwgMTM2XSxcbiAgICAgICAgaHNsOiBbMTY4LCAxLCAwLjMzMzMzXVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnIzAwZDQ1NScsXG4gICAgICAgIHJnYjogWzAsIDIxMiwgODVdLFxuICAgICAgICBoc2w6IFsxNDQuMDU2NjAsIDEsIDAuNDE1NjhdXG4gICAgfSwge1xuICAgICAgICB3ZWI6ICcjZmYyYTJhJyxcbiAgICAgICAgcmdiOiBbMjU1LCA0MiwgNDJdLFxuICAgICAgICBoc2w6IFswLCAxLCAwLjU4MjM1XVxuICAgIH0sIHtcbiAgICAgICAgd2ViOiAnI0NCNTAwMCcsXG4gICAgICAgIHJnYjogWzIwMywgODAsIDBdLFxuICAgICAgICBoc2w6IFsyMy42NDUzMiwgMSwgMC4zOTgwM11cbiAgICB9XG5dO1xuIiwidmFyIEJsb2NrID0gcmVxdWlyZSgnLi9ibG9jaycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG52YXIgZ2FtZUNvbmZpZyA9IHJlcXVpcmUoJy4uL2dhbWVDb25maWcnKTtcblxuZnVuY3Rpb24gRmllbGQoZ2FtZSwgcmVzdG9yZURhdGEpIHtcbiAgICByZXN0b3JlRGF0YSA9IHJlc3RvcmVEYXRhIHx8IHt9O1xuXG4gICAgdGhpcy5nYW1lID0gZ2FtZTtcbiAgICB0aGlzLmNvbmZpZyA9IGdhbWUuc3RvcmU7XG5cbiAgICB0aGlzLmJsb2NrcyA9IHt9O1xuICAgIHRoaXMuX2Jsb2Nrc1hZID0ge307XG4gICAgdGhpcy5zaXplID0gdGhpcy5jb25maWcuZmllbGQuc2l6ZTtcblxuICAgIHRoaXMuc2VsZWN0ZWRCbG9ja3MgPSBbXTtcbiAgICB0aGlzLnNlbGVjdGVkTW9kZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLl9jcmVhdGVFbGVtZW50KCk7XG4gICAgdGhpcy5fYmluZEV2ZW50cygpO1xuICAgIHRoaXMuX3Jlc3RvcmVEYXRhKHJlc3RvcmVEYXRhKTtcbn1cblxuRmllbGQucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNpemVbMF07IGkrKykge1xuICAgICAgICB0aGlzLl9ibG9ja3NYWVtpXSA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5zaXplWzFdOyBqKyspIHtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQmxvY2soaSwgaiwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX3Jlc3RvcmVEYXRhID0gZnVuY3Rpb24ocmVzdG9yZURhdGEpIHtcbiAgICBpZiAocmVzdG9yZURhdGEuYmxvY2tzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zaXplWzBdOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5zaXplWzFdOyBqKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJsb2Nrc1t0aGlzLl9ibG9ja3NYWVtpXVtqXV0uY2hhbmdlVmFsdWUocmVzdG9yZURhdGEuYmxvY2tzW2ldW2pdLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5jcmVhdGVCbG9jayA9IGZ1bmN0aW9uKHgsIHksIGlzSW5pdCkge1xuICAgIHZhciBibG9jayA9IG5ldyBCbG9jayh4LCB5LCB0aGlzKTtcblxuICAgIHRoaXMuYmxvY2tzW2Jsb2NrLmlkXSA9IGJsb2NrO1xuXG4gICAgdGhpcy5fYmxvY2tzWFlbeF1beV0gPSBibG9jay5pZDtcblxuICAgIGlmICghaXNJbml0KSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChibG9jay5lbGVtZW50KTtcbiAgICAgICAgYmxvY2suYW5pbWF0ZUNyZWF0ZSgpO1xuICAgIH1cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgdGhpcy5jYW52YXMuY2xhc3NOYW1lID0gJ2ZpZWxkX19jYW52YXMnO1xuXG4gICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgdGhpcy5jYW52YXMud2lkdGggPSBnYW1lQ29uZmlnLmZpZWxkLndpZHRoO1xuICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IGdhbWVDb25maWcuZmllbGQuaGVpZ2h0O1xuICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKHRoaXMuY2FudmFzKTtcblxuICAgIHV0aWwuZm9yRWFjaCh0aGlzLmJsb2NrcywgZnVuY3Rpb24oYmwpIHtcbiAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoYmwuZWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gJ2ZpZWxkJyArXG4gICAgICAgICcgX3dpZHRoXycgKyB0aGlzLnNpemVbMF0gK1xuICAgICAgICAnIF9oZWlnaHRfJyArIHRoaXMuc2l6ZVsxXTtcblxuICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChmcmFnbWVudCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2JpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodXRpbC5pc01vYmlsZSkge1xuICAgICAgICB1dGlsLm9uKGRvY3VtZW50LmJvZHksICd0b3VjaGVuZCcsIHRoaXMuX21vdXNlVXBIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgICAgICB1dGlsLm9uKGRvY3VtZW50LmJvZHksICd0b3VjaG1vdmUnLCB0aGlzLl90b3VjaE1vdmVIYW5kbGVyLmJpbmQodGhpcykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHV0aWwub24oZG9jdW1lbnQuYm9keSwgJ21vdXNldXAnLCB0aGlzLl9tb3VzZVVwSGFuZGxlci5iaW5kKHRoaXMpKTtcbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX3RvdWNoTW92ZUhhbmRsZXIgPSBmdW5jdGlvbihldikge1xuICAgIHZhciBpc0JyZWFrLCBibG9jaywga2V5cyx0b3VjaCwgdGFyZ2V0LCBpLCBqO1xuICAgIHZhciBibG9ja3MgPSB0aGlzLmJsb2NrcztcblxuICAgIGZvciAoaSA9IDA7IGkgPCBldi5jaGFuZ2VkVG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0b3VjaCA9IGV2LmNoYW5nZWRUb3VjaGVzW2ldO1xuICAgICAgICB0YXJnZXQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHRvdWNoLmNsaWVudFgsIHRvdWNoLmNsaWVudFkpO1xuXG4gICAgICAgIGlmICghdGFyZ2V0IHx8IHRhcmdldC5jbGFzc05hbWUuaW5kZXhPZignYmxvY2tfX2FjdGl2ZScpID09IC0xKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgLy8g0LTQtdC70LDQtdC8IGZvciwg0LAg0L3QtSBmb3JFYWNoLCDRh9GC0L7QsdGLINC80L7QttC90L4g0LHRi9C70L4g0YHRgtC+0L/QvdGD0YLRjFxuICAgICAgICBrZXlzID0gT2JqZWN0LmtleXMoYmxvY2tzKTtcblxuICAgICAgICBmb3IgKGogPSAwOyBqIDwga2V5cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgYmxvY2sgPSBibG9ja3Nba2V5c1tqXV07XG5cbiAgICAgICAgICAgIGlmIChibG9jay5hY3RpdmVFbGVtZW50ID09PSB0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJsb2NrTW91c2VPdmVyKGJsb2NrLmlkKTtcbiAgICAgICAgICAgICAgICBpc0JyZWFrID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0JyZWFrKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fdXBkYXRlR2FtZUNoYWluU3VtID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLnNlbGVjdGVkTW9kZSkge1xuICAgICAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW0oKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBibG9ja1ZhbHVlID0gdGhpcy5ibG9ja3NbdGhpcy5zZWxlY3RlZEJsb2Nrc1swXV0udmFsdWUgfHwgMDtcbiAgICB0aGlzLmdhbWUudXBkYXRlQ2hhaW5TdW0oYmxvY2tWYWx1ZSAqIHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fbW91c2VVcEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRoaXMuc2VsZWN0ZWRNb2RlKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5zZWxlY3RlZE1vZGUgPSBmYWxzZTtcblxuICAgIHRoaXMuX3J1blNlbGVjdGVkKCk7XG5cbiAgICB1dGlsLmZvckVhY2godGhpcy5ibG9ja3MsIGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICAgIGJsb2NrLnVuc2VsZWN0KCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl91cGRhdGVHYW1lQ2hhaW5TdW0oKTtcblxuICAgIHRoaXMuX2NsZWFyUGF0aCgpO1xufTtcblxuRmllbGQucHJvdG90eXBlLmJsb2NrTW91c2VEb3duID0gZnVuY3Rpb24oaWQpIHtcbiAgICB0aGlzLnNlbGVjdGVkTW9kZSA9IHRydWU7XG4gICAgdGhpcy5zZWxlY3RlZEJsb2NrcyA9IFtpZF07XG5cbiAgICB0aGlzLmJsb2Nrc1tpZF0uc2VsZWN0KCk7XG5cbiAgICB0aGlzLl91cGRhdGVHYW1lQ2hhaW5TdW0oKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY2hlY2tXaXRoTGFzdCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGxhc3RCbCA9IHRoaXMuYmxvY2tzW3RoaXMuc2VsZWN0ZWRCbG9ja3NbdGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggLSAxXV07XG4gICAgdmFyIG5ld0JsID0gdGhpcy5ibG9ja3NbaWRdO1xuXG4gICAgcmV0dXJuIGxhc3RCbC52YWx1ZSA9PSBuZXdCbC52YWx1ZSAmJlxuICAgICAgICBNYXRoLmFicyhsYXN0QmwueCAtIG5ld0JsLngpIDw9IDEgJiZcbiAgICAgICAgTWF0aC5hYnMobGFzdEJsLnkgLSBuZXdCbC55KSA8PSAxO1xufTtcblxuRmllbGQucHJvdG90eXBlLmJsb2NrTW91c2VPdmVyID0gZnVuY3Rpb24oaWQpIHtcbiAgICBpZiAoIXRoaXMuc2VsZWN0ZWRNb2RlKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIHNlbEJsb2NrcyA9IHRoaXMuc2VsZWN0ZWRCbG9ja3M7XG5cbiAgICBpZiAoc2VsQmxvY2tzLmluZGV4T2YoaWQpID09IC0xKSB7XG4gICAgICAgIGlmICh0aGlzLl9jaGVja1dpdGhMYXN0KGlkKSkge1xuICAgICAgICAgICAgc2VsQmxvY2tzLnB1c2goaWQpO1xuICAgICAgICAgICAgdGhpcy5ibG9ja3NbaWRdLnNlbGVjdCgpO1xuXG4gICAgICAgICAgICB0aGlzLl91cGRhdGVHYW1lQ2hhaW5TdW0oKTtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVBhdGgoKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChzZWxCbG9ja3Nbc2VsQmxvY2tzLmxlbmd0aCAtIDJdID09IGlkKSB7XG4gICAgICAgICAgICB2YXIgbGFzdEJsSWQgPSBzZWxCbG9ja3MucG9wKCk7XG4gICAgICAgICAgICB0aGlzLmJsb2Nrc1tsYXN0QmxJZF0udW5zZWxlY3QoKTtcblxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlR2FtZUNoYWluU3VtKCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVQYXRoKCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX3VwZGF0ZVBhdGggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgY3R4ID0gdGhpcy5jdHg7XG4gICAgdmFyIGZpZWxkSGVpZ2h0ID0gZ2FtZUNvbmZpZy5maWVsZC5oZWlnaHQ7XG5cbiAgICB0aGlzLl9jbGVhclBhdGgoKTtcblxuICAgIGN0eC5iZWdpblBhdGgoKTtcblxuICAgIGN0eC5zdHJva2VTdHlsZSA9IGdhbWVDb25maWcucGF0aC5jb2xvcjtcbiAgICBjdHgubGluZVdpZHRoID0gZ2FtZUNvbmZpZy5wYXRoLndpZHRoO1xuXG4gICAgdGhpcy5zZWxlY3RlZEJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uKGlkLCBpKSB7XG4gICAgICAgIHZhciBibG9jayA9IHRoaXMuYmxvY2tzW2lkXTtcbiAgICAgICAgdmFyIHggPSAoYmxvY2sueCArIDAuNSkgKiBibG9jay53aWR0aDtcbiAgICAgICAgdmFyIHkgPSBmaWVsZEhlaWdodCAtIChibG9jay55ICsgMC41KSAqIGJsb2NrLmhlaWdodDtcblxuICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgY3R4Lm1vdmVUbyh4LCB5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN0eC5saW5lVG8oeCwgeSk7XG4gICAgICAgIH1cbiAgICB9LCB0aGlzKTtcblxuICAgIGN0eC5zdHJva2UoKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fY2xlYXJQYXRoID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIGdhbWVDb25maWcuZmllbGQud2lkdGgsIGdhbWVDb25maWcuZmllbGQuaGVpZ2h0KTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5ibG9ja01vdXNlT3V0ID0gZnVuY3Rpb24oaWQpIHtcblxufTtcblxuRmllbGQucHJvdG90eXBlLmJsb2NrUmVtb3ZlID0gZnVuY3Rpb24oaWQpIHtcbiAgICB2YXIgYmxvY2sgPSB0aGlzLmJsb2Nrc1tpZF07XG5cbiAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQ2hpbGQoYmxvY2suZWxlbWVudCk7XG5cbiAgICB0aGlzLl9ibG9ja3NYWVtibG9jay54XVtibG9jay55XSA9IG51bGw7XG4gICAgZGVsZXRlIHRoaXMuYmxvY2tzW2lkXTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fcnVuU2VsZWN0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggPCB0aGlzLmNvbmZpZy5jaGFpbi5taW5MZW5ndGgpIHsgcmV0dXJuOyB9XG5cbiAgICB2YXIgYmxvY2tWYWx1ZSA9IHRoaXMuYmxvY2tzW3RoaXMuc2VsZWN0ZWRCbG9ja3NbMF1dLnZhbHVlIHx8IDA7XG4gICAgdmFyIGsgPSAxICsgMC4yICogKHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoIC0gMyk7XG4gICAgdGhpcy5nYW1lLnVwU2NvcmUoYmxvY2tWYWx1ZSAqIHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoICogayk7XG5cbiAgICB2YXIgbGFzdEJsSWQgPSB0aGlzLnNlbGVjdGVkQmxvY2tzLnBvcCgpO1xuICAgIHZhciBsYXN0QmwgPSB0aGlzLmJsb2Nrc1tsYXN0QmxJZF07XG4gICAgdmFyIHZhbHVlID0gbGFzdEJsLnZhbHVlICogKHRoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoICsgMSk7IC8vICsxIGJlY2F1c2UgcG9wIGFib3ZlXG5cbiAgICBsYXN0QmwuY2hhbmdlVmFsdWUodmFsdWUpO1xuXG4gICAgdGhpcy5zZWxlY3RlZEJsb2Nrcy5mb3JFYWNoKHRoaXMuYmxvY2tSZW1vdmUsIHRoaXMpO1xuXG4gICAgdGhpcy5jaGVja1Bvc2l0aW9ucygpO1xuXG4gICAgdGhpcy5nYW1lLnNhdmVTdGF0ZSgpO1xufTtcblxuRmllbGQucHJvdG90eXBlLmNoZWNrUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIGJsb2Nrc1hZID0gdGhpcy5fYmxvY2tzWFk7XG4gICAgdmFyIGJsb2NrcyA9IHRoaXMuYmxvY2tzO1xuXG4gICAgdXRpbC5mb3JFYWNoKGJsb2Nrc1hZLCBmdW5jdGlvbihibG9ja3NZKSB7XG4gICAgICAgIHZhciBhcnIgPSBbXTtcblxuICAgICAgICAvLyDQtNC+0LHQsNCy0LvRj9C10Lwg0LIg0LzQsNGB0YHQuNCyINGB0YPRidC10YHRgtCy0YPRjtGJ0LjQtSDQstC10YDRgtC40LrQsNC70YzQvdGL0LUg0Y3Qu9C10LzQtdC90YLRi1xuICAgICAgICB1dGlsLmZvckVhY2goYmxvY2tzWSwgZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIGlmIChpZCkgeyBhcnIucHVzaChpZCk7IH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g0LXRgdC70Lgg0L/QvtC70L3Ri9C5INC40LvQuCDQv9GD0YHRgtC+0LlcbiAgICAgICAgaWYgKGFyci5sZW5ndGggPT0gc2VsZi5zaXplWzFdIHx8ICFhcnIpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgLy8g0YHQvtGA0YLQuNGA0YPQtdC8XG4gICAgICAgIGFyci5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBibG9ja3NbYV0ueSA+IGJsb2Nrc1tiXS55O1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDRgdC00LLQuNCz0LDQtdC8INC+0YLRgdC+0YDRgtC40YDQvtCy0LDQvdC90YvQuSDRgdC/0LjRgdC+0Log0Log0L3QuNC30YNcbiAgICAgICAgYXJyLmZvckVhY2goZnVuY3Rpb24oaWQsIHkpIHtcbiAgICAgICAgICAgIHZhciBibG9jayA9IGJsb2Nrc1tpZF07XG5cbiAgICAgICAgICAgIGlmIChibG9jay55ICE9IHkpIHtcbiAgICAgICAgICAgICAgICBibG9ja3NZW2Jsb2NrLnldID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIGJsb2NrLmNoYW5nZVBvc2l0aW9uKGJsb2NrLngsIHkpO1xuXG4gICAgICAgICAgICAgICAgYmxvY2tzWVt5XSA9IGlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRoaXMuX2FkZE5ld0Jsb2NrcygpO1xufTtcblxuRmllbGQucHJvdG90eXBlLl9hZGROZXdCbG9ja3MgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYmxvY2tzWFkgPSB0aGlzLl9ibG9ja3NYWTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zaXplWzBdOyBpKyspIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLnNpemVbMV07IGorKykge1xuICAgICAgICAgICAgaWYgKCFibG9ja3NYWVtpXVtqXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlQmxvY2soaSwgaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuZ2V0U3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3RhdGUgPSB7XG4gICAgICAgIGJsb2Nrczoge31cbiAgICB9O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNpemVbMF07IGkrKykge1xuICAgICAgICBzdGF0ZS5ibG9ja3NbaV0gPSB7fTtcblxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuc2l6ZVsxXTsgaisrKSB7XG4gICAgICAgICAgICBzdGF0ZS5ibG9ja3NbaV1bal0gPSB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IHRoaXMuYmxvY2tzW3RoaXMuX2Jsb2Nrc1hZW2ldW2pdXS52YWx1ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzdGF0ZTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5nZXRCbG9jayA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB2YXIgcm93WSA9IHRoaXMuX2Jsb2Nrc1hZW3hdO1xuXG4gICAgaWYgKCFyb3dZKSB7IHJldHVybiBudWxsOyB9XG5cbiAgICB2YXIgaWQgPSByb3dZW3ldO1xuXG4gICAgaWYgKCFpZCkgeyByZXR1cm4gbnVsbDsgfVxuXG4gICAgcmV0dXJuIHRoaXMuYmxvY2tzW2lkXTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRmllbGQ7XG4iLCJ2YXIgbGV2ZWxTdG9yZSA9IHJlcXVpcmUoJy4uL2xldmVsU3RvcmUnKTtcbnZhciBnYW1lQ29uZmlnID0gcmVxdWlyZSgnLi4vZ2FtZUNvbmZpZycpO1xudmFyIGFuYWx5dGljcyA9IHJlcXVpcmUoJy4uL2FuYWx5dGljcycpO1xudmFyIEFiaWxpdGllcyA9IHJlcXVpcmUoJy4vYWJpbGl0aWVzJyk7XG52YXIgRmllbGQgPSByZXF1aXJlKCcuL2ZpZWxkJyk7XG52YXIgc2F2ZXMgPSByZXF1aXJlKCcuLi9zYXZlcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbmZ1bmN0aW9uIEdhbWUobmFtZSwgc3RhdGUsIHJlc3RvcmVEYXRhKSB7XG4gICAgcmVzdG9yZURhdGEgPSByZXN0b3JlRGF0YSB8fCB7fTtcblxuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgIHRoaXMuc3RvcmUgPSBsZXZlbFN0b3JlLmdldChuYW1lKTtcblxuICAgIHRoaXMuc2NvcmUgPSByZXN0b3JlRGF0YS5zY29yZSB8fCAwO1xuXG4gICAgdGhpcy5maWVsZCA9IG5ldyBGaWVsZCh0aGlzLCByZXN0b3JlRGF0YS5maWVsZCk7XG4gICAgdGhpcy5hYmlsaXRpZXMgPSBuZXcgQWJpbGl0aWVzKHRoaXMsIHJlc3RvcmVEYXRhLmFiaWxpdGllcyk7XG5cbiAgICB0aGlzLl9jcmVhdGVFbGVtZW50KCk7XG4gICAgdGhpcy5fYmluZEV2ZW50cygpO1xuICAgIHRoaXMuX2NoZWNrRmlyc3QoKTtcbn1cblxuR2FtZS5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2dhbWUnO1xuXG4gICAgdmFyIHRlbXBsYXRlID1cbiAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19oZWFkZXJcIj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9fbGV2ZWxOYW1lXCI+TGV2ZWw6IHt7bmFtZX19PC9kaXY+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX3Njb3JlXCI+e3tzY29yZX19PC9kaXY+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX2NoYWluU3VtXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX21heFNjb3JlXCI+TWF4IHNjb3JlOiB7e21heFNjb3JlfX08L2Rpdj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9fZ29hbFwiPnt7Z29hbH19PC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19ib2R5XCI+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX21lc3NhZ2VcIj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX21lc3NhZ2VJbm5lclwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX21lc3NhZ2VUZXh0XCI+PC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9fbWVzc2FnZUJ1dHRvbnNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9fbWVzc2FnZVJldHVyblwiPkNvbnRpbnVlPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX2ZpZWxkXCI+PC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19mb290ZXJcIj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZ2FtZV9fYWJpbGl0aWVzXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX2J1dHRvbnNcIj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImdhbWVfX2JhY2tCdXR0b25cIj5CYWNrPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJnYW1lX19yZXN0YXJ0QnV0dG9uXCI+UmVzdGFydDwvZGl2PicgK1xuICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPC9kaXY+JztcblxuICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gdGVtcGxhdGVcbiAgICAgICAgLnJlcGxhY2UoJ3t7c2NvcmV9fScsIHRoaXMuc2NvcmUpXG4gICAgICAgIC5yZXBsYWNlKCd7e2dvYWx9fScsIHRoaXMuX2dldEdvYWxUZXh0KCkpXG4gICAgICAgIC5yZXBsYWNlKCd7e25hbWV9fScsIHRoaXMubmFtZSlcbiAgICAgICAgLnJlcGxhY2UoJ3t7bWF4U2NvcmV9fScsIHRoaXMuc3RvcmUubWF4U2NvcmUpO1xuXG4gICAgdGhpcy5iYWNrQnV0dG9uID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdnYW1lX19iYWNrQnV0dG9uJylbMF07XG4gICAgdGhpcy5yZXN0YXJ0QnV0dG9uID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdnYW1lX19yZXN0YXJ0QnV0dG9uJylbMF07XG5cbiAgICB0aGlzLmFiaWxpdGllc0VsZW1lbnQgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dhbWVfX2FiaWxpdGllcycpWzBdO1xuICAgIHRoaXMuYWJpbGl0aWVzRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmFiaWxpdGllcy5lbGVtZW50KTtcblxuICAgIHRoaXMuZ29hbEVsZW1lbnQgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dhbWVfX2dvYWwnKVswXTtcbiAgICB0aGlzLnNjb3JlRWxlbWVudCA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnZ2FtZV9fc2NvcmUnKVswXTtcbiAgICB0aGlzLmNoYWluU3VtRWxlbWVudCA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnZ2FtZV9fY2hhaW5TdW0nKVswXTtcbiAgICB0aGlzLm1heFNjb3JlRWxlbWVudCA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnZ2FtZV9fbWF4U2NvcmUnKVswXTtcblxuICAgIHRoaXMubWVzc2FnZUVsZW1lbnQgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dhbWVfX21lc3NhZ2UnKVswXTtcbiAgICB0aGlzLm1lc3NhZ2VUZXh0RWxlbWVudCA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnZ2FtZV9fbWVzc2FnZVRleHQnKVswXTtcbiAgICB0aGlzLm1lc3NhZ2VSZXR1cm5CdXR0b24gPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dhbWVfX21lc3NhZ2VSZXR1cm4nKVswXTtcblxuICAgIHRoaXMuZmllbGRFbGVtZW50ID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdnYW1lX19maWVsZCcpWzBdO1xuICAgIHRoaXMuZmllbGRFbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuZmllbGQuZWxlbWVudCk7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xufTtcblxuR2FtZS5wcm90b3R5cGUuX2JpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICB1dGlsLm9uKHRoaXMucmVzdGFydEJ1dHRvbiwgJ2NsaWNrJywgdGhpcy5yZXN0YXJ0LmJpbmQodGhpcykpO1xuICAgIHV0aWwub24odGhpcy5iYWNrQnV0dG9uLCAnY2xpY2snLCB0aGlzLl9iYWNrVG9NZW51LmJpbmQodGhpcykpO1xuICAgIHV0aWwub24odGhpcy5tZXNzYWdlUmV0dXJuQnV0dG9uLCAnY2xpY2snLCB0aGlzLl9oaWRlTWVzc2FnZS5iaW5kKHRoaXMpKTtcbn07XG5cbkdhbWUucHJvdG90eXBlLl9jaGVja0ZpcnN0ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHNhdmVzLmlzRmlyc3RHYW1lKCkpIHtcbiAgICAgICAgdGhpcy5zaG93TWVzc2FnZShnYW1lQ29uZmlnLm1lc3NhZ2UuZmlyc3QpO1xuICAgIH1cbn07XG5cbkdhbWUucHJvdG90eXBlLl9nZXRHb2FsVGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnN0b3JlLmN1cnJlbnRHb2FsIDw9IDMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RvcmUuZ29hbHNbdGhpcy5zdG9yZS5jdXJyZW50R29hbF07XG4gICAgfVxuXG4gICAgcmV0dXJuICcnO1xufTtcblxuR2FtZS5wcm90b3R5cGUucmVzdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc2NvcmUgPSAwO1xuICAgIHRoaXMuc2NvcmVFbGVtZW50LmlubmVySFRNTCA9IDA7XG5cbiAgICB2YXIgbmV3RmllbGQgPSBuZXcgRmllbGQodGhpcyk7XG4gICAgdGhpcy5maWVsZEVsZW1lbnQucmVwbGFjZUNoaWxkKG5ld0ZpZWxkLmVsZW1lbnQsIHRoaXMuZmllbGQuZWxlbWVudCk7XG4gICAgdGhpcy5maWVsZCA9IG5ld0ZpZWxkO1xuXG4gICAgdmFyIG5ld0FiaWxpdGllcyA9IG5ldyBBYmlsaXRpZXModGhpcyk7XG4gICAgdGhpcy5hYmlsaXRpZXNFbGVtZW50LnJlcGxhY2VDaGlsZChuZXdBYmlsaXRpZXMuZWxlbWVudCwgdGhpcy5hYmlsaXRpZXMuZWxlbWVudCk7XG4gICAgdGhpcy5hYmlsaXRpZXMgPSBuZXdBYmlsaXRpZXM7XG5cbiAgICB0aGlzLnNhdmVTdGF0ZSgpO1xuXG4gICAgYW5hbHl0aWNzLmxldmVsUmVzdGFydCh0aGlzLm5hbWUpO1xufTtcblxuR2FtZS5wcm90b3R5cGUuX2JhY2tUb01lbnUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN0YXRlLmJhY2tGcm9tTGV2ZWwoKTtcbn07XG5cbkdhbWUucHJvdG90eXBlLnVwZGF0ZUNoYWluU3VtID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB1dGlsLnJlbW92ZUNsYXNzKHRoaXMuY2hhaW5TdW1FbGVtZW50LCAnX3Nob3dlZCcpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jaGFpblN1bUVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XG4gICAgdXRpbC5hZGRDbGFzcyh0aGlzLmNoYWluU3VtRWxlbWVudCwgJ19zaG93ZWQnKTtcbn07XG5cbkdhbWUucHJvdG90eXBlLnVwU2NvcmUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHRoaXMuc2NvcmUgKz0gTWF0aC5yb3VuZCh2YWx1ZSk7XG4gICAgdGhpcy5zY29yZUVsZW1lbnQuaW5uZXJIVE1MID0gdGhpcy5zY29yZTtcblxuICAgIGlmICh0aGlzLnN0b3JlLm1heFNjb3JlIDwgdGhpcy5zY29yZSkge1xuICAgICAgICB0aGlzLnN0b3JlLm1heFNjb3JlID0gdGhpcy5zY29yZTtcbiAgICAgICAgdGhpcy5tYXhTY29yZUVsZW1lbnQuaW5uZXJIVE1MID0gJ01heCBzY29yZTogJyArIHRoaXMuc2NvcmU7XG4gICAgICAgIGFuYWx5dGljcy5tYXhTY29yZVVwKHRoaXMuc2NvcmUpO1xuICAgIH1cblxuICAgIHRoaXMuX2NoZWNrR29hbCgpO1xuXG4gICAgdGhpcy5hYmlsaXRpZXMuY2hlY2tVcCgpO1xuXG4gICAgbGV2ZWxTdG9yZS5zYXZlTGV2ZWxzKCk7XG59O1xuXG5HYW1lLnByb3RvdHlwZS5fY2hlY2tHb2FsID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuc3RvcmUuY3VycmVudEdvYWwgPT0gMykgeyByZXR1cm47IH1cblxuICAgIHZhciBzdG9yZSA9IHRoaXMuc3RvcmU7XG5cbiAgICBpZiAodGhpcy5zY29yZSA+PSBzdG9yZS53aW5Db25kaXRpb25zW3N0b3JlLmN1cnJlbnRHb2FsXSkge1xuICAgICAgICBzdG9yZS5jdXJyZW50R29hbCA9IE1hdGgubWluKHN0b3JlLmN1cnJlbnRHb2FsICsgMSwgMyk7XG5cbiAgICAgICAgaWYgKHN0b3JlLmN1cnJlbnRHb2FsID09IDEpIHsgdGhpcy5fd2luKCk7IH1cblxuICAgICAgICB0aGlzLmdvYWxFbGVtZW50LmlubmVySFRNTCA9IHRoaXMuX2dldEdvYWxUZXh0KCk7XG5cbiAgICAgICAgYW5hbHl0aWNzLmdvYWxBY2hpdmVkKHN0b3JlLmN1cnJlbnRHb2FsKTtcbiAgICB9XG59O1xuXG5HYW1lLnByb3RvdHlwZS5fd2luID0gZnVuY3Rpb24oKSB7XG4gICAgbGV2ZWxTdG9yZS5jaGVja09wZW5MZXZlbHMoKTtcbn07XG5cbkdhbWUucHJvdG90eXBlLmdldFN0YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGQ6IHRoaXMuZmllbGQuZ2V0U3RhdGUoKSxcbiAgICAgICAgYWJpbGl0aWVzOiB0aGlzLmFiaWxpdGllcy5nZXRTdGF0ZSgpLFxuICAgICAgICBuYW1lOiB0aGlzLm5hbWUsXG4gICAgICAgIHNjb3JlOiB0aGlzLnNjb3JlXG4gICAgfTtcbn07XG5cbkdhbWUucHJvdG90eXBlLnNhdmVTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3RhdGUuc2F2ZUFjdGl2ZUxldmVsKCk7XG59O1xuXG5HYW1lLnByb3RvdHlwZS5zaG93TWVzc2FnZSA9IGZ1bmN0aW9uKHRleHQpIHtcbiAgICB0aGlzLm1lc3NhZ2VUZXh0RWxlbWVudC5pbm5lckhUTUwgPSB0ZXh0O1xuICAgIHV0aWwuYWRkQ2xhc3ModGhpcy5tZXNzYWdlRWxlbWVudCwgJ19hY3RpdmUnKTtcbn07XG5cbkdhbWUucHJvdG90eXBlLl9oaWRlTWVzc2FnZSA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwucmVtb3ZlQ2xhc3ModGhpcy5tZXNzYWdlRWxlbWVudCwgJ19hY3RpdmUnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR2FtZTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGZpZWxkOiB7XG4gICAgICAgIHdpZHRoOiA1MDAsXG4gICAgICAgIGhlaWdodDogNTAwXG4gICAgfSxcbiAgICBwYXRoOiB7XG4gICAgICAgIGNvbG9yOiAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjI1KScsXG4gICAgICAgIHdpZHRoOiAxMFxuICAgIH0sXG4gICAgcHJvZ3Jlc3NCYXI6IHtcbiAgICAgICAgd2lkdGg6IDQ5MFxuICAgIH0sXG4gICAgbGV2ZWxzOiBbMSwgMiwgMywgNCwgNV0sXG4gICAgbWluT3BlbkxldmVsczogNSxcblxuICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgZmlyc3Q6ICdKb2luIHRocmVlIG9yIG1vcmUgYmxvY2tzIHdpdGggZXF1YWwgbnVtYmVycyB0byBnZXQgcG9pbnRzJ1xuICAgIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAxOiB7XG4gICAgICAgIGZpZWxkOiB7XG4gICAgICAgICAgICBzaXplOiBbNCwgNF1cbiAgICAgICAgfSxcbiAgICAgICAgbnVtYmVyczoge1xuICAgICAgICAgICAgcG9zc2libGVWYWx1ZXM6IFtcbiAgICAgICAgICAgICAgICBbMSwgMV0sXG4gICAgICAgICAgICAgICAgWzIsIDFdXG4gICAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIGNoYWluOiB7XG4gICAgICAgICAgICBtaW5MZW5ndGg6IDNcbiAgICAgICAgfSxcbiAgICAgICAgd2luQ29uZGl0aW9uczogWzEwMDAsIDMwMDAsIDYwMDBdLFxuICAgICAgICBnb2FsczogW1xuICAgICAgICAgICAgJ0dvYWw6IDEwMDAnLFxuICAgICAgICAgICAgJ05leHQgZ29hbDogMzAwMCcsXG4gICAgICAgICAgICAnTGFzdCBnb2FsOiA2MDAwJyxcbiAgICAgICAgICAgICdBY2hpZXZlZCEnXG4gICAgICAgIF0sXG4gICAgICAgIGFiaWxpdHk6IHtcbiAgICAgICAgICAgIGhhbW1lcjoge1xuICAgICAgICAgICAgICAgIGNvdW50OiAxLFxuICAgICAgICAgICAgICAgIHJhdGlvOiAxMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvbWI6IHtcbiAgICAgICAgICAgICAgICBjb3VudDogMCxcbiAgICAgICAgICAgICAgICByYXRpbzogMVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxpZ2h0bmluZzoge1xuICAgICAgICAgICAgICAgIGNvdW50OiAwLFxuICAgICAgICAgICAgICAgIHJhdGlvOiAxXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGFiaWxpdHlQZXJTY29yZTogNzAwXG4gICAgfSxcbiAgICAyOiB7XG4gICAgICAgIGZpZWxkOiB7XG4gICAgICAgICAgICBzaXplOiBbNSwgNV1cbiAgICAgICAgfSxcbiAgICAgICAgbnVtYmVyczoge1xuICAgICAgICAgICAgcG9zc2libGVWYWx1ZXM6IFtcbiAgICAgICAgICAgICAgICBbMSwgMV0sXG4gICAgICAgICAgICAgICAgWzIsIDFdLFxuICAgICAgICAgICAgICAgIFszLCAxXVxuICAgICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBjaGFpbjoge1xuICAgICAgICAgICAgbWluTGVuZ3RoOiAzXG4gICAgICAgIH0sXG4gICAgICAgIHdpbkNvbmRpdGlvbnM6IFsxMDAwMCwgMjUwMDAsIDUwMDAwXSxcbiAgICAgICAgZ29hbHM6IFtcbiAgICAgICAgICAgICdHb2FsOiAxMDAwMCcsXG4gICAgICAgICAgICAnTmV4dCBnb2FsOiAyNTAwMCcsXG4gICAgICAgICAgICAnTGFzdCBnb2FsOiA1MDAwMCcsXG4gICAgICAgICAgICAnQWNoaWV2ZWQhJ1xuICAgICAgICBdLFxuICAgICAgICBhYmlsaXR5OiB7XG4gICAgICAgICAgICBoYW1tZXI6IHtcbiAgICAgICAgICAgICAgICBjb3VudDogMSxcbiAgICAgICAgICAgICAgICByYXRpbzogMTBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib21iOiB7XG4gICAgICAgICAgICAgICAgY291bnQ6IDAsXG4gICAgICAgICAgICAgICAgcmF0aW86IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsaWdodG5pbmc6IHtcbiAgICAgICAgICAgICAgICBjb3VudDogMCxcbiAgICAgICAgICAgICAgICByYXRpbzogMVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBhYmlsaXR5UGVyU2NvcmU6IDMwMDBcbiAgICB9LFxuICAgIDM6IHtcbiAgICAgICAgZmllbGQ6IHtcbiAgICAgICAgICAgIHNpemU6IFs0LCA0XVxuICAgICAgICB9LFxuICAgICAgICBudW1iZXJzOiB7XG4gICAgICAgICAgICBwb3NzaWJsZVZhbHVlczogW1xuICAgICAgICAgICAgICAgIFszLCAxXSxcbiAgICAgICAgICAgICAgICBbNSwgMV0sXG4gICAgICAgICAgICAgICAgWzcsIDFdXG4gICAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIGNoYWluOiB7XG4gICAgICAgICAgICBtaW5MZW5ndGg6IDNcbiAgICAgICAgfSxcbiAgICAgICAgd2luQ29uZGl0aW9uczogWzUwMCwgMTI1MCwgMjUwMF0sXG4gICAgICAgIGdvYWxzOiBbXG4gICAgICAgICAgICAnR29hbDogNTAwJyxcbiAgICAgICAgICAgICdOZXh0IGdvYWw6IDEyNTAnLFxuICAgICAgICAgICAgJ0xhc3QgZ29hbDogMjUwMCcsXG4gICAgICAgICAgICAnQWNoaWV2ZWQhJ1xuICAgICAgICBdLFxuICAgICAgICBhYmlsaXR5OiB7XG4gICAgICAgICAgICBoYW1tZXI6IHtcbiAgICAgICAgICAgICAgICBjb3VudDogMSxcbiAgICAgICAgICAgICAgICByYXRpbzogNVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvbWI6IHtcbiAgICAgICAgICAgICAgICBjb3VudDogMCxcbiAgICAgICAgICAgICAgICByYXRpbzogMVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxpZ2h0bmluZzoge1xuICAgICAgICAgICAgICAgIGNvdW50OiAwLFxuICAgICAgICAgICAgICAgIHJhdGlvOiAzXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGFiaWxpdHlQZXJTY29yZTogMTUwXG4gICAgfSxcbiAgICA0OiB7XG4gICAgICAgIGZpZWxkOiB7XG4gICAgICAgICAgICBzaXplOiBbNSwgNV1cbiAgICAgICAgfSxcbiAgICAgICAgbnVtYmVyczoge1xuICAgICAgICAgICAgcG9zc2libGVWYWx1ZXM6IFtcbiAgICAgICAgICAgICAgICBbMSwgMzJdLFxuICAgICAgICAgICAgICAgIFszLCAzMl0sXG4gICAgICAgICAgICAgICAgWzUsIDMyXSxcbiAgICAgICAgICAgICAgICBbMTM1LCA0XVxuICAgICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBjaGFpbjoge1xuICAgICAgICAgICAgbWluTGVuZ3RoOiAzXG4gICAgICAgIH0sXG4gICAgICAgIHdpbkNvbmRpdGlvbnM6IFs4MDAwLCAzMjAwMCwgMTUwMDAwXSxcbiAgICAgICAgZ29hbHM6IFtcbiAgICAgICAgICAgICdHb2FsOiA4MDAwMCcsXG4gICAgICAgICAgICAnTmV4dCBnb2FsOiAzMjAwMCcsXG4gICAgICAgICAgICAnTGFzdCBnb2FsOiAxNTAwMDAnLFxuICAgICAgICAgICAgJ0FjaGlldmVkISdcbiAgICAgICAgXSxcbiAgICAgICAgYWJpbGl0eToge1xuICAgICAgICAgICAgaGFtbWVyOiB7XG4gICAgICAgICAgICAgICAgY291bnQ6IDEsXG4gICAgICAgICAgICAgICAgcmF0aW86IDVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib21iOiB7XG4gICAgICAgICAgICAgICAgY291bnQ6IDAsXG4gICAgICAgICAgICAgICAgcmF0aW86IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsaWdodG5pbmc6IHtcbiAgICAgICAgICAgICAgICBjb3VudDogMCxcbiAgICAgICAgICAgICAgICByYXRpbzogMVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBhYmlsaXR5UGVyU2NvcmU6IDEwMDBcbiAgICB9LFxuICAgIDU6IHtcbiAgICAgICAgZmllbGQ6IHtcbiAgICAgICAgICAgIHNpemU6IFs1LCA1XVxuICAgICAgICB9LFxuICAgICAgICBudW1iZXJzOiB7XG4gICAgICAgICAgICBwb3NzaWJsZVZhbHVlczogW1xuICAgICAgICAgICAgICAgIFsxLCAxXSxcbiAgICAgICAgICAgICAgICBbMiwgMV0sXG4gICAgICAgICAgICAgICAgWzMsIDFdLFxuICAgICAgICAgICAgICAgIFs1LCAxXVxuICAgICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICBjaGFpbjoge1xuICAgICAgICAgICAgbWluTGVuZ3RoOiAzXG4gICAgICAgIH0sXG4gICAgICAgIHdpbkNvbmRpdGlvbnM6IFs1MCwgMTAwLCAxNTBdLFxuICAgICAgICBnb2FsczogW1xuICAgICAgICAgICAgJ0dvYWw6IDUwJyxcbiAgICAgICAgICAgICdOZXh0IGdvYWw6IDEwMCcsXG4gICAgICAgICAgICAnTGFzdCBnb2FsOiAxNTAnLFxuICAgICAgICAgICAgJ0FjaGlldmVkISdcbiAgICAgICAgXSxcbiAgICAgICAgYWJpbGl0eToge1xuICAgICAgICAgICAgaGFtbWVyOiB7XG4gICAgICAgICAgICAgICAgY291bnQ6IDIsXG4gICAgICAgICAgICAgICAgcmF0aW86IDVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib21iOiB7XG4gICAgICAgICAgICAgICAgY291bnQ6IDEsXG4gICAgICAgICAgICAgICAgcmF0aW86IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsaWdodG5pbmc6IHtcbiAgICAgICAgICAgICAgICBjb3VudDogMSxcbiAgICAgICAgICAgICAgICByYXRpbzogMVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBhYmlsaXR5UGVyU2NvcmU6IDIwXG4gICAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIDE6IHJlcXVpcmUoJy4vbGV2ZWxzLzEnKSxcbiAgICAyOiByZXF1aXJlKCcuL2xldmVscy8xJyksXG4gICAgMzogcmVxdWlyZSgnLi9sZXZlbHMvMScpLFxuICAgIDQ6IHJlcXVpcmUoJy4vbGV2ZWxzLzEnKSxcbiAgICA1OiByZXF1aXJlKCcuL2xldmVscy8xJylcbn07XG4iLCJ2YXIgbGV2ZWxDb25maWcgPSByZXF1aXJlKCcuL2xldmVsQ29uZmlnJyk7XG52YXIgZ2FtZUNvbmZpZyA9IHJlcXVpcmUoJy4vZ2FtZUNvbmZpZycpO1xudmFyIHNhdmVzID0gcmVxdWlyZSgnLi9zYXZlcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxudmFyIGxldmVsU3RvcmUgPSB7fTtcblxudmFyIGxldmVscyA9IHt9O1xuXG5mdW5jdGlvbiBpbml0TGV2ZWxzKCkge1xuICAgIHZhciBzYXZlZExldmVscyA9IHNhdmVzLmdldExldmVscygpO1xuXG4gICAgZ2FtZUNvbmZpZy5sZXZlbHMuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHZhciBsZXZlbCA9IGxldmVsQ29uZmlnW25hbWVdO1xuICAgICAgICBsZXZlbC5uYW1lID0gbmFtZTtcblxuICAgICAgICBzYXZlZExldmVsc1tuYW1lXSA9IHNhdmVkTGV2ZWxzW25hbWVdIHx8IHt9O1xuXG4gICAgICAgIGxldmVsLmN1cnJlbnRHb2FsID0gc2F2ZWRMZXZlbHNbbmFtZV0uY3VycmVudEdvYWwgfHwgMDtcbiAgICAgICAgbGV2ZWwubWF4U2NvcmUgPSBzYXZlZExldmVsc1tuYW1lXS5tYXhTY29yZSB8fCAwO1xuXG4gICAgICAgIGxldmVsc1tuYW1lXSA9IGxldmVsO1xuICAgIH0pO1xuXG4gICAgbGV2ZWxTdG9yZS5jaGVja09wZW5MZXZlbHMoKTtcbn1cblxubGV2ZWxTdG9yZS5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIGxldmVsc1tuYW1lXTtcbn07XG5cbmxldmVsU3RvcmUuY2hlY2tPcGVuTGV2ZWxzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG9wZW5MZXZlbHNMZW5ndGggPSAwO1xuXG4gICAgZ2FtZUNvbmZpZy5sZXZlbHMuZm9yRWFjaChmdW5jdGlvbihuYW1lLCBpKSB7XG4gICAgICAgIHZhciBsZXZlbCA9IGxldmVsc1tuYW1lXTtcblxuICAgICAgICBpZiAobGV2ZWwuY3VycmVudEdvYWwgPiAwKSB7XG4gICAgICAgICAgICBvcGVuTGV2ZWxzTGVuZ3RoKys7XG4gICAgICAgIH1cblxuICAgICAgICBsZXZlbC5pc09wZW4gPSBpIDwgb3BlbkxldmVsc0xlbmd0aCArIGdhbWVDb25maWcubWluT3BlbkxldmVscztcbiAgICB9KTtcbn07XG5cbmxldmVsU3RvcmUuc2F2ZUxldmVscyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkYXRhVG9TYXZlID0ge307XG5cbiAgICB1dGlsLmZvckVhY2gobGV2ZWxzLCBmdW5jdGlvbihsZXZlbCwgbmFtZSkge1xuICAgICAgICBkYXRhVG9TYXZlW25hbWVdID0ge1xuICAgICAgICAgICAgbWF4U2NvcmU6IGxldmVsLm1heFNjb3JlLFxuICAgICAgICAgICAgY3VycmVudEdvYWw6IGxldmVsLmN1cnJlbnRHb2FsXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHNhdmVzLnNldExldmVscyhkYXRhVG9TYXZlKTtcbn07XG5cbmluaXRMZXZlbHMoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBsZXZlbFN0b3JlO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi9nYW1lL2dhbWUnKTtcbiIsInZhciBsZXZlbFN0b3JlID0gcmVxdWlyZSgnLi4vbGV2ZWxTdG9yZScpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbmZ1bmN0aW9uIExldmVsQmxvY2sobGV2ZWxNZW51LCBuYW1lLCBvcmRlcikge1xuICAgIHRoaXMubGV2ZWxNZW51ID0gbGV2ZWxNZW51O1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG5cbiAgICB0aGlzLnN0b3JlID0gbGV2ZWxTdG9yZS5nZXQodGhpcy5uYW1lKTtcblxuICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZWxlbWVudC5jbGFzc05hbWUgPSAnbGV2ZWxCbG9jayBfbGV2ZWxfJyArIG9yZGVyICUgMztcblxuICAgIHZhciB0ZW1wbGF0ZSA9XG4gICAgICAgICc8ZGl2IGNsYXNzPVwibGV2ZWxCbG9ja19fc2NvcmVcIj48L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJsZXZlbEJsb2NrX190ZXh0XCI+e3tuYW1lfX08L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJsZXZlbEJsb2NrX19nb2FsXCI+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImxldmVsQmxvY2tfX2dvYWxQb2ludFwiPjwvZGl2PicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJsZXZlbEJsb2NrX19nb2FsUG9pbnRcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwibGV2ZWxCbG9ja19fZ29hbFBvaW50XCI+PC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj4nO1xuXG4gICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9IHRlbXBsYXRlLnJlcGxhY2UoJ3t7bmFtZX19JywgbmFtZSk7XG5cbiAgICB0aGlzLnNjb3JlRWxlbWVudCA9IHRoaXMuZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdsZXZlbEJsb2NrX19zY29yZScpWzBdO1xuICAgIHRoaXMuZ29hbEVsZW1lbnRzID0gdGhpcy5lbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2xldmVsQmxvY2tfX2dvYWxQb2ludCcpO1xuXG4gICAgdGhpcy5pc09wZW4gPSBmYWxzZTtcblxuICAgIHV0aWwub24odGhpcy5lbGVtZW50LCAnY2xpY2snLCB0aGlzLl9vbkNsaWNrLmJpbmQodGhpcykpO1xufVxuXG5MZXZlbEJsb2NrLnByb3RvdHlwZS5fb25DbGljayA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMubGV2ZWxNZW51LnJ1bkxldmVsKHRoaXMubmFtZSk7XG59O1xuXG5MZXZlbEJsb2NrLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZ29hbEVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChpICsgMSA8PSB0aGlzLnN0b3JlLmN1cnJlbnRHb2FsKSB7XG4gICAgICAgICAgICB1dGlsLmFkZENsYXNzKHRoaXMuZ29hbEVsZW1lbnRzW2ldLCAnX2FjdGl2ZScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyh0aGlzLmdvYWxFbGVtZW50c1tpXSwgJ19hY3RpdmUnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuc2NvcmVFbGVtZW50LmlubmVySFRNTCA9ICdTY29yZTogJyArIHRoaXMuc3RvcmUubWF4U2NvcmU7XG5cbiAgICB2YXIgbmV3SXNPcGVuID0gdGhpcy5zdG9yZS5pc09wZW47XG5cbiAgICBpZiAodGhpcy5pc09wZW4gIT09IG5ld0lzT3Blbikge1xuICAgICAgICB1dGlsLmFkZENsYXNzKHRoaXMuZWxlbWVudCwgJ19vcGVuJyk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBMZXZlbEJsb2NrO1xuIiwidmFyIGdhbWVDb25maWcgPSByZXF1aXJlKCcuLi9nYW1lQ29uZmlnJyk7XG52YXIgbGV2ZWxTdG9yZSA9IHJlcXVpcmUoJy4uL2xldmVsU3RvcmUnKTtcbnZhciBMZXZlbEJsb2NrID0gcmVxdWlyZSgnLi9sZXZlbEJsb2NrJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuZnVuY3Rpb24gTWVudShzdGF0ZSkge1xuICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB0aGlzLl9pc1Jlc3VtZUFjdGl2ZSA9IGZhbHNlO1xuICAgIHRoaXMubGV2ZWxCbG9ja3MgPSB7fTtcblxuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbiAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XG4gICAgdGhpcy51cGRhdGUoKTtcbn1cblxuTWVudS5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ21haW5NZW51JztcbiAgICBlbGVtZW50LmlubmVySFRNTCA9XG4gICAgICAgICc8ZGl2IGNsYXNzPVwibWFpbk1lbnVfX2hlYWRlclwiPicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJtYWluTWVudV9fdGl0bGVcIj5DaGFpbnVtYmVyPC9kaXY+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cIm1haW5NZW51X192ZXJzaW9uXCI+djAuMC4xPC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJtYWluTWVudV9fYm9keVwiPicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJtYWluTWVudV9fbGV2ZWxMaXN0XCI+PC9kaXY+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cIm1haW5NZW51X19wcm9ncmVzc1wiPicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwibWFpbk1lbnVfX3Byb2dyZXNzQmFyXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJtYWluTWVudV9fcHJvZ3Jlc3NUZXh0XCI+PC9kaXY+JyArXG4gICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJtYWluTWVudV9fZm9vdGVyXCI+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwibWFpbk1lbnVfX3Jlc3VtZUdhbWVcIj5SZXN1bWU8L2Rpdj4nICtcbiAgICAgICAgJzwvZGl2Pic7XG5cbiAgICB2YXIgbGlzdCA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbWFpbk1lbnVfX2xldmVsTGlzdCcpWzBdO1xuICAgIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgIGdhbWVDb25maWcubGV2ZWxzLmZvckVhY2goZnVuY3Rpb24obmFtZSwgaSkge1xuICAgICAgICB2YXIgbGV2ZWwgPSBuZXcgTGV2ZWxCbG9jayh0aGlzLCBuYW1lLCBpKTtcblxuICAgICAgICB0aGlzLmxldmVsQmxvY2tzW25hbWVdID0gbGV2ZWw7XG5cbiAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQobGV2ZWwuZWxlbWVudCk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICBsaXN0LmFwcGVuZENoaWxkKGZyYWdtZW50KTtcblxuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5yZXN1bWVHYW1lQnV0dG9uID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdtYWluTWVudV9fcmVzdW1lR2FtZScpWzBdO1xuICAgIHRoaXMucHJvZ3Jlc3NCYXJFbGVtZW50ID0gZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdtYWluTWVudV9fcHJvZ3Jlc3NCYXInKVswXTtcbiAgICB0aGlzLnByb2dyZXNzVGV4dEVsZW1lbnQgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ21haW5NZW51X19wcm9ncmVzc1RleHQnKVswXTtcbn07XG5cbk1lbnUucHJvdG90eXBlLl9iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgdXRpbC5vbih0aGlzLnJlc3VtZUdhbWVCdXR0b24sICdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnN0YXRlLnJlc3VtZUxldmVsKCk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbn07XG5cbk1lbnUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHV0aWwuZm9yRWFjaCh0aGlzLmxldmVsQmxvY2tzLCBmdW5jdGlvbihsZXZlbCkge1xuICAgICAgICBsZXZlbC51cGRhdGUoKTtcbiAgICB9LCB0aGlzKTtcblxuICAgIHRoaXMuX3VwZGF0ZVByb2dyZXNzKCk7XG59O1xuXG5NZW51LnByb3RvdHlwZS5fdXBkYXRlUHJvZ3Jlc3MgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGVuZ3RoID0gT2JqZWN0LmtleXModGhpcy5sZXZlbEJsb2NrcykubGVuZ3RoO1xuICAgIHZhciBnb2Fsc0NvdW50ID0gMztcbiAgICB2YXIgc3VtID0gMDtcblxuICAgIHV0aWwuZm9yRWFjaCh0aGlzLmxldmVsQmxvY2tzLCBmdW5jdGlvbihsZXZlbCkge1xuICAgICAgICBzdW0gKz0gbGV2ZWwuc3RvcmUuY3VycmVudEdvYWw7XG4gICAgfSk7XG5cbiAgICB2YXIgcHJvZ3Jlc3NWYWx1ZSA9IHN1bSAvIChsZW5ndGggKiBnb2Fsc0NvdW50KTtcblxuICAgIHRoaXMucHJvZ3Jlc3NCYXJFbGVtZW50LnN0eWxlLndpZHRoID0gTWF0aC5mbG9vcihwcm9ncmVzc1ZhbHVlICogZ2FtZUNvbmZpZy5wcm9ncmVzc0Jhci53aWR0aCkgKyAncHgnO1xuICAgIHRoaXMucHJvZ3Jlc3NUZXh0RWxlbWVudC5pbm5lckhUTUwgPSBNYXRoLmZsb29yKHByb2dyZXNzVmFsdWUgKiAxMDApICsgJyUnO1xufTtcblxuTWVudS5wcm90b3R5cGUucmVzdW1lTGV2ZWxBY3RpdmUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5faXNSZXN1bWVBY3RpdmUpIHsgcmV0dXJuOyB9XG5cbiAgICB0aGlzLl9pc1Jlc3VtZUFjdGl2ZSA9IHRydWU7XG4gICAgdXRpbC5hZGRDbGFzcyh0aGlzLmVsZW1lbnQsICdfYWN0aXZlTGV2ZWwnKTtcbn07XG5cbk1lbnUucHJvdG90eXBlLnJ1bkxldmVsID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGlmIChsZXZlbFN0b3JlLmdldChuYW1lKS5pc09wZW4pIHtcbiAgICAgICAgdGhpcy5zdGF0ZS5ydW5MZXZlbChuYW1lKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbnU7XG4iLCJ2YXIgc2F2ZXMgPSB7fTtcblxuZnVuY3Rpb24gZ2V0RnJvbUxvY2FsU3RvcmFnZShuYW1lKSB7XG4gICAgdmFyIGxldmVsc0pTT04gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShuYW1lKTtcbiAgICB2YXIgbGV2ZWxzO1xuXG4gICAgaWYgKGxldmVsc0pTT04pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldmVscyA9IEpTT04ucGFyc2UobGV2ZWxzSlNPTik7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGxldmVscyA9IHt9O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbGV2ZWxzID0ge307XG4gICAgfVxuXG4gICAgcmV0dXJuIGxldmVscztcbn1cblxuZnVuY3Rpb24gc2V0VG9Mb2NhbFN0b3JhZ2UobmFtZSwgZGF0YSkge1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKG5hbWUsIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbn1cblxuc2F2ZXMuZ2V0TGV2ZWxzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGdldEZyb21Mb2NhbFN0b3JhZ2UoJ2xldmVscycpO1xufTtcblxuc2F2ZXMuc2V0TGV2ZWxzID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHNldFRvTG9jYWxTdG9yYWdlKCdsZXZlbHMnLCBkYXRhKTtcbn07XG5cbnNhdmVzLnNldEFjdGl2ZUxldmVsID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHNldFRvTG9jYWxTdG9yYWdlKCdhY3RpdmVMZXZlbCcsIGRhdGEpO1xufTtcblxuc2F2ZXMuZ2V0QWN0aXZlTGV2ZWwgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZ2V0RnJvbUxvY2FsU3RvcmFnZSgnYWN0aXZlTGV2ZWwnKTtcbn07XG5cbnNhdmVzLnNldEFiaWxpdGllcyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBzZXRUb0xvY2FsU3RvcmFnZSgnYWJpbGl0aWVzJywgZGF0YSk7XG59O1xuXG5zYXZlcy5nZXRBYmlsaXRpZXMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZ2V0RnJvbUxvY2FsU3RvcmFnZSgnYWJpbGl0aWVzJyk7XG59O1xuXG5zYXZlcy5zZXRVbml0SUQgPSBmdW5jdGlvbihpZCkge1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd1bml0SUQnLCBpZCk7XG59O1xuXG5zYXZlcy5nZXRVbml0SUQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VuaXRJRCcpO1xufTtcblxuc2F2ZXMuaXNGaXJzdEdhbWUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2lzRmlyc3RHYW1lJykgPT0gbnVsbCkge1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnaXNGaXJzdEdhbWUnLCAnMScpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNhdmVzO1xuIiwidmFyIE1haW5NZW51ID0gcmVxdWlyZSgnLi9tYWluTWVudS9tYWluTWVudScpO1xudmFyIGxldmVsTW9kdWxlcyA9IHJlcXVpcmUoJy4vbGV2ZWxNb2R1bGVzJyk7XG52YXIgYW5hbHl0aWNzID0gcmVxdWlyZSgnLi9hbmFseXRpY3MnKTtcblxudmFyIHNhdmVzID0gcmVxdWlyZSgnLi9zYXZlcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuZnVuY3Rpb24gU3RhdGUoKSB7XG4gICAgdGhpcy5fYWN0aXZlRWxlbWVudCA9IG51bGw7XG4gICAgdGhpcy5fYWN0aXZlTGV2ZWwgPSBudWxsO1xuXG4gICAgdGhpcy5tYWluTWVudSA9IG5ldyBNYWluTWVudSh0aGlzKTtcblxuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoKTtcbiAgICB0aGlzLl9jaGVja0FjdGl2ZUxldmVsKCk7XG59XG5cblN0YXRlLnByb3RvdHlwZS5fY2hlY2tBY3RpdmVMZXZlbCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhY3RpdmVTYXZlZExldmVsID0gc2F2ZXMuZ2V0QWN0aXZlTGV2ZWwoKTtcblxuICAgIGlmIChPYmplY3Qua2V5cyhhY3RpdmVTYXZlZExldmVsKS5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZlTGV2ZWwgPSBuZXcgbGV2ZWxNb2R1bGVzW2FjdGl2ZVNhdmVkTGV2ZWwubmFtZV0oYWN0aXZlU2F2ZWRMZXZlbC5uYW1lLCB0aGlzLCBhY3RpdmVTYXZlZExldmVsKTtcbiAgICAgICAgdGhpcy5hY3RpdmVMZXZlbEVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fYWN0aXZlTGV2ZWwuZWxlbWVudCk7XG4gICAgICAgIHRoaXMubWFpbk1lbnUucmVzdW1lTGV2ZWxBY3RpdmUoKTtcbiAgICB9XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUuX2NyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gJ3N0YXRlJztcbiAgICB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MID1cbiAgICAgICAgJzxkaXYgY2xhc3M9XCJzdGF0ZV9fbWFpbk1lbnVcIj48L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJzdGF0ZV9fYWN0aXZlTGV2ZWxcIj48L2Rpdj4nO1xuXG4gICAgdGhpcy5tYWluTWVudUVsZW1lbnQgPSB0aGlzLmVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnc3RhdGVfX21haW5NZW51JylbMF07XG4gICAgdGhpcy5tYWluTWVudUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5tYWluTWVudS5lbGVtZW50KTtcblxuICAgIHRoaXMuYWN0aXZlTGV2ZWxFbGVtZW50ID0gdGhpcy5lbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3N0YXRlX19hY3RpdmVMZXZlbCcpWzBdO1xufTtcblxuU3RhdGUucHJvdG90eXBlLnNhdmVBY3RpdmVMZXZlbCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9hY3RpdmVMZXZlbCkge1xuICAgICAgICBzYXZlcy5zZXRBY3RpdmVMZXZlbCh0aGlzLl9hY3RpdmVMZXZlbC5nZXRTdGF0ZSgpKTtcbiAgICB9XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUuX2FjdGl2YXRlID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmICh0aGlzLl9hY3RpdmVFbGVtZW50ID09PSBlbGVtZW50KSB7IHJldHVybjsgfVxuXG4gICAgaWYgKHRoaXMuX2FjdGl2ZUVsZW1lbnQpIHtcbiAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyh0aGlzLl9hY3RpdmVFbGVtZW50LCAnX3Nob3dlZCcpO1xuICAgIH1cblxuICAgIHV0aWwuYWRkQ2xhc3MoZWxlbWVudCwgJ19zaG93ZWQnKTtcbiAgICB0aGlzLl9hY3RpdmVFbGVtZW50ID0gZWxlbWVudDtcbn07XG5TdGF0ZS5wcm90b3R5cGUucnVuTWFpbk1lbnUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLm1haW5NZW51LnVwZGF0ZSgpO1xuICAgIHRoaXMuX2FjdGl2YXRlKHRoaXMubWFpbk1lbnVFbGVtZW50KTtcbn07XG5cblN0YXRlLnByb3RvdHlwZS5ydW5MZXZlbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAodGhpcy5fYWN0aXZlTGV2ZWwgJiYgdGhpcy5fYWN0aXZlTGV2ZWwubmFtZSA9PSBuYW1lKSB7IHJldHVybiB0aGlzLnJlc3VtZUxldmVsKCk7IH1cblxuICAgIHRoaXMubWFpbk1lbnUucmVzdW1lTGV2ZWxBY3RpdmUoKTtcblxuICAgIHZhciBuZXdMZXZlbCA9IG5ldyBsZXZlbE1vZHVsZXNbbmFtZV0obmFtZSwgdGhpcyk7XG5cbiAgICBpZiAodGhpcy5fYWN0aXZlTGV2ZWwpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVMZXZlbEVsZW1lbnQucmVwbGFjZUNoaWxkKG5ld0xldmVsLmVsZW1lbnQsIHRoaXMuX2FjdGl2ZUxldmVsLmVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYWN0aXZlTGV2ZWxFbGVtZW50LmFwcGVuZENoaWxkKG5ld0xldmVsLmVsZW1lbnQpO1xuICAgIH1cblxuICAgIHRoaXMuX2FjdGl2ZUxldmVsID0gbmV3TGV2ZWw7XG5cbiAgICB0aGlzLl9hY3RpdmF0ZSh0aGlzLmFjdGl2ZUxldmVsRWxlbWVudCk7XG5cbiAgICBhbmFseXRpY3MubGV2ZWxTdGFydGVkKHRoaXMuX2FjdGl2ZUxldmVsLm5hbWUpO1xufTtcblxuU3RhdGUucHJvdG90eXBlLmJhY2tGcm9tTGV2ZWwgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnJ1bk1haW5NZW51KCk7XG59O1xuXG5TdGF0ZS5wcm90b3R5cGUucmVzdW1lTGV2ZWwgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5fYWN0aXZlTGV2ZWwpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZhdGUodGhpcy5hY3RpdmVMZXZlbEVsZW1lbnQpO1xuXG4gICAgICAgIGFuYWx5dGljcy5sZXZlbFJlc3VtZWQodGhpcy5fYWN0aXZlTGV2ZWwubmFtZSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZTsiLCJ2YXIgdXRpbCA9IHt9O1xuXG51dGlsLmFkZENsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICBpZiAoZWwuY2xhc3NMaXN0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTGlzdC5hZGQobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGNsYXNzTmFtZXMgPSBlbC5jbGFzc05hbWUuc3BsaXQoJyAnKTtcbiAgICAgICAgdmFyIGluZGV4ID0gY2xhc3NOYW1lcy5pbmRleE9mKG5hbWUpO1xuXG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIGNsYXNzTmFtZXMucHVzaChuYW1lKTtcbiAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZXMuam9pbignICcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG51dGlsLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgICBpZiAoZWwuY2xhc3NMaXN0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZWwuY2xhc3NMaXN0LnJlbW92ZShuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgY2xhc3NOYW1lcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgICAgICB2YXIgaW5kZXggPSBjbGFzc05hbWVzLmluZGV4T2YobmFtZSk7XG5cbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgY2xhc3NOYW1lcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lcy5qb2luKCcgJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbnV0aWwuaGFzQ2xhc3MgPSBmdW5jdGlvbihlbCwgbmFtZSkge1xuICAgIGlmIChlbC5jbGFzc0xpc3QgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gZWwuY2xhc3NMaXN0LmNvbnRhaW5zKG5hbWUpO1xuICAgIH1cblxuICAgIHZhciBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG5cbiAgICByZXR1cm4gY2xhc3NOYW1lcy5pbmRleE9mKG5hbWUpICE9IC0xO1xufTtcblxudXRpbC5mb3JFYWNoID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChvYmoubGVuZ3RoKSB7XG4gICAgICAgIG9iai5mb3JFYWNoKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtrZXldLCBrZXkpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG51dGlsLm9uID0gZnVuY3Rpb24obm9kZSwgdHlwZSwgY2FsbGJhY2ssIHVzZUNhcHR1cmUpIHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgY2FsbGJhY2ssIHVzZUNhcHR1cmUpO1xufTtcblxudXRpbC5vZmYgPSBmdW5jdGlvbihub2RlLCB0eXBlLCBjYWxsYmFjaywgdXNlQ2FwdHVyZSkge1xuICAgIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBjYWxsYmFjaywgdXNlQ2FwdHVyZSk7XG59O1xuXG51dGlsLmlzTW9iaWxlID0gJ29udG91Y2hzdGFydCcgaW4gd2luZG93IHx8ICh3aW5kb3cuRG9jdW1lbnRUb3VjaCAmJiBkb2N1bWVudCBpbnN0YW5jZW9mIHdpbmRvdy5Eb2N1bWVudFRvdWNoKTtcblxudXRpbC5oc2xTdW0gPSBmdW5jdGlvbihhcnIpIHtcbiAgICAvL1t7aHNsLCByYXRpb30sIC4uLl1cbiAgICB2YXIgaHNsID0gWzAsIDAsIDBdO1xuICAgIHZhciBuID0gMDtcbiAgICB2YXIgaSwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaHNsWzBdICs9IGFycltpXS5oc2xbMF0gKyA1ICogYXJyW2ldLnJhdGlvO1xuICAgICAgICBmb3IgKGogPSAxOyBqIDwgMzsgaisrKSB7XG4gICAgICAgICAgICBoc2xbal0gKz0gYXJyW2ldLmhzbFtqXSAqIGFycltpXS5yYXRpbztcbiAgICAgICAgfVxuXG4gICAgICAgIG4gKz0gYXJyW2ldLnJhdGlvO1xuICAgIH1cblxuICAgIGhzbFswXSAlPSAzNjA7XG4gICAgaHNsWzFdID0gTWF0aC5tYXgoTWF0aC5taW4oaHNsWzFdIC8gbiwgMC43KSwgMC4yKTtcbiAgICBoc2xbMl0gPSBNYXRoLm1heChNYXRoLm1pbihoc2xbMl0gLyBuLCAwLjkpLCAwLjEpO1xuXG4gICAgcmV0dXJuIGhzbDtcbn07XG5cbnV0aWwubnVsbEZuID0gZnVuY3Rpb24oKSB7fTtcblxuLy8gZ2V0IHJhbmRvbSB2YWx1ZSBmcm9tIGFycmF5IHdpdGggcmVsYXRpb25zXG4vLyBbIFt2YWx1ZSwgcmF0aW9dLCAuLi4gXVxudXRpbC5yYW5kb20gPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciBzdW1SYXRpb24gPSAwO1xuXG4gICAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuICAgICAgICBzdW1SYXRpb24gKz0gZWxbMV07XG4gICAgfSk7XG5cbiAgICB2YXIgc3VtID0gMDtcblxuICAgIHZhciBjaGFuY2VBcnJheSA9IGFycmF5Lm1hcChmdW5jdGlvbihlbCkge1xuICAgICAgICB2YXIgdmFsID0gZWxbMV0gLyBzdW1SYXRpb24gKyBzdW07XG5cbiAgICAgICAgc3VtID0gdmFsO1xuXG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSk7XG5cbiAgICB2YXIgcm9sbCA9IE1hdGgucmFuZG9tKCk7XG5cbiAgICB2YXIgdmFsdWUgPSAwO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGFuY2VBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocm9sbCA8PSBjaGFuY2VBcnJheVtpXSkge1xuICAgICAgICAgICAgdmFsdWUgPSBhcnJheVtpXVswXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlO1xufTtcblxudmFyIHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLFxuICAgIGRvY0VsID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxuXG4gICAgaWUgPSAnQWN0aXZlWE9iamVjdCcgaW4gd2luZG93LFxuICAgIGFuZHJvaWQyMyA9IHVhLnNlYXJjaCgnYW5kcm9pZCBbMjNdJykgIT09IC0xLFxuXG4gICAgaWUzZCA9IGllICYmICgndHJhbnNpdGlvbicgaW4gZG9jRWwuc3R5bGUpLFxuICAgIHdlYmtpdDNkID0gKCdXZWJLaXRDU1NNYXRyaXgnIGluIHdpbmRvdykgJiYgKCdtMTEnIGluIG5ldyB3aW5kb3cuV2ViS2l0Q1NTTWF0cml4KCkpICYmICFhbmRyb2lkMjMsXG4gICAgZ2Vja28zZCA9ICdNb3pQZXJzcGVjdGl2ZScgaW4gZG9jRWwuc3R5bGUsXG5cbiAgICBzdXBwb3J0c1RyYW5zaXRpb24zZCA9IGllM2QgfHwgd2Via2l0M2QgfHwgZ2Vja28zZDtcblxuZnVuY3Rpb24gdGVzdFByb3BzKHByb3BzKSB7XG4gICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocHJvcHNbaV0gaW4gc3R5bGUpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9wc1tpXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbn1cblxudmFyIFRSQU5TRk9STSA9IHRlc3RQcm9wcyhbJ3RyYW5zZm9ybScsICdXZWJraXRUcmFuc2Zvcm0nLCAnT1RyYW5zZm9ybScsICdNb3pUcmFuc2Zvcm0nLCAnbXNUcmFuc2Zvcm0nXSk7XG5cbnV0aWwuc2V0UG9zaXRpb24gPSBmdW5jdGlvbihlbCwgcG9pbnQpIHtcbiAgICBpZiAoc3VwcG9ydHNUcmFuc2l0aW9uM2QpIHtcbiAgICAgICAgZWwuc3R5bGVbVFJBTlNGT1JNXSA9ICd0cmFuc2xhdGUzZCgnICsgcG9pbnRbMF0gKyAncHgsJyArIHBvaW50WzFdICsgJ3B4JyArICcsMCknO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLnN0eWxlLmxlZnQgPSBwb2ludFswXSArICdweCc7XG4gICAgICAgIGVsLnN0eWxlLnRvcCA9IHBvaW50WzFdICsgJ3B4JztcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWw7XG4iXX0=
