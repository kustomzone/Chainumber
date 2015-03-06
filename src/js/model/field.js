var EventEmitter = require('events').EventEmitter;

var config = require('./../config.js');

function Field() {
    EventEmitter.call(this);

    this._blockIdCounter = 0;
    this.blocks = {};
    this._blocksXY = {};
    this.size = config.field.size;

    this.selectedBlocks = [];

    this.selectedMode = false;

    this._init();
}

Field.prototype = Object.create(EventEmitter.prototype);
Field.prototype.constructor = Field;

Field.prototype._init = function() {
    var _blocksXY = this._blocksXY;

    for (var i = 0; i < this.size[0]; i++) {
        _blocksXY[i] = {};

        for (var j = 0; j < this.size[1]; j++) {
            this.createBlock({
                x: i,
                y: j
            });
        }
    }
};

Field.prototype.createBlock = function(options) {
    var block = {
        id: ++this._blockIdCounter,
        value: 1,
        x: options.x,
        y: options.y
    };

    this._blocksXY[options.x][options.y] = block;
    this.blocks[block.id] = block;

    this.emit('blockCreated', block.id);
};

Field.prototype.blockMouseDown = function(id) {
    this.selectedMode = true;
    this.selectedBlocks = [id];

    this.emit('blockSelectStart');
};

Field.prototype.blockMouseUp = function() {
    if (!this.selectedMode) { return; }

    this.selectedMode = false;

    this._runSelected();

    this.emit('blockSelectFinished');
};

Field.prototype._checkWithLast = function(id) {
    var lastBl = this.blocks[this.selectedBlocks[this.selectedBlocks.length - 1]];
    var newBl = this.blocks[id];

    return lastBl.value == newBl.value &&
        Math.abs(lastBl.x - newBl.x) <= 1 &&
        Math.abs(lastBl.y - newBl.y) <= 1;
};

Field.prototype.blockMouseOver = function(id) {
    if (!this.selectedMode) { return; }

    var selBlocks = this.selectedBlocks;

    if (selBlocks.indexOf(id) == -1) {
        if (this._checkWithLast(id)) {
            selBlocks.push(id);


            this.emit('blockSelect');
        }
    } else {
        if (selBlocks[selBlocks.length - 2] == id) {
            selBlocks.pop();
            this.emit('blockUnselect');
        }
    }
};

Field.prototype.blockMouseOut = function(id) {

};

Field.prototype._runSelected = function() {
    var lastBl = this.blocks[this.selectedBlocks.pop()];

    var value = lastBl.value;

    lastBl.value = value * (this.selectedBlocks.length + 1); // +1 because pop above

    this.emit('blockValueChanged', lastBl.id);

    this.selectedBlocks.forEach(function(selId) {
        var block = this.blocks[selId];

        this._blocksXY[block.x][block.y] = null;

        delete this.blocks[selId];

        this.emit('blockRemoved', selId);
    }, this);

    this._checkPositions();
};

Field.prototype._checkPositions = function() {
    Object.keys(this._blocksXY).forEach(function(hKey) {
        var arr = [];

        Object.keys(this._blocksXY[hKey]).forEach(function(vKey) {
            var block = this._blocksXY[hKey][vKey];

            if (block) {
                arr.push(block);
            }
        }, this);

        arr.sort(function(a, b) {
            return a.y > b.y;
        });


        arr.forEach(function(block, i) {
var oldY = block.y;
            if (block.y != i) {
                block.y = i;
                this.emit('blockPositionChanged', block.id);
            }
        }, this);
    }, this);
};

module.exports = Field;
