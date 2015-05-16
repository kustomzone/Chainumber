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
