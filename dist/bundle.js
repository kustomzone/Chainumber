(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Field = require('./model/field.js');
var ViewField = require('./view/field');
var config = require('./config.js');

var field = new Field();

var viewField = new ViewField(field);

var html = document.getElementById('game');

html.appendChild(viewField.fragment);

},{"./config.js":3,"./model/field.js":4,"./view/field":7}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],3:[function(require,module,exports){
module.exports = {
    field: {
        size: [4, 4]
    },
    block: {
        width: 54,
        height: 54
    },
    numbers: {
        // [number, ration or %]
        possibleValues: [
            [1, 1],
            [2, 1]
        ]
    },
    chain: {
        minLength: 3
    }
};

},{}],4:[function(require,module,exports){
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

},{"./../config.js":3,"events":2}],5:[function(require,module,exports){
var util = {};

util.addClass = function(el, name) {
    var classNames = el.className.split(' ');
    var index = classNames.indexOf(name);

    if (index === -1) {
        classNames.push(name);
        el.className = classNames.join(' ');
    }

    return el;
};

util.removeClass = function(el, name) {
    var classNames = el.className.split(' ');
    var index = classNames.indexOf(name);

    if (index !== -1) {
        classNames.splice(index, 1);
        el.className = classNames.join(' ');
    }

    return el;
};

util.hasClass = function(el, name) {
    var classNames = el.className.split(' ');

    return classNames.indexOf(name) != -1;
};

module.exports = util;

},{}],6:[function(require,module,exports){
var config = require('./../config');
var util = require('../util');

function ViewBlock(block) {
    this.element = null;

    this._createElement(block);
}

ViewBlock.prototype._createElement = function(block) {
    // TODO: включить простой шаблонизатор

    var element = document.createElement('div');
    element.className = 'block _' + block.value;

    element.style.bottom = block.y * config.block.height + 'px';
    element.style.left = block.x * config.block.width + 'px';

    var active = document.createElement('div');
    active.className = 'block__active';
    element.appendChild(active);

    var text = document.createElement('div');
    text.className = 'block__text';
    text.innerHTML = block.value;
    element.appendChild(text);

    this.textElement = text;
    this.activeElement = active;
    this.element = element;
};

ViewBlock.prototype.changePosition = function(x, y) {
    this.element.style.left = x * config.block.width + 'px';
    this.element.style.bottom = y * config.block.height + 'px';
};

ViewBlock.prototype.changeValue = function(value) {
    this.textElement.innerHTML = value;
};

ViewBlock.prototype.select = function(value) {
    util.addClass(this.element, '_selected');
};

ViewBlock.prototype.unselect = function(value) {
    util.removeClass(this.element, '_selected');
};

module.exports = ViewBlock;

},{"../util":5,"./../config":3}],7:[function(require,module,exports){
var ViewBlock = require('./block');
var util = require('../util.js');

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

ViewField.prototype._createBlock = function(id, animate) {
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

    if (animate === true) {
        util.addClass(viewBlock.element, '_blink');

        setTimeout(function() {
            util.removeClass(viewBlock.element, '_blink');
        }, 0);
    }
};

ViewField.prototype.blockCreate = function(id) {
    this._createBlock(id, true);
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

},{"../util.js":5,"./block":6}]},{},[1])


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsInNyYy9qcy9jb25maWcuanMiLCJzcmMvanMvbW9kZWwvZmllbGQuanMiLCJzcmMvanMvdXRpbC5qcyIsInNyYy9qcy92aWV3L2Jsb2NrLmpzIiwic3JjL2pzL3ZpZXcvZmllbGQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBGaWVsZCA9IHJlcXVpcmUoJy4vbW9kZWwvZmllbGQuanMnKTtcbnZhciBWaWV3RmllbGQgPSByZXF1aXJlKCcuL3ZpZXcvZmllbGQnKTtcbnZhciBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZy5qcycpO1xuXG52YXIgZmllbGQgPSBuZXcgRmllbGQoKTtcblxudmFyIHZpZXdGaWVsZCA9IG5ldyBWaWV3RmllbGQoZmllbGQpO1xuXG52YXIgaHRtbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdnYW1lJyk7XG5cbmh0bWwuYXBwZW5kQ2hpbGQodmlld0ZpZWxkLmZyYWdtZW50KTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGZpZWxkOiB7XG4gICAgICAgIHNpemU6IFs0LCA0XVxuICAgIH0sXG4gICAgYmxvY2s6IHtcbiAgICAgICAgd2lkdGg6IDU0LFxuICAgICAgICBoZWlnaHQ6IDU0XG4gICAgfSxcbiAgICBudW1iZXJzOiB7XG4gICAgICAgIC8vIFtudW1iZXIsIHJhdGlvbiBvciAlXVxuICAgICAgICBwb3NzaWJsZVZhbHVlczogW1xuICAgICAgICAgICAgWzEsIDFdLFxuICAgICAgICAgICAgWzIsIDFdXG4gICAgICAgIF1cbiAgICB9LFxuICAgIGNoYWluOiB7XG4gICAgICAgIG1pbkxlbmd0aDogM1xuICAgIH1cbn07XG4iLCJ2YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xuXG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi8uLi9jb25maWcuanMnKTtcblxuZnVuY3Rpb24gRmllbGQoKSB7XG4gICAgRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cbiAgICB0aGlzLl9ibG9ja0lkQ291bnRlciA9IDA7XG4gICAgdGhpcy5ibG9ja3MgPSB7fTtcbiAgICB0aGlzLl9ibG9ja3NYWSA9IHt9O1xuICAgIHRoaXMuc2l6ZSA9IGNvbmZpZy5maWVsZC5zaXplO1xuXG4gICAgdGhpcy5zZWxlY3RlZEJsb2NrcyA9IFtdO1xuXG4gICAgdGhpcy5zZWxlY3RlZE1vZGUgPSBmYWxzZTtcblxuICAgIHRoaXMuX2luaXQoKTtcbn1cblxuRmllbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFdmVudEVtaXR0ZXIucHJvdG90eXBlKTtcbkZpZWxkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZpZWxkO1xuXG5GaWVsZC5wcm90b3R5cGUuX2dldEJsb2NrVmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3VtbVJhdGlvbiA9IDA7XG4gICAgdmFyIHBvc3NpYmxlVmFsdWVzID0gY29uZmlnLm51bWJlcnMucG9zc2libGVWYWx1ZXM7XG5cbiAgICBwb3NzaWJsZVZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgIHN1bW1SYXRpb24gKz0gZWxbMV07XG4gICAgfSk7XG5cbiAgICB2YXIgc3VtbSA9IDA7XG5cbiAgICB2YXIgY2hhbmNlQXJyYXkgPSBwb3NzaWJsZVZhbHVlcy5tYXAoZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgdmFyIHZhbCA9IGVsWzFdIC8gc3VtbVJhdGlvbiArIHN1bW07XG5cbiAgICAgICAgc3VtbSArPSB2YWw7XG5cbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9KTtcblxuICAgIHZhciByb2xsID0gTWF0aC5yYW5kb20oKTtcblxuICAgIHZhciB2YWx1ZSA9IDA7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoYW5jZUFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChyb2xsIDw9IGNoYW5jZUFycmF5W2ldKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHBvc3NpYmxlVmFsdWVzW2ldWzBdO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX2Jsb2Nrc1hZID0gdGhpcy5fYmxvY2tzWFk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2l6ZVswXTsgaSsrKSB7XG4gICAgICAgIF9ibG9ja3NYWVtpXSA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5zaXplWzFdOyBqKyspIHtcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQmxvY2soe1xuICAgICAgICAgICAgICAgIHg6IGksXG4gICAgICAgICAgICAgICAgeTogalxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuY3JlYXRlQmxvY2sgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIGJsb2NrID0ge1xuICAgICAgICBpZDogKyt0aGlzLl9ibG9ja0lkQ291bnRlcixcbiAgICAgICAgdmFsdWU6IHRoaXMuX2dldEJsb2NrVmFsdWUoKSxcbiAgICAgICAgeDogb3B0aW9ucy54LFxuICAgICAgICB5OiBvcHRpb25zLnlcbiAgICB9O1xuXG4gICAgdGhpcy5fYmxvY2tzWFlbb3B0aW9ucy54XVtvcHRpb25zLnldID0gYmxvY2s7XG4gICAgdGhpcy5ibG9ja3NbYmxvY2suaWRdID0gYmxvY2s7XG5cbiAgICB0aGlzLmVtaXQoJ2Jsb2NrQ3JlYXRlZCcsIGJsb2NrLmlkKTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5ibG9ja01vdXNlRG93biA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdGhpcy5zZWxlY3RlZE1vZGUgPSB0cnVlO1xuICAgIHRoaXMuc2VsZWN0ZWRCbG9ja3MgPSBbaWRdO1xuXG4gICAgdGhpcy5lbWl0KCdibG9ja1NlbGVjdFN0YXJ0Jyk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuYmxvY2tNb3VzZVVwID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLnNlbGVjdGVkTW9kZSkgeyByZXR1cm47IH1cblxuICAgIHRoaXMuc2VsZWN0ZWRNb2RlID0gZmFsc2U7XG5cbiAgICB0aGlzLl9ydW5TZWxlY3RlZCgpO1xuXG4gICAgdGhpcy5lbWl0KCdibG9ja1NlbGVjdEZpbmlzaGVkJyk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2NoZWNrV2l0aExhc3QgPSBmdW5jdGlvbihpZCkge1xuICAgIHZhciBsYXN0QmwgPSB0aGlzLmJsb2Nrc1t0aGlzLnNlbGVjdGVkQmxvY2tzW3RoaXMuc2VsZWN0ZWRCbG9ja3MubGVuZ3RoIC0gMV1dO1xuICAgIHZhciBuZXdCbCA9IHRoaXMuYmxvY2tzW2lkXTtcblxuICAgIHJldHVybiBsYXN0QmwudmFsdWUgPT0gbmV3QmwudmFsdWUgJiZcbiAgICAgICAgTWF0aC5hYnMobGFzdEJsLnggLSBuZXdCbC54KSA8PSAxICYmXG4gICAgICAgIE1hdGguYWJzKGxhc3RCbC55IC0gbmV3QmwueSkgPD0gMTtcbn07XG5cbkZpZWxkLnByb3RvdHlwZS5ibG9ja01vdXNlT3ZlciA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgaWYgKCF0aGlzLnNlbGVjdGVkTW9kZSkgeyByZXR1cm47IH1cblxuICAgIHZhciBzZWxCbG9ja3MgPSB0aGlzLnNlbGVjdGVkQmxvY2tzO1xuXG4gICAgaWYgKHNlbEJsb2Nrcy5pbmRleE9mKGlkKSA9PSAtMSkge1xuICAgICAgICBpZiAodGhpcy5fY2hlY2tXaXRoTGFzdChpZCkpIHtcbiAgICAgICAgICAgIHNlbEJsb2Nrcy5wdXNoKGlkKTtcblxuXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2Jsb2NrU2VsZWN0Jyk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoc2VsQmxvY2tzW3NlbEJsb2Nrcy5sZW5ndGggLSAyXSA9PSBpZCkge1xuICAgICAgICAgICAgc2VsQmxvY2tzLnBvcCgpO1xuICAgICAgICAgICAgdGhpcy5lbWl0KCdibG9ja1Vuc2VsZWN0Jyk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuYmxvY2tNb3VzZU91dCA9IGZ1bmN0aW9uKGlkKSB7XG5cbn07XG5cbkZpZWxkLnByb3RvdHlwZS5fcnVuU2VsZWN0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggPCBjb25maWcuY2hhaW4ubWluTGVuZ3RoKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIGxhc3RCbCA9IHRoaXMuYmxvY2tzW3RoaXMuc2VsZWN0ZWRCbG9ja3MucG9wKCldO1xuXG4gICAgdmFyIHZhbHVlID0gbGFzdEJsLnZhbHVlO1xuXG4gICAgbGFzdEJsLnZhbHVlID0gdmFsdWUgKiAodGhpcy5zZWxlY3RlZEJsb2Nrcy5sZW5ndGggKyAxKTsgLy8gKzEgYmVjYXVzZSBwb3AgYWJvdmVcblxuICAgIHRoaXMuZW1pdCgnYmxvY2tWYWx1ZUNoYW5nZWQnLCBsYXN0QmwuaWQpO1xuXG4gICAgdGhpcy5zZWxlY3RlZEJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uKHNlbElkKSB7XG4gICAgICAgIHZhciBibG9jayA9IHRoaXMuYmxvY2tzW3NlbElkXTtcblxuICAgICAgICB0aGlzLl9ibG9ja3NYWVtibG9jay54XVtibG9jay55XSA9IG51bGw7XG5cbiAgICAgICAgZGVsZXRlIHRoaXMuYmxvY2tzW3NlbElkXTtcblxuICAgICAgICB0aGlzLmVtaXQoJ2Jsb2NrUmVtb3ZlZCcsIHNlbElkKTtcbiAgICB9LCB0aGlzKTtcblxuICAgIHRoaXMuX2NoZWNrUG9zaXRpb25zKCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2NoZWNrUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XG4gICAgT2JqZWN0LmtleXModGhpcy5fYmxvY2tzWFkpLmZvckVhY2goZnVuY3Rpb24oaEtleSkge1xuICAgICAgICB2YXIgYXJyID0gW107XG5cbiAgICAgICAgT2JqZWN0LmtleXModGhpcy5fYmxvY2tzWFlbaEtleV0pLmZvckVhY2goZnVuY3Rpb24odktleSkge1xuICAgICAgICAgICAgdmFyIGJsb2NrID0gdGhpcy5fYmxvY2tzWFlbaEtleV1bdktleV07XG5cbiAgICAgICAgICAgIGlmIChibG9jaykge1xuICAgICAgICAgICAgICAgIGFyci5wdXNoKGJsb2NrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgYXJyLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEueSA+IGIueTtcbiAgICAgICAgfSk7XG5cblxuICAgICAgICBhcnIuZm9yRWFjaChmdW5jdGlvbihibG9jaywgaSkge1xuICAgICAgICAgICAgaWYgKGJsb2NrLnkgIT0gaSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2Jsb2Nrc1hZW2Jsb2NrLnhdW2Jsb2NrLnldID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIGJsb2NrLnkgPSBpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fYmxvY2tzWFlbYmxvY2sueF1bYmxvY2sueV0gPSBibG9jaztcblxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnYmxvY2tQb3NpdGlvbkNoYW5nZWQnLCBibG9jay5pZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sIHRoaXMpO1xuXG4gICAgdGhpcy5fYWRkTmV3QmxvY2tzKCk7XG59O1xuXG5GaWVsZC5wcm90b3R5cGUuX2FkZE5ld0Jsb2NrcyA9IGZ1bmN0aW9uKCkge1xuICAgIE9iamVjdC5rZXlzKHRoaXMuX2Jsb2Nrc1hZKS5mb3JFYWNoKGZ1bmN0aW9uKGhLZXkpIHtcbiAgICAgICAgT2JqZWN0LmtleXModGhpcy5fYmxvY2tzWFlbaEtleV0pLmZvckVhY2goZnVuY3Rpb24odktleSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9ibG9ja3NYWVtoS2V5XVt2S2V5XSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlQmxvY2soe1xuICAgICAgICAgICAgICAgICAgICB4OiBoS2V5LFxuICAgICAgICAgICAgICAgICAgICB5OiB2S2V5XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sIHRoaXMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGaWVsZDtcbiIsInZhciB1dGlsID0ge307XG5cbnV0aWwuYWRkQ2xhc3MgPSBmdW5jdGlvbihlbCwgbmFtZSkge1xuICAgIHZhciBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG4gICAgdmFyIGluZGV4ID0gY2xhc3NOYW1lcy5pbmRleE9mKG5hbWUpO1xuXG4gICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICBjbGFzc05hbWVzLnB1c2gobmFtZSk7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZXMuam9pbignICcpO1xuICAgIH1cblxuICAgIHJldHVybiBlbDtcbn07XG5cbnV0aWwucmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbihlbCwgbmFtZSkge1xuICAgIHZhciBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG4gICAgdmFyIGluZGV4ID0gY2xhc3NOYW1lcy5pbmRleE9mKG5hbWUpO1xuXG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICBjbGFzc05hbWVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZXMuam9pbignICcpO1xuICAgIH1cblxuICAgIHJldHVybiBlbDtcbn07XG5cbnV0aWwuaGFzQ2xhc3MgPSBmdW5jdGlvbihlbCwgbmFtZSkge1xuICAgIHZhciBjbGFzc05hbWVzID0gZWwuY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG5cbiAgICByZXR1cm4gY2xhc3NOYW1lcy5pbmRleE9mKG5hbWUpICE9IC0xO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsO1xuIiwidmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vLi4vY29uZmlnJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuZnVuY3Rpb24gVmlld0Jsb2NrKGJsb2NrKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcblxuICAgIHRoaXMuX2NyZWF0ZUVsZW1lbnQoYmxvY2spO1xufVxuXG5WaWV3QmxvY2sucHJvdG90eXBlLl9jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oYmxvY2spIHtcbiAgICAvLyBUT0RPOiDQstC60LvRjtGH0LjRgtGMINC/0YDQvtGB0YLQvtC5INGI0LDQsdC70L7QvdC40LfQsNGC0L7RgFxuXG4gICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBlbGVtZW50LmNsYXNzTmFtZSA9ICdibG9jayBfJyArIGJsb2NrLnZhbHVlO1xuXG4gICAgZWxlbWVudC5zdHlsZS5ib3R0b20gPSBibG9jay55ICogY29uZmlnLmJsb2NrLmhlaWdodCArICdweCc7XG4gICAgZWxlbWVudC5zdHlsZS5sZWZ0ID0gYmxvY2sueCAqIGNvbmZpZy5ibG9jay53aWR0aCArICdweCc7XG5cbiAgICB2YXIgYWN0aXZlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgYWN0aXZlLmNsYXNzTmFtZSA9ICdibG9ja19fYWN0aXZlJztcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGFjdGl2ZSk7XG5cbiAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRleHQuY2xhc3NOYW1lID0gJ2Jsb2NrX190ZXh0JztcbiAgICB0ZXh0LmlubmVySFRNTCA9IGJsb2NrLnZhbHVlO1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQodGV4dCk7XG5cbiAgICB0aGlzLnRleHRFbGVtZW50ID0gdGV4dDtcbiAgICB0aGlzLmFjdGl2ZUVsZW1lbnQgPSBhY3RpdmU7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbn07XG5cblZpZXdCbG9jay5wcm90b3R5cGUuY2hhbmdlUG9zaXRpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy5lbGVtZW50LnN0eWxlLmxlZnQgPSB4ICogY29uZmlnLmJsb2NrLndpZHRoICsgJ3B4JztcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUuYm90dG9tID0geSAqIGNvbmZpZy5ibG9jay5oZWlnaHQgKyAncHgnO1xufTtcblxuVmlld0Jsb2NrLnByb3RvdHlwZS5jaGFuZ2VWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdGhpcy50ZXh0RWxlbWVudC5pbm5lckhUTUwgPSB2YWx1ZTtcbn07XG5cblZpZXdCbG9jay5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICB1dGlsLmFkZENsYXNzKHRoaXMuZWxlbWVudCwgJ19zZWxlY3RlZCcpO1xufTtcblxuVmlld0Jsb2NrLnByb3RvdHlwZS51bnNlbGVjdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdXRpbC5yZW1vdmVDbGFzcyh0aGlzLmVsZW1lbnQsICdfc2VsZWN0ZWQnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmlld0Jsb2NrO1xuIiwidmFyIFZpZXdCbG9jayA9IHJlcXVpcmUoJy4vYmxvY2snKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xuXG5mdW5jdGlvbiBWaWV3RmllbGQoZmllbGQpIHtcbiAgICB0aGlzLm1vZGVsID0gZmllbGQ7XG5cbiAgICB0aGlzLnZpZXdCbG9ja3MgPSB7fTtcblxuICAgIHRoaXMuZnJhZ21lbnQgPSBudWxsO1xuXG4gICAgdGhpcy5fY3JlYXRlRmllbGQoKTtcbiAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XG59XG5cblZpZXdGaWVsZC5wcm90b3R5cGUuX2NyZWF0ZUZpZWxkID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5mcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZnJhZ21lbnQuY2xhc3NOYW1lID0gJ2ZpZWxkJztcblxuICAgIE9iamVjdC5rZXlzKHRoaXMubW9kZWwuYmxvY2tzKS5mb3JFYWNoKHRoaXMuX2NyZWF0ZUJsb2NrLCB0aGlzKTtcbn07XG5cblZpZXdGaWVsZC5wcm90b3R5cGUuX2NyZWF0ZUJsb2NrID0gZnVuY3Rpb24oaWQsIGFuaW1hdGUpIHtcbiAgICB2YXIgdmlld0Jsb2NrID0gbmV3IFZpZXdCbG9jayh0aGlzLm1vZGVsLmJsb2Nrc1tpZF0pO1xuXG4gICAgdGhpcy52aWV3QmxvY2tzW2lkXSA9IHZpZXdCbG9jaztcblxuICAgIHZpZXdCbG9jay5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChmdW5jdGlvbihldikge1xuICAgICAgICB0aGlzLm1vZGVsLmJsb2NrTW91c2VEb3duKGlkKTtcbiAgICB9KS5iaW5kKHRoaXMpKTtcblxuICAgIHZpZXdCbG9jay5hY3RpdmVFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIChmdW5jdGlvbihldikge1xuICAgICAgICB0aGlzLm1vZGVsLmJsb2NrTW91c2VPdmVyKGlkKTtcbiAgICB9KS5iaW5kKHRoaXMpKTtcblxuICAgIHZpZXdCbG9jay5hY3RpdmVFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0JywgKGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIHRoaXMubW9kZWwuYmxvY2tNb3VzZU91dChpZCk7XG4gICAgfSkuYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLmZyYWdtZW50LmFwcGVuZENoaWxkKHZpZXdCbG9jay5lbGVtZW50KTtcblxuICAgIGlmIChhbmltYXRlID09PSB0cnVlKSB7XG4gICAgICAgIHV0aWwuYWRkQ2xhc3Modmlld0Jsb2NrLmVsZW1lbnQsICdfYmxpbmsnKTtcblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdXRpbC5yZW1vdmVDbGFzcyh2aWV3QmxvY2suZWxlbWVudCwgJ19ibGluaycpO1xuICAgICAgICB9LCAwKTtcbiAgICB9XG59O1xuXG5WaWV3RmllbGQucHJvdG90eXBlLmJsb2NrQ3JlYXRlID0gZnVuY3Rpb24oaWQpIHtcbiAgICB0aGlzLl9jcmVhdGVCbG9jayhpZCwgdHJ1ZSk7XG59O1xuXG5WaWV3RmllbGQucHJvdG90eXBlLl9iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm1vZGVsLmJsb2NrTW91c2VVcCgpO1xuICAgIH0pLmJpbmQodGhpcykpO1xuXG4gICAgLy8gbW9kZWwgLT4gdmlld1xuICAgIHRoaXMubW9kZWwub24oJ2Jsb2NrQ3JlYXRlZCcsIHRoaXMuYmxvY2tDcmVhdGUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5tb2RlbC5vbignYmxvY2tSZW1vdmVkJywgdGhpcy5ibG9ja1JlbW92ZWQuYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLm1vZGVsLm9uKCdibG9ja1Bvc2l0aW9uQ2hhbmdlZCcsIHRoaXMudXBkYXRlQmxvY2tQb3NpdGlvbi5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLm1vZGVsLm9uKCdibG9ja1ZhbHVlQ2hhbmdlZCcsIHRoaXMudXBkYXRlQmxvY2tWYWx1ZS5iaW5kKHRoaXMpKTtcblxuICAgIHRoaXMubW9kZWwub24oJ2Jsb2NrU2VsZWN0U3RhcnQnLCB0aGlzLnN0YXJ0U2VsZWN0LmJpbmQodGhpcykpO1xuICAgIHRoaXMubW9kZWwub24oJ2Jsb2NrU2VsZWN0JywgdGhpcy5zZWxlY3QuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5tb2RlbC5vbignYmxvY2tVbnNlbGVjdCcsIHRoaXMudW5zZWxlY3QuYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLm1vZGVsLm9uKCdibG9ja1NlbGVjdEZpbmlzaGVkJywgdGhpcy5zZWxlY3RGaW5pc2hlZC5iaW5kKHRoaXMpKTtcbn07XG5cblZpZXdGaWVsZC5wcm90b3R5cGUudXBkYXRlQmxvY2tQb3NpdGlvbiA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdmFyIGJsb2NrID0gdGhpcy5tb2RlbC5ibG9ja3NbaWRdO1xuXG4gICAgdGhpcy52aWV3QmxvY2tzW2lkXS5jaGFuZ2VQb3NpdGlvbihibG9jay54LCBibG9jay55KTtcbn07XG5cblZpZXdGaWVsZC5wcm90b3R5cGUudXBkYXRlQmxvY2tWYWx1ZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgdGhpcy52aWV3QmxvY2tzW2lkXS5jaGFuZ2VWYWx1ZSh0aGlzLm1vZGVsLmJsb2Nrc1tpZF0udmFsdWUpO1xufTtcblxuVmlld0ZpZWxkLnByb3RvdHlwZS5zdGFydFNlbGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBibG9jayA9IHRoaXMubW9kZWwuc2VsZWN0ZWRCbG9ja3NbMF07XG5cbiAgICB0aGlzLnNlbGVjdGVkQmxvY2tzID0gW2Jsb2NrXTtcbiAgICB0aGlzLnZpZXdCbG9ja3NbYmxvY2tdLnNlbGVjdCgpO1xufTtcblxuVmlld0ZpZWxkLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYmxvY2tzID0gdGhpcy5tb2RlbC5zZWxlY3RlZEJsb2NrcztcbiAgICB2YXIgYmxvY2sgPSBibG9ja3NbYmxvY2tzLmxlbmd0aCAtIDFdO1xuXG4gICAgdGhpcy5zZWxlY3RlZEJsb2Nrcy5wdXNoKGJsb2NrKTtcbiAgICB0aGlzLnZpZXdCbG9ja3NbYmxvY2tdLnNlbGVjdCgpO1xufTtcblxuVmlld0ZpZWxkLnByb3RvdHlwZS51bnNlbGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBibG9jayA9IHRoaXMuc2VsZWN0ZWRCbG9ja3MucG9wKCk7XG5cbiAgICB0aGlzLnZpZXdCbG9ja3NbYmxvY2tdLnVuc2VsZWN0KCk7XG59O1xuXG5WaWV3RmllbGQucHJvdG90eXBlLnNlbGVjdEZpbmlzaGVkID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zZWxlY3RlZEJsb2Nrcy5mb3JFYWNoKGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIGlmICh0aGlzLnZpZXdCbG9ja3NbaWRdKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXdCbG9ja3NbaWRdLnVuc2VsZWN0KCk7XG4gICAgICAgIH1cbiAgICB9LCB0aGlzKTtcbn07XG5cblZpZXdGaWVsZC5wcm90b3R5cGUuYmxvY2tSZW1vdmVkID0gZnVuY3Rpb24oaWQpIHtcbiAgICB2YXIgaHRtbEJsb2NrID0gdGhpcy52aWV3QmxvY2tzW2lkXS5lbGVtZW50O1xuICAgIHRoaXMuZnJhZ21lbnQucmVtb3ZlQ2hpbGQoaHRtbEJsb2NrKTtcblxuICAgIGRlbGV0ZSB0aGlzLnZpZXdCbG9ja3NbaWRdO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3RmllbGQ7XG4iXX0=