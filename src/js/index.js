var Field = require('./model/field.js');
var ViewField = require('./view/field');
var config = require('./config.js');

var field = new Field();

var viewField = new ViewField(field);

var html = document.getElementById('game');

html.appendChild(viewField.fragment);
