module.exports = {
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
