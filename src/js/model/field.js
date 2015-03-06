var EventEmitter = require('events').EventEmitter;

var config = require('./../config.js');

function Field() {
    EventEmitter.call(this);

    this._blockIdCounter = 0;
    this.blocks = {};
    this.size = config.field.size;

    this._init();
}

Field.prototype = Object.create(EventEmitter.prototype);
Field.prototype.constructor = Field;

Field.prototype._init = function() {
    var blocks = this.blocks;

    for (var i = 0; i < this.size[0]; i++) {
        blocks[i] = {};

        for (var j = 0; j < this.size[1]; j++) {
            this.createBlock({
                id: ++this._blockIdCounter,
                x: i,
                y: j,
                value: 1
            });
        }
    }
};

Field.prototype.createBlock = function(options) {
    var block = this.blocks[options.x][options.y] = {
        value: options.value,
        x: options.x,
        y: options.y
    };

    this.emit('blockCreated', block);
};

module.exports = Field;
