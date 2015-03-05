var config = require('./config');

function Block(options) {
    this._value = options.value || null;
    this._element = null;

    this._createElement();
    this.setPosition(options.x, options.y);
}

Block.prototype._createElement = function() {
    // TODO: включить простой шаблонизатор

    var element = document.createElement('div');
    element.className = 'block _' + this._value;
    element.innerHTML = this._value;

    var active = document.createElement('div');
    active.className = 'block__active';

    element.appendChild(active);

    this._element = element;
};

Block.prototype.setValue = function(value) {
    this._value = value;
    this._element.innerHTML = this._value;
};

Block.prototype.getValue = function() {
    return this._value;
};

Block.prototype.getElement = function() {
    return this._element;
};

Block.prototype.setPosition = function(x, y) {
    this.x = x;
    this.y = y;
    this._element.style.top = y * config.block.height + 'px';
    this._element.style.left = x * config.block.width + 'px';
};

module.exports = Block;
