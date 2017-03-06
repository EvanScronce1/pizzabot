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
    port: 9090
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


function greetUser(senderID) {
    sendTextMessage(config.text.welcomeText, senderID);
}

Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

var greet_arr = ["BONJOUR", "HOLA", "CIAO", "OLA", "HI", "HEY"];

function checkForGreetings(inputText) {
    var tokens = inputText.split(" ");
    var returnVal = false;
    for (var i = 0; i < tokens.length; i++) {
        if (greet_arr.indexOf(tokens[i].toUpperCase()) != -1) {
            returnVal = true;
            break;
        }

    }
    return returnVal;
}

function createNewTaskAndUpdateSession(inputText, senderID) {
    var cache_entry = usercache.get(inputText);
    if (cache_entry != undefined) {
        cache_entry = JSON.parse(cache_entry);

        sendTextMessage("Great! It's nice to meet you, " + cache_entry[0] + ". Please tell me the problem you're having.", senderID);

        var record = {
            id: shortid.generate(),
            task: '',
            isUrgent: -1,
            userid: cache_entry[0] + "##" + cache_entry[1] + "##" + cache_entry[2],
            status: 0,
            creation_time: new Date(),
            appointment_time: null,
            fb_token: senderID
        };

        var user_record = {
            unique_id: senderID,
            user_id: cache_entry[0] + "##" + cache_entry[1] + "##" + cache_entry[2]
        };
        dbconn.query('INSERT IGNORE INTO user_table SET ?', user_record, function(err, res) {
            if (err)
                throw err;
        });

        dbconn.query('delete FROM workorder where status = 0 && isUrgent = -1 AND userid="' + cache_entry[0] + "##" + cache_entry[1] + "##" + cache_entry[2] + '"', function(err, res) {
            if (err)
                throw err;
            dbconn.query('INSERT INTO workorder SET ?', record, function(err, res) {
                if (err)
                    throw err;
            });
        });

        dbconn.query('UPDATE session_table SET phone_number = '+inputText+' where user_id = '+senderID, function(err, result) {
            if (err) throw err;
        });
    }
}

function handleNlpResponse(inputText, senderID) {
    if (checkForGreetings(inputText) == true) {
        greetUser(senderID);
    } 
    else {
          sendTextMessage("1111EWWWWWW. I will be honest but at last I am a mere bot. Try #fixmyhome", senderID);
    }

}

function clearContext(senderID) {
    dbconn.query('delete FROM session_table where user_id=' + senderID, function(err, res) {
        if (err)
            throw err;
    });
}


function processTextAndRespond(inputText, senderID) {
    handleNlpResponse(inputText, senderID);
}

function sendPlainTextMessages(phone_number, senderID) {
    //Create Session and Move forward
    var user_record = {
        user_id: senderID,
        startTime: moment(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss'),
        phone_number: phone_number
    };

    dbconn.query('INSERT INTO session_table SET ? ON DUPLICATE KEY UPDATE startTime = "' + user_record.startTime + '"', user_record, function(err, res) {
        if (err)
            throw err;
    });
}

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
    path: '/refresh_users/',
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
    path: '/close_tasks/',
    handler: function(request, reply) {
        waitThread(false);
    }
});

server.route({
    method: 'POST',
    path: '/webhook/',
    handler: function(request, reply) {
        //sendTextMessage(request.payload.Body, request.payload.From);
        //processTextAndRespond(request.payload.Body, request.payload.From);
        service.handleRequest(request.payload.Body, request.payload.From, null);
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
    accessAllowedUsers();
    /*
    dbConnector.setupDB(function(val){
        if (!val) {
            //console.log('Database connection error');
        } else {
            //console.log('Database connection successful');
            accessAllowedUsers();
            //initalizeCalendar();
            //waitThread(true);
        }
    });*/
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
