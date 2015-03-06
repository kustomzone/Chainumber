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

Field.prototype._getBlockValue = function() {
    var summRation = 0;
    var possibleValues = config.numbers.possibleValues;

    possibleValues.forEach(function(el) {
        summRation += el[1];
    });

    var summ = 0;

    var chanceArray = possibleValues.map(function(el) {
        var val = el[1] / summRation + summ;

        summ += val;

        return val;
    });

    var roll = Math.random();

    var value = 0;

    for (var i = 0; i < chanceArray.length; i++) {
        if (roll <= chanceArray[i]) {
            value = possibleValues[i][0];
            break;
        }
    }

    return value;
};

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
        value: this._getBlockValue(),
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
    if (this.selectedBlocks.length < config.chain.minLength) { return; }

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
            if (block.y != i) {
                this._blocksXY[block.x][block.y] = null;

                block.y = i;

                this._blocksXY[block.x][block.y] = block;

                this.emit('blockPositionChanged', block.id);
            }
        }, this);
    }, this);

    this._addNewBlocks();
};

Field.prototype._addNewBlocks = function() {
    Object.keys(this._blocksXY).forEach(function(hKey) {
        Object.keys(this._blocksXY[hKey]).forEach(function(vKey) {
            if (!this._blocksXY[hKey][vKey]) {
                this.createBlock({
                    x: hKey,
                    y: vKey
                });
            }
        }, this);
    }, this);
};

module.exports = Field;
