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
