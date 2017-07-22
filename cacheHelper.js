var NodeCache = require('node-cache'),
    pizzaCache = new NodeCache(),
    userState = new NodeCache(),
    userCache = new NodeCache(),
    agentsSmsCache = new NodeCache(),
    constants = require('./constants.js');

module.exports = {

    resetCache: function(){
        pizzaCache = new NodeCache();
        userCache = new NodeCache();
        agentsSmsCache = new NodeCache();
    },

    getAllKeys: function(cacheType) {
        switch (cacheType) {
            case constants.PIZZA_CACHE:
                return pizzaCache.keys();
                break;
            case constants.USERSTATE_CACHE:
                return userState.keys();
                break;
            case constants.USER_CACHE:
                return userCache.keys();
                break;
            case constants.AGENTS_SMS_CACHE:
                return agentsSmsCache.keys();
                break;
            default:
                return;
        }
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
            case constants.AGENTS_SMS_CACHE:
                agentsSmsCache.set(key, value);
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
            case constants.AGENTS_SMS_CACHE:
                return agentsSmsCache.get(key);
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
            case constants.AGENTS_SMS_CACHE:
                return agentsSmsCache.del(key);
                break;
            default:
                return;
        }
    }
};