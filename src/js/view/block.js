var config = require('./../config');

function ViewBlock(block) {
    this.element = null;

    this._createElement(block);
}

ViewBlock.prototype._createElement = function(block) {
    // TODO: включить простой шаблонизатор

    var element = document.createElement('div');
    element.className = 'block _' + block.value;
    element.innerHTML = block.value;

    element.style.top = block.y * config.block.height + 'px';
    element.style.left = block.x * config.block.width + 'px';

    var active = document.createElement('div');
    active.className = 'block__active';

    element.appendChild(active);

    this.element = element;
};

ViewBlock.prototype.changePosition = function(x, y) {
    this.element.style.left = x * config.block.width + 'px';
    this.element.style.top = y * config.block.height + 'px';
};

ViewBlock.prototype.changeValue = function(value) {
    this.element.innerHTML = value;
};

module.exports = ViewBlock;
