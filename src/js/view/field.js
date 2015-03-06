var ViewBlock = require('./block');

function ViewField(field) {
    this.model = field;

    this.viewBlocks = {};

    this.fragment = null;

    this._createField();
    this._bindEvents();
}

ViewField.prototype._createField = function() {
    this.fragment = document.createElement('div');
    this.fragment.className = 'field';

    Object.keys(this.model.blocks).forEach(this._createBlock, this);
};

ViewField.prototype._createBlock = function(id) {
    var viewBlock = new ViewBlock(this.model.blocks[id]);

    this.viewBlocks[id] = viewBlock;

    viewBlock.element.addEventListener('mousedown', (function(ev) {
        this.model.blockMouseDown(id);
    }).bind(this));

    viewBlock.activeElement.addEventListener('mouseover', (function(ev) {
        this.model.blockMouseOver(id);
    }).bind(this));

    viewBlock.activeElement.addEventListener('mouseout', (function(ev) {
        this.model.blockMouseOut(id);
    }).bind(this));

    this.fragment.appendChild(viewBlock.element);
};

ViewField.prototype.blockCreate = function(id) {
    //this._createBlock(id);
};

ViewField.prototype._bindEvents = function() {
    document.body.addEventListener('mouseup', (function() {
        this.model.blockMouseUp();
    }).bind(this));

    // model -> view
    this.model.on('blockCreated', this.blockCreate.bind(this));
    this.model.on('blockRemoved', this.blockRemoved.bind(this));

    this.model.on('blockPositionChanged', this.updateBlockPosition.bind(this));
    this.model.on('blockValueChanged', this.updateBlockValue.bind(this));

    this.model.on('blockSelectStart', this.startSelect.bind(this));
    this.model.on('blockSelect', this.select.bind(this));
    this.model.on('blockUnselect', this.unselect.bind(this));

    this.model.on('blockSelectFinished', this.selectFinished.bind(this));
};

ViewField.prototype.updateBlockPosition = function(id) {
    var block = this.model.blocks[id];

    this.viewBlocks[id].changePosition(block.x, block.y);
};

ViewField.prototype.updateBlockValue = function(id) {
    this.viewBlocks[id].changeValue(this.model.blocks[id].value);
};

ViewField.prototype.startSelect = function() {
    var block = this.model.selectedBlocks[0];

    this.selectedBlocks = [block];
    this.viewBlocks[block].select();
};

ViewField.prototype.select = function() {
    var blocks = this.model.selectedBlocks;
    var block = blocks[blocks.length - 1];

    this.selectedBlocks.push(block);
    this.viewBlocks[block].select();
};

ViewField.prototype.unselect = function() {
    var block = this.selectedBlocks.pop();

    this.viewBlocks[block].unselect();
};

ViewField.prototype.selectFinished = function() {
    this.selectedBlocks.forEach(function(id) {
        if (this.viewBlocks[id]) {
            this.viewBlocks[id].unselect();
        }
    }, this);
};

ViewField.prototype.blockRemoved = function(id) {
    var htmlBlock = this.viewBlocks[id].element;
    this.fragment.removeChild(htmlBlock);

    delete this.viewBlocks[id];
};

module.exports = ViewField;
