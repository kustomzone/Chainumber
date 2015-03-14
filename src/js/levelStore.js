var util = require('./util.js');
var saves = require('./saves.js');
var gameConfig = require('./gameConfig.js');

var levelConfig = config.levels;

var savedLevels = saves.getLevels();

var levelStore = {};

var levels = {};

function initLevels() {
    gameConfig.levels.forEach(function(name) {
        var level = levelConfig[name];
        level.name = name;

        if (savedLevels[name]) {
            level.currentGoal = Number(savedLevels[name].currentGoal) || 0;
            level.maxScore = Number(savedLevels[name].maxScore) || 0;
        } else {
            level.currentGoal = 0;
            level.maxScore = 0;
        }

        levels[name] = level;
    });

    util.on(window, 'beforeunload', onCloseHandler);
}

function onCloseHandler() {
    var dataToSave = {};

    util.forEach(levels, function(level, name) {
        dataToSave[name] = {
            maxScore: level.maxScore,
            currentGoal: level.currentGoal
        }
    });

    saves.setLevels(dataToSave);
}

levelStore.get = function(name) {
    return levels[name];
};

levelStore.checkOpenLevels = function() {
    var openLevelsLength = 0;

    gameConfig.levels.forEach(function(name, i) {
        var level = levels[name];

        if (level.currentGoal > 0) {
            openLevelsLength++;
        }

        level.isOpen = i < openLevelsLength + gameConfig.minOpenLevels;
    });
};

initLevels();
levelStore.checkOpenLevels();

module.exports = levelStore;
