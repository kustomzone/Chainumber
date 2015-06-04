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
