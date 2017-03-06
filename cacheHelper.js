var NodeCache = require('node-cache'),
    pizzaCache = new NodeCache(),
    userState = new NodeCache(),
    userCache = new NodeCache(),
    constants = require('./constants.js');

module.exports = {

    resetCache: function(){
        pizzaCache = new NodeCache();
        userCache = new NodeCache();
    },

    addKeyValue: function (key, value, cacheType) {
        switch (cacheType) {
            case constants.PIZZA_CACHE:
                pizzaCache.set(key, value);
                break;
            case constants.USERSTATE_CACHE:
                userState.set(key, value);
                break;
            case constants.USER_CACHE:
                userCache.set(key, value);
                break;
            default:
                return;
        }
    },

    getValue: function (key, cacheType) {
        switch (cacheType) {
            case constants.PIZZA_CACHE:
                return pizzaCache.get(key);
                break;
            case constants.USERSTATE_CACHE:
                return userState.get(key);
                break;
            case constants.USER_CACHE:
                return userCache.get(key);
                break;
            default:
                return;
        }
    },

    isKeyPresent: function (key, cacheType) {
        return !!module.exports.getValue(key, cacheType);
    },

    deleteKey: function (key, cacheType) {
        switch (cacheType) {
            case constants.PIZZA_CACHE:
                return pizzaCache.del(key);
                break;
            case constants.USERSTATE_CACHE:
                return userState.del(key);
                break;
            case constants.USER_CACHE:
                return userCache.del(key);
                break;
            default:
                return;
        }
    }
};