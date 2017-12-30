var fs = require('fs');
var twilio = require('./twilio.js');
var config = require('./config.json');
var util = require('./util.js');
var phone = require('phone');
var mail = require('./sendMail.js');
var cacheHelper = require('./cacheHelper.js');
var constants = require('./constants.js');
var dbConnector = require('./dbConnector.js');
var fb = require('./facebook.js');

module.exports = {
    handleRequest : function(inputText, senderId, channelId, inputType) {
        util.getState(senderId, function(state){
            /*if(state!=undefined && inputText == state.message){
                console.log("duplicate");
                return;
            }*/

            if(state == undefined && checkForAgent(senderId, inputText)){
                processAgentInput(senderId, channelId, inputText, inputType);
            }
            else if (checkForGreetings(inputText) == true || state == undefined) {
                greetUser(senderId, channelId, inputText, inputType, state);
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
                        sendTextMessage(str, senderId, channelId, inputType);
                        var state = {
                            "step": constants.STATES_CONFIRMLASTORDER,
                            "message": inputText
                        };
                        util.updateState(senderId, state, null);
                    }
                }
                else{
                    showPizzaText(state, senderId, channelId, inputText, inputType);
                }
            }
            else if(state.step == constants.STATES_CONFIRMLASTORDER){
                if(inputText.toLowerCase() === "yes"){
                    sendTextMessage(config.text.morePizza, senderId, channelId, inputType);
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
                    showPizzaText(state, senderId, channelId, inputText, inputType);
                }
                else {
                    sendTextMessage(config.text.fallbackText1, senderId, channelId, inputType);
                }
            }
            else if(state.step == constants.STATES_ASKPHONE ){
                if(inputText.toLowerCase() === "yes"){
                    sendTextMessage(config.text.askPhoneNumber, senderId, channelId, inputType);

                    var state = {
                        "step": constants.STATES_CONFIRMPHONE,
                        "message": inputText
                    };
                }
                else if(inputText.toLowerCase() === "no"){
                    sendTextMessage(config.text.finishText, senderId, channelId, inputType);
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
                    sendTextMessage(config.text.fallbackText1, senderId, channelId, inputType);
                }
                
                util.updateState(senderId, state, null);
            }
            else if(state.step == constants.STATES_CONFIRMPHONE ){
                var phoneObject = phone(inputText); //Only works for USA
                    if (phoneObject.length > 0) {
                        showPizzaText(state, senderId, channelId, inputText, inputType);
                    }
                    else{
                        sendTextMessage(config.text.wrongPhoneNumber, senderId, channelId, inputType);
                    }
            }
            else if(state.step == constants.STATES_PIZZATYPE){

                var size = cacheHelper.getValue("size", constants.PIZZA_CACHE);
                var str = "";
                for(i = 0; i < size.length; i++){
                    if(i == size.length - 1)
                        str += "and " + size[i] + ".";
                    else
                        str += size[i] + ", ";
                }
                //sendTextMessage(config.text.addPizzaText.size + " We have " + str, senderId, channelId, inputType);
                sendTextMessage(config.text.addPizzaText.size, senderId, channelId, inputType);
                
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
                //sendTextMessage(config.text.addPizzaText.toppings + " We have " + toppings.join(), senderId, channelId, inputType);
                sendTextMessage(config.text.addPizzaText.toppings , senderId, channelId, inputType);
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
                sendTextMessage(config.text.morePizza, senderId, channelId, inputType);
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
                    //sendTextMessage(config.text.addPizzaText.type + " We have " + str, senderId, channelId, inputType);
                    sendTextMessage(config.text.addPizzaText.type, senderId, channelId, inputType);
                        var state = {
                            "step": constants.STATES_PIZZATYPE,
                            "message": inputText
                        };
                }
                else if(inputText.toLowerCase() === "no"){
                    sendTextMessage(config.text.sides, senderId, channelId, inputType);
                        var state = {
                            "step": constants.STATES_ADDSIDES,
                            "message": inputText
                        };
                }
                else {
                    sendTextMessage(config.text.fallbackText1, senderId, channelId, inputType);
                }
                util.updateState(senderId, state, null);
            }
            else if(state.step == constants.STATES_ADDSIDES){
                var localstate = "";
                if(inputText.toLowerCase() === "yes"){
                    sendTextMessage("Added. " + config.text.confirmOrder, senderId, channelId, inputType);
                    var order = {"sides": "garlic bread"}
                    var orders = [];
                    if(state.order && state.order.length)
                        orders = state.order;
                    
                    orders.push(order);
                    localstate = {
                        "order":orders,
                        "step": constants.STATES_AGENTCONFIRMORDER,
                        "message": inputText
                    };
                    //util.updateState(senderId, state, null);
                }
                else if(inputText.toLowerCase() === "no"){
                    sendTextMessage(config.text.confirmOrder, senderId, channelId, inputType);
                    localstate = {
                            "step": constants.STATES_AGENTCONFIRMORDER,
                            "message": inputText
                        };
                }
                else {
                    sendTextMessage(config.text.fallbackText1, senderId, channelId, inputType);
                }
                
                if(localstate != ""){
                    util.updateState(senderId, localstate, function(newState){
                        sendTextToAgents(newState, channelId, inputType);
                    // mail.sendMailToUser(newState);
                    // dbConnector.updateOrder(newState, function(success){
                    //     if(success){
                    //         sendTextMessage(config.text.textClub, senderId, channelId, inputType);
                    //     }
                    // });
                }); 
                }                     
            }
            else if(state.step == constants.STATES_TEXTCLUB){
                sendTextMessage(config.text.finishText, senderId, channelId, inputType);

                var state = {
                    "step": constants.STATES_CONFIRMSTART,
                    "message": inputText,
                    "order": "",
                    "order_id": "",
                    "amount": "",
                };
                util.updateState(senderId, state, null);
                
            }
            else {
                sendTextMessage(config.text.fallbackText1, senderId, channelId, inputType);
            }
        });
    },
};

