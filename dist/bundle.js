(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Block = require('./block.js');
var config = require('./config.js');

function createField() {
    var field = document.createDocumentFragment();

    var length = config.field.size[0] * config.field.size[1];

    for (var i = 0; i < config.field.size[0]; i++) {
        for (var j = 0; j < config.field.size[1]; j++) {
            (function(i, j) {
                var block = new Block({
                    value: 1,
                    x: j,
                    y: i
                });

                field.appendChild(block.getElement());
            })(i, j);
        }
    }

    return field;
}

var html = document.getElementById('game');

html.appendChild(createField());

},{"./block.js":2,"./config.js":3}],2:[function(require,module,exports){
var config = require('./config');

function Block(options) {
    this._value = options.value || null;
    this._element = null;

    this._createElement();
    this.setPosition(options.x, options.y);
}

Block.prototype._createElement = function() {
    // TODO: включить простой шаблонизатор

    var element = document.createElement('div');
    element.className = 'block _' + this._value;
    element.innerHTML = this._value;

    var active = document.createElement('div');
    active.className = 'block__active';

    element.appendChild(active);

    this._element = element;
};

Block.prototype.setValue = function(value) {
    this._value = value;
    this._element.innerHTML = this._value;
};

Block.prototype.getValue = function() {
    return this._value;
};

Block.prototype.getElement = function() {
    return this._element;
};

Block.prototype.setPosition = function(x, y) {
    this.x = x;
    this.y = y;
    this._element.style.top = y * config.block.height + 'px';
    this._element.style.left = x * config.block.width + 'px';
};

module.exports = Block;

},{"./config":3}],3:[function(require,module,exports){
module.exports = {
    field: {
        size: [4, 4]
    },
    block: {
        width: 54,
        height: 54
    }
};

},{}]},{},[1])


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvaW5kZXguanMiLCJzcmMvanMvYmxvY2suanMiLCJzcmMvanMvY29uZmlnLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgQmxvY2sgPSByZXF1aXJlKCcuL2Jsb2NrLmpzJyk7XG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcuanMnKTtcblxuZnVuY3Rpb24gY3JlYXRlRmllbGQoKSB7XG4gICAgdmFyIGZpZWxkID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgdmFyIGxlbmd0aCA9IGNvbmZpZy5maWVsZC5zaXplWzBdICogY29uZmlnLmZpZWxkLnNpemVbMV07XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbmZpZy5maWVsZC5zaXplWzBdOyBpKyspIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjb25maWcuZmllbGQuc2l6ZVsxXTsgaisrKSB7XG4gICAgICAgICAgICAoZnVuY3Rpb24oaSwgaikge1xuICAgICAgICAgICAgICAgIHZhciBibG9jayA9IG5ldyBCbG9jayh7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAxLFxuICAgICAgICAgICAgICAgICAgICB4OiBqLFxuICAgICAgICAgICAgICAgICAgICB5OiBpXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBmaWVsZC5hcHBlbmRDaGlsZChibG9jay5nZXRFbGVtZW50KCkpO1xuICAgICAgICAgICAgfSkoaSwgaik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmllbGQ7XG59XG5cbnZhciBodG1sID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dhbWUnKTtcblxuaHRtbC5hcHBlbmRDaGlsZChjcmVhdGVGaWVsZCgpKTtcbiIsInZhciBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xuXG5mdW5jdGlvbiBCbG9jayhvcHRpb25zKSB7XG4gICAgdGhpcy5fdmFsdWUgPSBvcHRpb25zLnZhbHVlIHx8IG51bGw7XG4gICAgdGhpcy5fZWxlbWVudCA9IG51bGw7XG5cbiAgICB0aGlzLl9jcmVhdGVFbGVtZW50KCk7XG4gICAgdGhpcy5zZXRQb3NpdGlvbihvcHRpb25zLngsIG9wdGlvbnMueSk7XG59XG5cbkJsb2NrLnByb3RvdHlwZS5fY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFRPRE86INCy0LrQu9GO0YfQuNGC0Ywg0L/RgNC+0YHRgtC+0Lkg0YjQsNCx0LvQvtC90LjQt9Cw0YLQvtGAXG5cbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gJ2Jsb2NrIF8nICsgdGhpcy5fdmFsdWU7XG4gICAgZWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLl92YWx1ZTtcblxuICAgIHZhciBhY3RpdmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBhY3RpdmUuY2xhc3NOYW1lID0gJ2Jsb2NrX19hY3RpdmUnO1xuXG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChhY3RpdmUpO1xuXG4gICAgdGhpcy5fZWxlbWVudCA9IGVsZW1lbnQ7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuc2V0VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy5fZWxlbWVudC5pbm5lckhUTUwgPSB0aGlzLl92YWx1ZTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbn07XG5cbkJsb2NrLnByb3RvdHlwZS5nZXRFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2VsZW1lbnQ7XG59O1xuXG5CbG9jay5wcm90b3R5cGUuc2V0UG9zaXRpb24gPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIHRoaXMuX2VsZW1lbnQuc3R5bGUudG9wID0geSAqIGNvbmZpZy5ibG9jay5oZWlnaHQgKyAncHgnO1xuICAgIHRoaXMuX2VsZW1lbnQuc3R5bGUubGVmdCA9IHggKiBjb25maWcuYmxvY2sud2lkdGggKyAncHgnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCbG9jaztcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGZpZWxkOiB7XG4gICAgICAgIHNpemU6IFs0LCA0XVxuICAgIH0sXG4gICAgYmxvY2s6IHtcbiAgICAgICAgd2lkdGg6IDU0LFxuICAgICAgICBoZWlnaHQ6IDU0XG4gICAgfVxufTtcbiJdfQ==