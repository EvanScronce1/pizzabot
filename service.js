var fs = require('fs');
var twilio = require('./twilio.js');
var config = require('./config.json');
var util = require('./util.js');
var phone = require('phone');
var mail = require('./sendMail.js');
var cacheHelper = require('./cacheHelper.js');
var constants = require('./constants.js');

module.exports = {
    handleRequest : function(inputText, senderId, channelId) {
        var state = util.getState(senderId, null);
        if(state!=undefined && inputText == state.message)
            return;
        console.log(inputText);
        //console.log(state);
        if (checkForGreetings(inputText) == true || state == undefined) {
            greetUser(senderId, channelId);

            var state = {
                "step": constants.STATES_ASKPHONE,
                "message": inputText,
                "order": "",
                "order_id": "",
                "amount": "",
                "phone":""
            };
            util.updateState(senderId, state, null);
            var state = util.getState(senderId, null);
        }
        else if(state.step == constants.STATES_ASKPHONE ){
            if(inputText.toLowerCase() === "yes"){
                sendTextMessage(config.text.askPhoneNumber, senderId, channelId);

                var state = {
                    "step": constants.STATES_CONFIRMPHONE,
                    "message": inputText
                };
            }
            else{
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
            util.updateState(senderId, state, null);
        }
        else if(state.step == constants.STATES_CONFIRMPHONE ){
            var phoneObject = phone(inputText); //Only works for USA
                if (phoneObject.length > 0) {
                    var type = cacheHelper.getValue("type", constants.PIZZA_CACHE);
                    console.log(type, typeof(type));
                    var str = "";
                    for(i = 0; i < type.length; i++){
                        if(i == type.length - 1)
                            str += "and " + type[i] + ".";
                        else
                            str += type[i] + ", ";
                    }
                    sendTextMessage(config.text.addPizzaText.type + " We have " + str, senderId, channelId);
                    var state = {
                        "step": constants.STATES_PIZZATYPE,
                        "message": inputText,
                        "phone":inputText
                    };
                    util.updateState(senderId, state, null);
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
                    console.log(type, typeof(type));
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
            else{
                sendTextMessage(config.text.sides, senderId, channelId);
                    var state = {
                        "step": constants.STATES_ADDSIDES,
                        "message": inputText
                    };
            }
            util.updateState(senderId, state, null);
        }
        else if(state.step == constants.STATES_ADDSIDES){
            if(inputText.toLowerCase() === "yes"){
                sendTextMessage("Added. " + config.text.orderReady, senderId, channelId);
                var order = {"sides": "garlic bread"}
                var orders = [];
                if(state.order && state.order.length)
                    orders = state.order;
                
                orders.push(order);
                var state = {
                    "order":orders
                };
                util.updateState(senderId, state, null);
                    
            }
            else{
                sendTextMessage(config.text.orderReady, senderId, channelId);
            }

            var state = {
                        "step": constants.STATES_TEXTCLUB,
                        "message": inputText
                    };
            util.updateState(senderId, state, null);

            mail.sendMailToUser(util.getState(senderId));
            sendTextMessage(config.text.textClub, senderId, channelId);        
        }
        else if(state.step == constants.STATES_TEXTCLUB){
            sendTextMessage(config.text.finishText, senderId, channelId);
            
        }
        console.log(util.getState(senderId));
    }
};

var greet_arr = ["BONJOUR", "HOLA", "CIAO", "OLA", "HI", "HEY"];

function greetUser(senderId, channelId) {
    sendTextMessage(config.text.welcomeText, senderId, channelId);
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

function sendTextMessage(sendText, senderId, channelId){
    twilio.sendIpMessage(sendText, channelId);

    //twilio.sendTextMessage(sendText, senderId);
}