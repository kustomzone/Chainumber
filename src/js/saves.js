var saves = {};

saves.getLevels = function() {
    var levelsJSON = localStorage.getItem('levels');
    var levels;

    if (levelsJSON) {
        try {
            levels = JSON.parse(levelsJSON);
        } catch (e) {
            levels = {};
        }
    } else {
        levels = {};
    }

    return levels;
};

module.exports = saves;
