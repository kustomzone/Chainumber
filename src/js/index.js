var LevelMenu = require('./levelMenu/levelMenu.js');
var util = require('./util.js');

if (!util.isMobile) {
    util.addClass(document.body, 'no-touch');
}

var html = document.getElementById('game');

var levelMenu = new LevelMenu();

html.appendChild(levelMenu.element);
