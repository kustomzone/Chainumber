var ViewBlock = require('./block');

function ViewField(field) {
    this.field = field;
    this.viewBlocks = {};
    this.fragment = document.createDocumentFragment();

    this._createField();

    this.field.on('blockPositionChanged', this.updateBlockPosition.bind(this));
    this.field.on('blockValueChanged', this.updateBlockValue.bind(this));
}

ViewField.prototype._createField = function() {
    var blocks = this.field.blocks;

    Object.keys(blocks).forEach(function(horKey) {
        Object.keys(blocks[horKey]).forEach(function(verKey) {
            var block = blocks[horKey][verKey];
            var viewBlock = this.viewBlocks[block.id] = new ViewBlock(block);

            this.fragment.appendChild(viewBlock.element);
        }, this);
    }, this);
};

ViewField.prototype.updateBlockPosition = function(block) {
    this.viewBlocks[block.id].changePosition(block.x, block.y);
};

ViewField.prototype.updateBlockValue = function(block) {
    this.viewBlocks[block.id].changeValue(block.value);
};

module.exports = ViewField;
