var mysql = require('mysql');
var shortid = require('shortid');

var dbconn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Monotype123#',
    database: 'pizzabot'
});

module.exports = {

    setupDB: function(callback){
        dbconn.connect(function(err) {
            if (err) {
                console.log('Database connection error');
                callback(false)
            } else {
                console.log('Database connection successful');
                callback(true);
            }
        });
    },
    getState: function (sender, callback) {
        dbconn.query('SELECT state FROM state where sender_id = "' + sender + '"', function(err, res) {
            if (err){
                console.log("error in getState");
                callback(false);
            }        
            else {
                if(res[0])
                    callback(JSON.parse(res[0].state));
                else
                    callback(res[0]);
            } 
        });
    },
    saveState: function(sender, state, callback){
        
        var timestamp = Math.floor(new Date() / 1000);
        var body = {
            sender_id:sender,
            state: JSON.stringify(state),
            timestamp: timestamp
        };
        //console.log(body);

        //dbconn.query('INSERT INTO state SET ? ON DUPLICATE KEY UPDATE timestamp =' + timestamp , body, function(err, res) {
        dbconn.query('REPLACE INTO state SET ?' , body, function(err, res) {
            if (err){
                console.log("error in saveState");
                callback(false);
            }        
            else {
                callback(true);
            }  
        });
    },
    addUser: function (sender, user_info, callback){
        
        var user_record = {
            sender_id: sender,
            user_info: user_info[0] + "##" + user_info[1] + "##" + user_info[2]
        };
        dbconn.query('INSERT IGNORE INTO user SET ?', user_record, function(err, res) {
            if(err){
                callback(false);
            }
            else{
                callback(true);
            }
        });
    },
    addOrder: function(sender, order_info, callback){
        var timestamp = Math.floor(new Date() / 1000);
        var order_id = shortid.generate();
        var body = {
            order_id: order_id,
            sender_id: sender,
            order_start: timestamp,
            order_completed: -1,
            order_data : JSON.stringify(order_info)
        }
        dbconn.query('INSERT IGNORE INTO order_info SET ?', body, function(err, res){
            if(err){
                callback(null);
            }
            else{
                callback(order_id);
            }
        });
    },
    updateOrder: function(state, callback){
        var timestamp = Math.floor(new Date() / 1000);
        var query = "UPDATE order_info SET order_data = '" + JSON.stringify(state.order) + "', order_completed =" + timestamp + ' WHERE order_id = "' + state.order_id+ '"';
        console.log(query);
        dbconn.query(query, function(err, res) {
            if(err){
                console.log("error in updateOrder");
                callback(false);
            }
            else{
                callback(true);
            }
        });
    },
    getLastOrder:function(sender, callback){
        dbconn.query("SELECT * from order_info where sender_id = ? AND order_completed != -1 ORDER BY order_completed DESC", sender, function(err, res){
            if(err){
                console.log("error in getLastOrder");
                callback(null);
            }
            else{
                if(res[0]){
                    callback(JSON.parse(res[0].order_data));
                }
                else
                    callback(res[0]);
            }
        });
    }

};