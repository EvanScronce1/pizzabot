var cache = require('./cacheHelper'),
    constants = require('./constants'),
    dbConnector = require('./dbConnector.js');
    config = require("./config.json");

module.exports = {

    getState: function (sender, callback) {
        return cache.getValue(sender, constants.USERSTATE_CACHE);
    },

    saveState: function (sender, state) {
        
        cache.addKeyValue(sender, state, constants.USERSTATE_CACHE);
        // dbConnector.saveState(sender, state, function(value){
        //     if(value)
        //         console.log("state saved")
        // });

    },

    updateState: function (sender, newState, callback) {
        var state = module.exports.getState(sender, null);

        if (state == undefined)
            state = newState;
        else {
            for (var key in newState) {
                state[key] = newState[key];
            }
        }
        module.exports.saveState(sender, state, null);
    },
};