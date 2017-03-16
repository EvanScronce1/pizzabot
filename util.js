var cache = require('./cacheHelper'),
    constants = require('./constants'),
    dbConnector = require('./dbConnector.js');
    config = require("./config.json");

module.exports = {

    getState: function (sender, callback) {
        //return cache.getValue(sender, constants.USERSTATE_CACHE);
        dbConnector.getState(sender, function(state) {
                console.log(state);
                callback(state);
        });
    },

    saveState: function (sender, state, callback) {
        
        //cache.addKeyValue(sender, state, constants.USERSTATE_CACHE);
        dbConnector.saveState(sender, state, function(value){
            if(value){
                callback(value);
            }         
        });

    },

    updateState: function (sender, newState, callback) {
        module.exports.getState(sender, function(state) {
            if (state == undefined)
                state = newState;
            else {
                for (var key in newState) {
                    state[key] = newState[key];
                }
            }
  
            module.exports.saveState(sender, state, function(done){
                if(done && callback){
                    callback(state);
                }
            });
        });
    },
};