function Block(options) {
    options = options || {};

    this._value = options.value || null;
    this._element = null;

    this._createElement();
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

module.exports = Block;
