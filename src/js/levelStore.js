var gameConfig = require('./gameConfig.js');
var saves = require('./saves.js');
var util = require('./util.js');

var levelConfig = config.levels;

var levelStore = {};

var levels = {};

function initLevels() {
    var savedLevels = saves.getLevels();

    gameConfig.levels.forEach(function(name) {
        var level = levelConfig[name];
        level.name = name;

        savedLevels[name] = savedLevels[name] || {};

        level.currentGoal = savedLevels[name].currentGoal || 0;
        level.maxScore = savedLevels[name].maxScore || 0;

        levels[name] = level;
    });

    levelStore.checkOpenLevels();
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

levelStore.saveLevels = function() {
    var dataToSave = {};

    util.forEach(levels, function(level, name) {
        dataToSave[name] = {
            maxScore: level.maxScore,
            currentGoal: level.currentGoal
        }
    });

    saves.setLevels(dataToSave);
};

initLevels();

module.exports = levelStore;
