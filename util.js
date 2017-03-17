var cache = require('./cacheHelper'),
    constants = require('./constants'),
    dbConnector = require('./dbConnector.js'),
    request = require('request'),
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

    sendRequest: function (url, qs, method, headers, body, form, callback, json) {
        //console.log("url", url, "qs", qs, "body", body)
        var js = true;
        if (json != undefined)
            js = false;
        request({
            url: url, //URL to hit
            qs: qs, //Query string data
            method: method,
            headers: headers,
            json: js,
            body: body,
            form: form
        }, function (error, response, body) {
            if(error){
                throw error;
            }
            if (callback)
                callback(error, response, body);
        });
    },
};