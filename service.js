var fs = require('fs');
var twilio = require('./twilio.js');
var config = require('./config.json');
var util = require('./util.js');
var phone = require('phone');
var mail = require('./sendMail.js');
var cacheHelper = require('./cacheHelper.js');
var constants = require('./constants.js');
var dbConnector = require('./dbConnector.js');

module.exports = {
    handleRequest : function(inputText, senderId, channelId) {
        util.getState(senderId, function(state){
            if(state!=undefined && inputText == state.message){
                console.log("duplicate");
                return;
            }
            if (checkForGreetings(inputText) == true || state == undefined) {
                greetUser(senderId, channelId, inputText);
            }
            else if(state.step == constants.STATES_LASTORDER){
                if(inputText.toLowerCase().indexOf("last") != -1){
                    if(state.order.length > 0){
                        var str = "";
                        var order_arr = state.order;
                        for (i=0; i < order_arr.length; i++){
                            if(i == order_arr.length - 1){
                                if(order_arr[i].sides){
                                    str += "and " + order_arr[i].sides +".";
                                }
                                else
                                    str += "and " + order_arr[i].size + '" ' + order_arr[i].type + ' with ' + order_arr[i].toppings + '.';
                            }
                            else{
                                if(order_arr[i].sides){
                                    str += order_arr[i].sides;
                                }
                                else
                                    str += order_arr[i].size + '" ' + order_arr[i].type + ' with ' + order_arr[i].toppings;
                                if(order_arr.length > 1){
                                    str += ", "
                                }
                            }
                        }
                        str = "Great! You ordered the " + str + " Do you want that?";
                        sendTextMessage(str, senderId, channelId);
                        var state = {
                            "step": constants.STATES_CONFIRMLASTORDER,
                            "message": inputText
                        };
                        util.updateState(senderId, state, null);
                    }
                }
                else{
                    showPizzaText(state, senderId, channelId, inputText);
                }
            }
            else if(state.step == constants.STATES_CONFIRMLASTORDER){
                if(inputText.toLowerCase() === "yes"){
                    sendTextMessage(config.text.morePizza, senderId, channelId);
                    var orders = [];
                    if(state.order && state.order.length)
                        orders = state.order;

                    dbConnector.addOrder(senderId, orders, function(order_id){
                        var state = {
                            "step": constants.STATES_MOREPIZZA,
                            "message": inputText,
                            "order":orders,
                            "order_id":order_id
                        };
                        util.updateState(senderId, state, null);
                    });  
                }
                else if(inputText.toLowerCase() === "no"){
                    showPizzaText(state, senderId, channelId, inputText);
                }
                else {
                    sendTextMessage(config.text.fallbackText1, senderId, channelId);
                }
            }
            else if(state.step == constants.STATES_ASKPHONE ){
                if(inputText.toLowerCase() === "yes"){
                    sendTextMessage(config.text.askPhoneNumber, senderId, channelId);

                    var state = {
                        "step": constants.STATES_CONFIRMPHONE,
                        "message": inputText
                    };
                }
                else if(inputText.toLowerCase() === "no"){
                    sendTextMessage(config.text.finishText, senderId, channelId);
                    var state = {
                        "step": constants.STATES_ASKPHONE,
                        "message": "",
                        "order": "",
                        "order_id": "",
                        "amount": "",
                        "phone":""
                    };
                    //util.updateState(senderId, state, null);
                }
                else {
                    sendTextMessage(config.text.fallbackText1, senderId, channelId);
                }
                
                util.updateState(senderId, state, null);
            }
            else if(state.step == constants.STATES_CONFIRMPHONE ){
                var phoneObject = phone(inputText); //Only works for USA
                    if (phoneObject.length > 0) {
                        showPizzaText(state, senderId, channelId, inputText);
                    }
                    else{
                        sendTextMessage(config.text.wrongPhoneNumber, senderId, channelId);
                    }
            }
            else if(state.step == constants.STATES_PIZZATYPE){

                var size = cacheHelper.getValue("size", constants.PIZZA_CACHE);
                sendTextMessage(config.text.addPizzaText.size + " We have " + size.toString(), senderId, channelId);
                var orders = [];
                if(state.order && state.order.length)
                    orders = state.order;

                var order = {
                    type: inputText,
                    size: "",
                    toppings: ""
                }
                orders.push(order);
                var state = {
                    "step": constants.STATES_PIZZASIZE,
                    "message": inputText,
                    "order":orders
                };
                util.updateState(senderId, state, null);
            }
            else if(state.step == constants.STATES_PIZZASIZE){
                var toppings = cacheHelper.getValue("toppings", constants.PIZZA_CACHE);
                sendTextMessage(config.text.addPizzaText.toppings + " We have " + toppings.join(), senderId, channelId);
                var orders = [];
                if(state.order && state.order.length)
                    orders = state.order;

                orders[state.order.length -1]["size"] = inputText;
                var state = {
                    "step": constants.STATES_PIZZATOPPINGS,
                    "message": inputText,
                    "order":orders
                };
                util.updateState(senderId, state, null);
            } 
            else if(state.step == constants.STATES_PIZZATOPPINGS){
                sendTextMessage(config.text.morePizza, senderId, channelId);
                var orders = [];
                if(state.order && state.order.length)
                    orders = state.order;

                orders[state.order.length -1]["toppings"] = inputText;
                var state = {
                    "step": constants.STATES_MOREPIZZA,
                    "message": inputText,
                    "order":orders
                };
                util.updateState(senderId, state, null);
            }
            else if(state.step == constants.STATES_MOREPIZZA){
                if(inputText.toLowerCase() === "yes"){
                    var type = cacheHelper.getValue("type", constants.PIZZA_CACHE);
                        var str = "";
                        for(i = 0; i < type.length; i++){
                            if(i == type.length - 1)
                                str += "and " + type[i] + ".";
                            else
                                str += type[i] + ", ";
                        }
                    sendTextMessage(config.text.addPizzaText.type + " We have " + str, senderId, channelId);
                    //sendTextMessage(config.text.addPizzaText.type, senderId, channelId);
                        var state = {
                            "step": constants.STATES_PIZZATYPE,
                            "message": inputText
                        };
                }
                else if(inputText.toLowerCase() === "no"){
                    sendTextMessage(config.text.sides, senderId, channelId);
                        var state = {
                            "step": constants.STATES_ADDSIDES,
                            "message": inputText
                        };
                }
                else {
                    sendTextMessage(config.text.fallbackText1, senderId, channelId);
                }
                util.updateState(senderId, state, null);
            }
            else if(state.step == constants.STATES_ADDSIDES){
                var localstate = "";
                if(inputText.toLowerCase() === "yes"){
                    sendTextMessage("Added. " + config.text.orderReady, senderId, channelId);
                    var order = {"sides": "garlic bread"}
                    var orders = [];
                    if(state.order && state.order.length)
                        orders = state.order;
                    
                    orders.push(order);
                    localstate = {
                        "order":orders,
                        "step": constants.STATES_TEXTCLUB,
                        "message": inputText
                    };
                    //util.updateState(senderId, state, null);
                        
                }
                else if(inputText.toLowerCase() === "no"){
                    sendTextMessage(config.text.orderReady, senderId, channelId);
                    localstate = {
                            "step": constants.STATES_TEXTCLUB,
                            "message": inputText
                        };
                }
                else {
                    sendTextMessage(config.text.fallbackText1, senderId, channelId);
                }
                
                util.updateState(senderId, localstate, function(newState){
                    mail.sendMailToUser(newState);
                    dbConnector.updateOrder(newState, function(success){
                        if(success){
                            sendTextMessage(config.text.textClub, senderId, channelId);
                        }
                    });
                });                      
            }
            else if(state.step == constants.STATES_TEXTCLUB){
                sendTextMessage(config.text.finishText, senderId, channelId);
                
            }
            else {
                sendTextMessage(config.text.fallbackText1, senderId, channelId);
            }
        });
    }
};

