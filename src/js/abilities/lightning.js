var Hammer = require('./hammer.js');
var util = require('../util.js');

function Lightning(name, options, abilities) {
    this._targets = [];

    Hammer.call(this, name, options, abilities);
}

Lightning.prototype = Object.create(Hammer.prototype);
Lightning.prototype.constructor = Lightning;

Lightning.prototype._beforeRun = function() {
    var value = this._block.value;

    util.forEach(this.field.blocks, function(bl) {
        if (bl.value === value) {
            this._targets.push(bl);
            util.addClass(bl.element, '_targetAbility');
        }
    }, this);
};

Lightning.prototype._run = function() {
    this._targets.forEach(function(block) {
        this.field.blockRemove(block.id);
    }, this);

    this.field.checkPositions();
};

Lightning.prototype._afterRun = function() {
    if (!this._block) { return; }

    this._targets.forEach(function(block) {
        util.removeClass(block.element, '_targetAbility');
    });

    this._targets = [];
};

module.exports = Lightning;
