var saves = {};

function getFromLocalStorage(name) {
    var levelsJSON = localStorage.getItem(name);
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
}

function setToLocalStorage(name, data) {
    localStorage.setItem(name, JSON.stringify(data));
}

saves.getLevels = function() {
    return getFromLocalStorage('levels');
};

saves.setLevels = function(data) {
    setToLocalStorage('levels', data);
};

saves.setActiveLevel = function(data) {
    setToLocalStorage('activeLevel', data);
};

saves.getActiveLevel = function() {
    return getFromLocalStorage('activeLevel');
};

saves.setAbilities = function(data) {
    setToLocalStorage('abilities', data);
};

saves.getAbilities = function() {
    return getFromLocalStorage('abilities');
};

saves.setUnitID = function(id) {
    localStorage.setItem('unitID', id);
};

saves.getUnitID = function() {
    return localStorage.getItem('unitID');
};

saves.isFirstGame = function() {
    if (localStorage.getItem('isFirstGame') == null) {
        localStorage.setItem('isFirstGame', '1');
        return true;
    }

    return false;
};

module.exports = saves;
