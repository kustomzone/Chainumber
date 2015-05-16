var analytics = require('../analytics');
var util = require('../util');

function Hammer(name, options, abilities) {
    this.name = name;
    this.abilities = abilities;
    this.field = abilities.game.field;

    this.count = options.count || 0;

    this.element = null;
    this._block = null;

    this.isActive = false;
    this._isMouseDown = false;

    this._createElement();
    this._bindEvents();
    this.updateCount();
}

Hammer.prototype._createElement = function() {
    var element = document.createElement('div');
    element.className = 'ability__' + this.name;

    element.innerHTML =
        '<div class="ability__border"></div>' +
        '<div class="ability__count"></div>';


    this.countElement = element.getElementsByClassName('ability__count')[0];
    this.element = element;
};

Hammer.prototype._bindEvents = function() {
    var eventClick = util.isMobile ? 'touchend' : 'click';

    util.on(this.element, eventClick, this._onClickHandler.bind(this));
};

Hammer.prototype._onClickHandler = function() {
    if (this.count == 0) { return; }

    if (!this.isActive) {
        this.abilities.runAbility(this.name);
    } else {
        this.abilities.stopAbility(this.name);
    }
};

Hammer.prototype.updateCount = function(isAnimate) {
    this.countElement.innerHTML = this.count;

    if (this.count == 0) {
        util.addClass(this.element, '_no-count');
    } else {
        util.removeClass(this.element, '_no-count');

        if (isAnimate) {
            this._blink();
        }
    }
};

Hammer.prototype._blink = function() {
    var self = this;

    util.addClass(this.element, '_blink');

    setTimeout(function() {
        util.removeClass(self.element, '_blink');
    }, 350);
};

Hammer.prototype.activate = function() {
    util.addClass(this.element, '_active');

    var startEvent = util.isMobile ? 'touchstart' : 'mousedown';
    var endEvent = util.isMobile ? 'touchend' : 'mouseup';
    var moveEvent = util.isMobile ? 'touchmove' : 'mousemove';

    this._fieldClickHandlerBind = this._fieldClickHandler.bind(this);
    this._fieldMouseDownHandlerBind = this._fieldMouseDownHandler.bind(this);
    this._bodyEndClickBind = this._bodyEndClick.bind(this);
    this._fieldMouseMoveHandlerBind = this._fieldMouseMoveHandler.bind(this);

    util.on(this.field.element, endEvent, this._fieldClickHandlerBind);
    util.on(this.field.element, startEvent, this._fieldMouseDownHandlerBind);
    util.on(document.body, endEvent, this._bodyEndClickBind);
    util.on(this.field.element, moveEvent, this._fieldMouseMoveHandlerBind);

    this.isActive = true;
};

Hammer.prototype.deactivate = function() {
    util.removeClass(this.element, '_active');

    var startEvent = util.isMobile ? 'touchstart' : 'mousedown';
    var endEvent = util.isMobile ? 'touchend' : 'mouseup';
    var moveEvent = util.isMobile ? 'touchmove' : 'mousemove';

    util.off(this.field.element, endEvent, this._fieldClickHandlerBind);
    util.off(this.field.element, startEvent, this._fieldMouseDownHandlerBind);
    util.off(document.body, endEvent, this._bodyEndClickBind);
    util.off(this.field.element, moveEvent, this._fieldMouseMoveHandlerBind);

    this.isActive = false;
};

Hammer.prototype._fieldMouseDownHandler = function(ev) {
    this._isMouseDown = true;

    if (!ev.target || ev.target.className !== 'block__active') { return; }

    var blockId = ev.target.parentNode.getAttribute('data-id');
    var block = this.field.blocks[blockId];

    if (!block) { return; }

    this._block = block;

    this._beforeRun();
};

Hammer.prototype._fieldClickHandler = function() {
    if (!this._block) { return; }

    this._isMouseDown = false;

    analytics.abilityUsed(this.name, this._block.value);

    this._run();

    this.count--;
    this.updateCount();

    this.abilities.game.saveState();

    this.abilities.stopAbility(this.name);
};

Hammer.prototype._bodyEndClick = function() {
    this._isMouseDown = false;
    this._afterRun();
};

Hammer.prototype._fieldMouseMoveHandler = function(ev) {
    var i, target, touch, blockId;

    if (!this._isMouseDown) { return; }

    if (util.isMobile) {
        for (i = 0; i < ev.changedTouches.length; i++) {
            touch = ev.changedTouches[i];
            target = document.elementFromPoint(touch.clientX, touch.clientY);

            if (!target) { continue; }

            if (target.className === 'block__active') {
                blockId = target.parentNode.getAttribute('data-id');
                break;
            }
        }
    } else {
        target = document.elementFromPoint(ev.clientX, ev.clientY);

        if (!target || target.className !== 'block__active') { return; }

        blockId = target.parentNode.getAttribute('data-id');
    }

    if (!blockId) {
        this._afterRun();
        this._block = null;
        return;
    }

    var block = this.field.blocks[blockId];

    if (!block) { return; }

    this._afterRun();

    this._block = block;

    this._beforeRun();
};

Hammer.prototype._beforeRun = function() {
    util.addClass(this._block.element, '_targetAbility');
};

Hammer.prototype._run = function() {
    this.field.blockRemove(this._block.id);
    this.field.checkPositions();
};

Hammer.prototype._afterRun = function() {
    if (this._block) {
        util.removeClass(this._block.element, '_targetAbility');
    }
};

module.exports = Hammer;
