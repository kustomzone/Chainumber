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
