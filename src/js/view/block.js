var config = require('./../config');
var util = require('../util');

function ViewBlock(block) {
    this.element = null;

    this.blockWidth = config.field.sizePx[0] / config.field.size[0];
    this.blockHeight = config.field.sizePx[1] / config.field.size[1];

    this._createElement(block);
}

ViewBlock.prototype._createElement = function(block) {
    // TODO: включить простой шаблонизатор

    var element = document.createElement('div');
    element.className = 'block _value_' + block.value;

    element.style.left = block.x * this.blockWidth + 'px';
    element.style.bottom = block.y * this.blockHeight + 'px';

    var inner = document.createElement('div');
    inner.className = 'block__inner';
    element.appendChild(inner);

    var active = document.createElement('div');
    active.className = 'block__active';
    element.appendChild(active);

    var text = document.createElement('div');
    text.className = 'block__text';
    text.innerHTML = block.value;
    inner.appendChild(text);

    this.textElement = text;
    this.activeElement = active;
    this.element = element;
};

ViewBlock.prototype.changePosition = function(x, y) {
    this.element.style.left = x * this.blockWidth + 'px';
    this.element.style.bottom = y * this.blockHeight + 'px';
};

ViewBlock.prototype.changeValue = function(value) {
    this.textElement.innerHTML = value;
};

ViewBlock.prototype.select = function(value) {
    util.addClass(this.element, '_selected');
};

ViewBlock.prototype.unselect = function(value) {
    util.removeClass(this.element, '_selected');
};

module.exports = ViewBlock;
