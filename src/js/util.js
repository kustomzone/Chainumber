var util = {};

util.addClass = function(el, name) {
    if (el.classList !== undefined) {
            el.classList.add(name);
    } else {
        var classNames = el.className.split(' ');
        var index = classNames.indexOf(name);

        if (index === -1) {
            classNames.push(name);
            el.className = classNames.join(' ');
        }
    }

    return this;
};

util.removeClass = function(el, name) {
    if (el.classList !== undefined) {
        el.classList.remove(name);
    } else {
        var classNames = el.className.split(' ');
        var index = classNames.indexOf(name);

        if (index !== -1) {
            classNames.splice(index, 1);
            el.className = classNames.join(' ');
        }
    }

    return this;
};

util.hasClass = function(el, name) {
    if (el.classList !== undefined) {
        return el.classList.contains(name);
    }

    var classNames = el.className.split(' ');

    return classNames.indexOf(name) != -1;
};

util.forEach = function(obj, iterator, context) {
    if (obj.length) {
        obj.forEach(iterator, context);
    } else {
        Object.keys(obj).forEach(function(key) {
            iterator.call(context, obj[key], key);
        });
    }
};

util.on = function(node, type, callback, useCapture) {
    node.addEventListener(type, callback, useCapture);
};

util.off = function(node, type, callback, useCapture) {
    node.removeEventListener(type, callback, useCapture);
};

util.isMobile = 'ontouchstart' in window || (window.DocumentTouch && document instanceof window.DocumentTouch);

util.rgbSum = function(arr) {
    //[{rgb, ratio}, ...]

    var sum = [0, 0, 0];
    var n = 0;
    var el, i, j;

    for (i = 0; i < arr.length; i++) {
        el = arr[i];

        for (j = 0; j < 3; j++) {
            sum[j] += el.rgb[j] * el.ratio;
        }

        n += el.ratio;
    }

    for (j = 0; j < 3; j++) {
        sum[j] = Math.floor(sum[j] / n);
    }

    return sum;
};

util.nullFn = function() {};


// get random value from array with relations
// [ [value, ratio], ... ]
util.random = function(array) {
    var sumRation = 0;

    array.forEach(function(el) {
        sumRation += el[1];
    });

    var sum = 0;

    var chanceArray = array.map(function(el) {
        var val = el[1] / sumRation + sum;

        sum = val;

        return val;
    });

    var roll = Math.random();

    var value = 0;

    for (var i = 0; i < chanceArray.length; i++) {
        if (roll <= chanceArray[i]) {
            value = array[i][0];
            break;
        }
    }

    return value;
};

var ua = navigator.userAgent.toLowerCase(),
    docEl = document.documentElement,

    ie = 'ActiveXObject' in window,
    android23 = ua.search('android [23]') !== -1,

    ie3d = ie && ('transition' in docEl.style),
    webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23,
    gecko3d = 'MozPerspective' in docEl.style,

    supportsTransition3d = ie3d || webkit3d || gecko3d;

function testProps(props) {
    var style = document.documentElement.style;

    for (var i = 0; i < props.length; i++) {
        if (props[i] in style) {
            return props[i];
        }
    }

    return false;
}

var TRANSFORM = testProps(['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']);

util.setPosition = function(el, point) {
    if (supportsTransition3d) {
        el.style[TRANSFORM] = 'translate3d(' + point[0] + 'px,' + point[1] + 'px' + ',0)';
    } else {
        el.style.left = point[0] + 'px';
        el.style.top = point[1] + 'px';
    }
};

module.exports = util;
