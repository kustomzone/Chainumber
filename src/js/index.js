var Block = require('./block.js');
var config = require('./config.js');

function createField() {
    var field = document.createDocumentFragment();

    var length = config.field.size[0] * config.field.size[1];

    for (var i = 0; i < length; i++) {
        (function(i) {
            var block = new Block({value: 1});

            field.appendChild(block.getElement());
        })(i);
    }

    return field;
}

var html = document.getElementById('game');

html.appendChild(createField());
