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


// Seem legit
var isMobile = ('DeviceOrientationEvent' in window || 'orientation' in window);
// But with my Chrome on windows, DeviceOrientationEvent == fct()
if (/Windows NT|Macintosh|Mac OS X|Linux/i.test(navigator.userAgent)) isMobile = false;
// My android have "linux" too
if (/Mobile/i.test(navigator.userAgent)) isMobile = true;

util.isMobile = isMobile;

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

module.exports = util;
