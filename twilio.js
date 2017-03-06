var twilio = require('twilio');
var client = new twilio.RestClient('AC387980ba37289ed349ded45fce980826', 'c2eda4518dd43364d3c7fbbcc10eb109');


var accountSid = 'AC387980ba37289ed349ded45fce980826';
var authToken = 'c2eda4518dd43364d3c7fbbcc10eb109';
var IpMessagingClient = require('twilio').IpMessagingClient;

var client = new IpMessagingClient(accountSid, authToken);
var service = client.services('IS9126f1ea37da4a8a880ee7ce62f3a627');

module.exports = {
    sendTextMessage : function(message_to_send, senderID) {
        //REST Client
        console.log(senderID);
        console.log(message_to_send);
        client.sms.messages.create({
            to: senderID,
            from: '+12052362709',
            body: message_to_send
        }, function(error, message) {
            if (error) {
                console.log(error);
            }
        });
    },

    sendIpMessage : function(message_to_send, channelSId) {
        service.channels(channelSId).messages.create({
                body: message_to_send
                }).then(function(response) {
                    //console.log(response);
                }).fail(function(error) {
                console.log(error);
                });
    }
};