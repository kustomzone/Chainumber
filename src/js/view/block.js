var config = require('./../config');
var util = require('../util');

function ViewBlock(block) {
    this.element = null;

    this._createElement(block);
}

ViewBlock.prototype._createElement = function(block) {
    // TODO: включить простой шаблонизатор

    var element = document.createElement('div');
    element.className = 'block _' + block.value;

    element.style.top = block.y * config.block.height + 'px';
    element.style.left = block.x * config.block.width + 'px';

    var active = document.createElement('div');
    active.className = 'block__active';
    element.appendChild(active);

    var text = document.createElement('div');
    text.className = 'block__text';
    text.innerHTML = block.value;
    element.appendChild(text);

    this.textElement = text;
    this.activeElement = active;
    this.element = element;
};

ViewBlock.prototype.changePosition = function(x, y) {
    this.element.style.left = x * config.block.width + 'px';
    this.element.style.top = y * config.block.height + 'px';
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
