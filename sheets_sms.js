var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var cacheHelper = require('./cacheHelper.js');
var constants = require('./constants.js');

var SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';

console.log(TOKEN_PATH);

module.exports = function() {
    this.accessAllowedUsers = function(userscache,agentscache) {
        fs.readFile('client_secret.json', function processClientSecrets(err, content) {
            if (err) {
                console.log('Error loading client secret file: ' + err);
                return;
            }
            authorize(JSON.parse(content), listMajors, userscache,agentscache);
        });
    }
}

function authorize(credentials, callback, userscache,agentscache) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client, userscache,agentscache);
        }
    });
}

function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

function listMajors(auth, userscache,agentscache) {
    var sheets = google.sheets('v4');
    sheets.spreadsheets.values.get({
            auth: auth,
            spreadsheetId: '1Y4RsngXCj0G5jrRLo-HXPctcT2YILtOR5xEOBRK6J78',
            range: 'Users',
        },
        function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            var rows = response.values;
            if (rows.length == 0) {
                console.log('No data found.');
            } else {
                for (var i = 0; i < rows.length; i++) {
                    
                    cacheHelper.addKeyValue(rows[i][2], JSON.stringify(rows[i]), constants.USER_CACHE);

                    //userscache.set(rows[i][2], JSON.stringify(rows[i]));
                    console.log(JSON.stringify(rows[i]));
                }
            }
        });

    sheets.spreadsheets.values.get({
            auth: auth,
            spreadsheetId: '1Y4RsngXCj0G5jrRLo-HXPctcT2YILtOR5xEOBRK6J78',
            range: 'PizzaItem',
        },
        function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            var rows = response.values;
            if (rows.length == 0) {
                console.log('No data found.');
            } else {
                for (var i = 0; i < rows.length; i++) {
                    //cacheHelper.addKeyValue(rows[i][0], JSON.stringify(rows[i]), constants.PIZZA_CACHE);
                    if(i == 0)
                        cacheHelper.addKeyValue("type", rows[i],constants.PIZZA_CACHE);
                    else if(i == 1)
                        cacheHelper.addKeyValue("size", rows[i], constants.PIZZA_CACHE);
                    else   
                        cacheHelper.addKeyValue("toppings", rows[i], constants.PIZZA_CACHE);
                    //agentscache[JSON.parse(rows[i][1])]=rows[i][0];
                    console.log(rows[i]);
                }
            }
        });
}