var analytics = require('./analytics');
var State = require('./state');
var util = require('./util');

if (!util.isMobile) {
    util.addClass(document.body, 'no-touch');
}

analytics.init();

var html = document.getElementById('game');

var state = new State();

html.appendChild(state.element);

state.runMainMenu();
