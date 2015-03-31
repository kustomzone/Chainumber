var saves = require('./saves');

var unitID;

function genUnitID() {
    return Math.round(Math.random() * Math.pow(10, 16));
}

function initUnitID() {
    unitID = saves.getUnitID();

    if (!unitID) {
        unitID = genUnitID();
        saves.setUnitID(unitID);
    }
}


module.exports = {
    init: function() {
        initUnitID();

        ga('create', 'UA-61340943-1', 'auto');
        ga('set', '&uid', unitID);
        ga('send', 'pageview');
    },

    goalAchived: function(goalNumber) {
        ga('send', 'event', 'game', 'goal achived', String(goalNumber));
    },

    abilityUsed: function(abilityName, blockValue) {
        ga('send', 'event', 'game', 'ability used', String(abilityName), blockValue);
    },

    levelStarted: function(levelName) {
        ga('send', 'event', 'game', 'level started', String(levelName));
    },

    levelResumed: function(levelName) {
        ga('send', 'event', 'game', 'level resume', String(levelName));
    },

    levelRestart: function(levelName) {
        ga('send', 'event', 'game', 'level restart', String(levelName));
    },

    maxScoreUp: function(score) {
        ga('send', 'event', 'game', 'max score up', String(score));
    }
};