var greet_arr = ["BONJOUR", "HOLA", "CIAO", "OLA", "HI", "HEY", "START", "START OVER"];

function greetUser(senderId, channelId, inputText, inputType, lastState) {
    var user_info = cacheHelper.getValue(senderId, constants.USER_CACHE);

    if(user_info == undefined){

        dbConnector.getLastOrder(senderId, function(order_data){
            if(order_data){
                dbConnector.getUser(senderId, function (user){
                    if(user){
                        sendTextMessage("Hi " + user.name + ". " + config.text.welcomeText2 + config.text.welcomeText3, senderId, channelId, inputType);
                    }
                    else
                        sendTextMessage(config.text.welcomeText2 + config.text.welcomeText3, senderId, channelId, inputType);
                    var state = {
                        "step": constants.STATES_LASTORDER,
                        "message": inputText,
                        "order": order_data,
                        "order_id": "",
                        "amount": "",
                        "phone": (user && user.phone)? user.phone:((lastState && lastState.phone)? lastState.phone: senderId)
                    };
                    util.updateState(senderId, state, null);
                });
            }
            else{
                if(inputType == constants.INPUT_FB){
                    fb.getFacebookUser(senderId, function(user){
                        sendTextMessage("Hi "+ user.first_name + ". " + config.text.welcomeText2 + config.text.welcomeText1, senderId, channelId, inputType);
                        var state = {
                            "step": constants.STATES_ASKPHONE,
                            "message": inputText,
                            "order": "",
                            "order_id": "",
                            "amount": "",
                            "phone":""
                        };
                        util.updateState(senderId, state, null);

                        var user_info_detail = {
                                name: user.first_name + " " + user.last_name,
                                email: "",
                                phone: "",
                                address: ""
                        }
                        dbConnector.addUser(senderId, user_info_detail, function(val){

                        });
                    });
                }
                else{
                    sendTextMessage(config.text.welcomeText + config.text.welcomeText1, senderId, channelId, inputType);
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
            }
        });
    }
    else{
        user_info = JSON.parse(user_info);

        dbConnector.getLastOrder(senderId, function(order_data){
            if(order_data){
                sendTextMessage("Hi "+ user_info[0] + ". " + config.text.welcomeText2 + config.text.welcomeText3, senderId, channelId, inputType);
                var state = {
                    "step": constants.STATES_LASTORDER,
                    "message": inputText,
                    "order": order_data,
                    "order_id": "",
                    "amount": "",
                    "phone":user_info[2]
                };
                util.updateState(senderId, state, null);
            }
            else{
                sendTextMessage("Hi "+ user_info[0] + ". " + config.text.welcomeText2 + config.text.welcomeText1, senderId, channelId, inputType);
                var state = {
                    "step": constants.STATES_ASKPHONE,
                    "message": inputText,
                    "order": "",
                    "order_id": "",
                    "amount": "",
                    "phone":user_info[2]
                };
                util.updateState(senderId, state, null);
            }
            var user_info_detail = {
                name: user_info[0],
                email: user_info[1],
                phone: user_info[2],
                address: user_info[3]
            }
            dbConnector.addUser(senderId, user_info_detail, function(val){

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

function showPizzaText(state, senderId, channelId, inputText, inputType){
    var type = cacheHelper.getValue("type", constants.PIZZA_CACHE);
    var str = "";
    for(i = 0; i < type.length; i++){
        if(i == type.length - 1)
            str += "and " + type[i] + ".";
        else
            str += type[i] + ", ";
    }
    //sendTextMessage(config.text.addPizzaText.type + " We have " + str, senderId, channelId, inputType);
    sendTextMessage(config.text.addPizzaText.type, senderId, channelId, inputType);

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

            var user_info_detail = {
                phone: inputText,
            }
            dbConnector.updateUser(senderId, user_info_detail, null);
        }
        util.updateState(senderId, state, null);
    });            
}

function sendTextToAgents(state, channelId, inputType) {
    var allKeys = cacheHelper.getAllKeys(constants.AGENTS_SMS_CACHE);
    allKeys.forEach(function(agentId) {
        var value = JSON.parse(cacheHelper.getValue(agentId, constants.AGENTS_SMS_CACHE));
        console.log(value, value[0]);
        var text = "Hey " + value[0] + ". We have received an order. Please respond with 'YES " + state.order_id + "' or NO. ";
        sendTextMessage(text, agentId, null, constants.INPUT_SMS);
    }, this);
}

function checkForAgent (agentId, inputText){
     var agentInfo =  JSON.parse(cacheHelper.getValue(agentId, constants.AGENTS_SMS_CACHE));
     if(agentInfo != undefined && ((inputText.toLowerCase().indexOf("yes") != -1) || (inputText.toLowerCase().indexOf("no") != -1))){
         return true;
     } else {
         return false;
     }
}

function processAgentInput(agentId, channelId, inputText, inputType){
    var agentInfo =  cacheHelper.getValue(agentId, constants.AGENTS_SMS_CACHE);
    if(agentInfo != undefined && ((inputText.toLowerCase().indexOf("yes") != -1) || (inputText.toLowerCase().indexOf("no") != -1))){
        var inputArray = inputText.split(" ");
        dbConnector.getDetailsFromOrderId(inputArray[1], function(state, senderId){
            console.log(state,senderId)
            if(state == undefined && senderId){
                sendTextMessage(config.text.fallbackText3, senderId, channelId, inputType);
            } else if (state == undefined && senderId == undefined) {
                dbConnector.checkIfOrderIsCompleted(inputArray[1], function(state, senderId){
                    if(state && senderId){
                        sendTextMessage(config.text.agentFallbackText1, agentId, channelId, inputType);
                    }
                    else {
                        sendTextMessage(config.text.agentFallbackText, agentId, channelId, inputType);
                    }
                });
            } else if (state.step == constants.STATES_AGENTCONFIRMORDER){
                var localstate = "";
                if(inputArray[0].toLowerCase() === "yes"){
                    localstate = {
                        "step": constants.STATES_TEXTCLUB,
                        "agent":agentInfo,
                        "message": inputText
                    };
                    util.updateState(senderId, localstate, function(newState){
                        mail.sendMailToUser(newState);
                        dbConnector.updateOrder(newState, function(success){
                            if(success){
                                sendTextMessage(config.text.orderReady, senderId, channelId, inputType);
                                sendTextMessage(config.text.textClub, senderId, channelId, inputType);
                            }
                        });
                    });
                } else if(inputArray[0].toLowerCase() === "no"){
                    localstate = {
                        "step": constants.STATES_CONFIRMSTART,
                        "message": inputText
                    };
                    util.updateState(senderId, localstate, function(newState){
                        sendTextMessage(config.text.fallbackText3, senderId, channelId, inputType);
                    });
                }
            }
        });
    } else {
        return;
    }
}

function sendTextMessage(sendText, senderId, channelId, inputType){
    
    if(inputType == constants.INPUT_FB)
        fb.sendTextMessage(sendText, senderId);
    else{
        if(channelId) {
            twilio.sendIpMessage(sendText, channelId);
        } else {
            twilio.sendTextMessage(sendText, senderId);
        }       
    }
}
