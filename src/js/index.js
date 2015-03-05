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
