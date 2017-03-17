'use strict';

require('./twilio.js');
require('./sheets_sms.js')();
var config = require('./config.json'),  
    constants = require('./constants.js'),
    service = require('./service.js'),
    cacheHelper = require('./cacheHelper.js'),
    dbConnector = require('./dbConnector.js');

//const uuidV1 = require('uuid/v1');
var shortid = require('shortid');
var request = require('request');


const Hapi = require('hapi');
const server = new Hapi.Server();
var LRU = require("lru-cache");
var mysql = require('mysql');
var chrono = require('chrono-node')
var follow_up_arr = new Object();
var moment = require('moment');
var phone = require('phone');

// var dbconn = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'Monotype123#',
//     database: 'pizzabot'
// });

server.connection({
    host: '0.0.0.0',
    port: 9091
});

var options = {
    max: 5000,
    length: function(n, key) {
        return n * 2 + key.length
    },
    dispose: function(key, n) {
        n.close()
    }
};

var agentscache = new Object();
var usercache = LRU(options);

server.route({
    method: 'GET',
    path: '/webhook/',
    handler: function(request, reply) {
        console.log(request.query);
        if (request.query['hub.verify_token'] === 'research_is_great') {
            reply(request.query['hub.challenge']);
        } else {
            reply('Error, wrong validation token');
        }
    }
});

server.route({
    method: 'GET',
    path: '/refresh_users',
    handler: function(request, reply) {
        // var pizzaCache = new Object();
        // var usercache = LRU(options);
        cacheHelper.resetCache();
        accessAllowedUsers();
        reply('Updated');
    }
});

server.route({
    method: 'GET',
    path: '/',
    handler: function(request, reply) {
        reply("Its working !!!!");
    }
});

server.route({
    method: 'POST',
    path: '/webhook/',
    handler: function(request, reply) {
        //sendTextMessage(request.payload.Body, request.payload.From);
        //processTextAndRespond(request.payload.Body, request.payload.From);
        var data = request.payload;

        // Make sure this is a page subscription
        if (data && data.object === 'page') {
            // Iterate over each entry - there may be multiple if batched
            data.entry.forEach(function(entry) {
                var pageID = entry.id;
                var timeOfEvent = entry.time;

                // Iterate over each messaging event
                entry.messaging.forEach(function(event) {
                    if (event.message) {
                        service.handleRequest(event.message.text, event.sender.id, null, constants.INPUT_FB);
                    } else {
                        console.log("Webhook received unknown event: ", event);
                    }
                });
            });

            reply().code(200);
        }
        else
            service.handleRequest(request.payload.Body, request.payload.From, null, constants.INPUT_SMS);
    }
});

server.route({
    method: 'POST',
    path: '/message/',
    handler: function(request, reply) {
       service.handleRequest(request.payload.Body, request.payload.From, request.payload.ChannelSid);
    }
});

server.start((err) => {
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
    //accessAllowedUsers();
    
    dbConnector.setupDB(function(val){
        if (!val) {
            //console.log('Database connection error');
        } else {
            //console.log('Database connection successful');
            accessAllowedUsers();
            //initalizeCalendar();
            //waitThread(true);
        }
    });
});

function waitThread(start_thread) {
    dbconn.query('SELECT * FROM workorder where status = 1 AND appointment_time < "' + moment().format('YYYY-MM-DD HH:mm:ss') + '"', function(err, records) {
        if (err) throw err;
        for (var i = 0; i < records.length; i++) {
            if (follow_up_arr[records[i].userid] == undefined) {
                follow_up_arr[records[i].userid] = records[i].id;
                sendTextMessage("Your workorder '" + records[i].task + "' was scheduled for " + records[i].appointment_time + ". Is it completed now? YES/NO", records[i].fb_token);
                clearContext(records[i].fb_token);
            }
        }
    });
    if (start_thread)
        setTimeout(waitThread, 86400000);
}
