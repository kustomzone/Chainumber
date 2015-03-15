var saves = require('./saves.js');
var util = require('./util.js');

var abilityModules = {
    hammer: require('./abilities/hammer.js')
};

var abilitiesOrder = ['hammer'];

var abilities = {};

var store = {};

function init() {
    var savedAbilities = saves.getAbilities();

    util.forEach(abilityModules, function(Ability, name) {
        savedAbilities[name] = savedAbilities[name] || {};

        var opt = {
            name: name,
            count: savedAbilities[name].count || 0
        };

        abilities[name] = new Ability(opt);
    });
}

init();

store.get = function() {
    return abilitiesOrder.map(function(name) {
        return abilities[name];
    });
};

module.exports = store;