var greet_arr = ["BONJOUR", "HOLA", "CIAO", "OLA", "HI", "HEY"];

function greetUser(senderId, channelId, inputText) {
    var user_info = cacheHelper.getValue(senderId, constants.USER_CACHE);

    if(user_info == undefined){
        sendTextMessage(config.text.welcomeText + config.text.welcomeText1, senderId, channelId);
        var state = {
                    "step": constants.STATES_ASKPHONE,
                    "message": inputText,
                    "order": "",
                    "order_id": "",
                    "amount": "",
                    "phone":""
                };
        util.updateState(senderId, state, null);
    }
    else{
        user_info = JSON.parse(user_info);

        dbConnector.getLastOrder(senderId, function(order_data){
            if(order_data){
                sendTextMessage("Hi "+ user_info[0] + ". " + config.text.welcomeText2 + config.text.welcomeText3, senderId, channelId);
                var state = {
                    "step": constants.STATES_LASTORDER,
                    "message": inputText,
                    "order": order_data,
                    "order_id": "",
                    "amount": "",
                    "phone":""
                };
                util.updateState(senderId, state, null);
            }
            else{
                sendTextMessage("Hi "+ user_info[0] + ". " + config.text.welcomeText2 + config.text.welcomeText1, senderId, channelId);
                var state = {
                    "step": constants.STATES_ASKPHONE,
                    "message": inputText,
                    "order": "",
                    "order_id": "",
                    "amount": "",
                    "phone":""
                };
                util.updateState(senderId, state, null);
            }
            dbConnector.addUser(senderId, user_info, function(val){

            });
        });
    }
}

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

function showPizzaText(state, senderId, channelId, inputText){
    var type = cacheHelper.getValue("type", constants.PIZZA_CACHE);
    var str = "";
    for(i = 0; i < type.length; i++){
        if(i == type.length - 1)
            str += "and " + type[i] + ".";
        else
            str += type[i] + ", ";
    }
    sendTextMessage(config.text.addPizzaText.type + " We have " + str, senderId, channelId);

    dbConnector.addOrder(senderId, null, function(order_id){
        var state = {
            "step": constants.STATES_PIZZATYPE,
            "message": inputText,
            "order_id":order_id,
            "order": ""
        };
        var phoneObject = phone(inputText); //Only works for USA
        if (phoneObject.length > 0) {
            state["phone"] = inputText;
        }
        util.updateState(senderId, state, null);
    });            
}

function sendTextMessage(sendText, senderId, channelId){
    twilio.sendIpMessage(sendText, channelId);

    //twilio.sendTextMessage(sendText, senderId);
}