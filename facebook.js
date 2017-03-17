var utils = require('./util.js');
var config = require('./config.json');

module.exports = {

    sendTextMessage: function (text, sender) {
        var messageData = {
            text: text
        };

        module.exports.sendMessage(sender, messageData);
    },

    sendMessage: function (sender, messageData, fileUrl, callback) {
        var json_data = {
            recipient: {
                id: sender
            },
            message: messageData,
            filedata: fileUrl
        };

        var qs = {
            access_token: config.facebook.url.access_token
        };

        var url = config.facebook.url.fbGraphMsgUrl;

        utils.sendRequest(url, qs, 'POST', null, json_data, null, function (err, res, body) {
            if (err) {
                console.log('Error sending message: ', err);
            } else if (res.body.error) {
                console.log('Error: ', res.body.error);
            } else {
                if (callback != undefined)
                    callback(body);
            }
        });
    },
    getFacebookUser: function (sender, callback) {
        var qs = {
            access_token: config.facebook.url.access_token
        };

        var url = config.facebook.url.fbGraphApi + sender;

        utils.sendRequest(url, qs, 'GET', null, null, null, function (err, res, body) {
            if (err) {
                console.log('Error sending message: ', err);
            } else if (res.body.error) {
                console.log('Error: ', res.body.error);
            } else {
                if (callback != undefined)
                    callback(body);
            }
        });
    }
};