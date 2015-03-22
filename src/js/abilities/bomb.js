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
