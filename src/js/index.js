var analytics = require('./analytics.js');
var State = require('./state.js');
var util = require('./util.js');

if (!util.isMobile) {
    util.addClass(document.body, 'no-touch');
}

analytics.init();

var html = document.getElementById('game');

var state = new State();

html.appendChild(state.element);

state.runMainMenu();
