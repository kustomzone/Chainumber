var util = require('./util.js');
var saves = require('./saves.js');
var gameConfig = require('./gameConfig.js');

var levelConfig = config.levels;

var savedLevel = saves.getLevels();

var levelStore = {};

var levels = {};

function initLevels() {
    gameConfig.levels.forEach(function(name, i) {
        var level = levelConfig[name];
        level.name = name;
        level.currentGoal = savedLevel.currentGoal || 0;
        level.maxScore = savedLevel.maxScore || 0;

        levels[name] = level;
    });
}

levelStore.get = function(name) {
    return levels[name];
};

levelStore.getNext = function(name) {
    var nameIndex = gameConfig.levels.indexOf(name);

    if (nameIndex === -1) { return null; }

    var nextLevelName = gameConfig.levels[nameIndex + 1];

    if (!nextLevelName) { return null; }

    return levels[nextLevelName];
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
