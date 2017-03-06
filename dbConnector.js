var mysql = require('mysql');

// var dbconn = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'Monotype123#',
//     database: 'pizzabot'
// });

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
    saveState: function(sender, state, callback){
        
        var body = {
            "state": JSON.stringify(state),
            "timestamp": Math.floor(new Date() / 1000)
        };

        dbconn.query('UPDATE state SET ? where sender_id=?', body, sender, function(err, res) {
            //console.log(err, res);
            if (err)
                callback(false);
            else
                callback(true);
        });
    }

};