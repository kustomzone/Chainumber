var Field = require('./game/field.js');

var field = new Field();

var html = document.getElementById('game');

html.appendChild(field.element);
