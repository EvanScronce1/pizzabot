﻿//-------- FB cache ------
const PIZZA_CACHE = 1;
const USERSTATE_CACHE = 2;
const USER_CACHE = 3;

const APPUSERID = 'app_user_id';
const TOKEN = 'token';
const UNIQUE_ID = 'uniqueId';
const FB_PAGE_ID = 'pageID';

//------- HTTP Status Code --------------
const HTTP_OK = 200;
const HTTP_TOKEN_INVALID = 498;
const HTTP_USER_NOT_FOUND = 404;

//-------   Bot User States --------------
const STATES_CONFIRMSTART = 1;
const STATES_ASKPHONE = 2.1;
const STATES_LASTORDER = 2.2
const STATES_CONFIRMLASTORDER = 2.3;
const STATES_CONFIRMPHONE = 3;
const STATES_PIZZATYPE = 4;
const STATES_PIZZASIZE = 5;
const STATES_PIZZATOPPINGS = 6;
const STATES_MOREPIZZA = 7;
const STATES_ADDSIDES = 8;
const STATES_TEXTCLUB = 9;

//------ Predictions ---------------
const CONTEXT_GREETINGS = "Greetings";

//------ Actions ---------------
const ACTION_ADDOPTION = "addOption";
const ACTION_GETSTARTED = "getStarted";
const ACTION_FINISHADDOPTION = "finish_add_option";
const ACTION_CONFIRMQUESTIONYES = "confirmYes";
const ACTION_CONFIRMQUESTIONNO = "confirmNo";


//-------- State ---------------
const STATE_MESSAGE = "message";
const STATE_STEP = "step";

exports.USERSTATE_CACHE = USERSTATE_CACHE;
exports.PIZZA_CACHE = PIZZA_CACHE;
exports.USER_CACHE = USER_CACHE;
exports.APPUSERID = APPUSERID;
exports.TOKEN = TOKEN;
exports.HTTP_OK = HTTP_OK;
exports.HTTP_TOKEN_INVALID = HTTP_TOKEN_INVALID;
exports.UNIQUE_ID = UNIQUE_ID;
exports.FB_PAGE_ID = FB_PAGE_ID;
exports.HTTP_USER_NOT_FOUND = HTTP_USER_NOT_FOUND;
exports.STATE_MESSAGE = STATE_MESSAGE;
exports.STATE_STEP = STATE_STEP;
exports.CONTEXT_GREETINGS = CONTEXT_GREETINGS;

/* States */
exports.STATES_CONFIRMSTART = STATES_CONFIRMSTART;
exports.STATES_ASKPHONE = STATES_ASKPHONE;
exports.STATES_CONFIRMPHONE = STATES_CONFIRMPHONE;
exports.STATES_PIZZATYPE = STATES_PIZZATYPE;
exports.STATES_PIZZASIZE = STATES_PIZZASIZE;
exports.STATES_PIZZATOPPINGS = STATES_PIZZATOPPINGS;
exports.STATES_MOREPIZZA = STATES_MOREPIZZA
exports.STATES_ADDSIDES = STATES_ADDSIDES
exports.STATES_TEXTCLUB = STATES_TEXTCLUB
exports.STATES_LASTORDER = STATES_LASTORDER
exports.STATES_CONFIRMLASTORDER = STATES_CONFIRMLASTORDER

/*Actions */
exports.ACTION_ADDOPTION = ACTION_ADDOPTION;
exports.ACTION_GETSTARTED = ACTION_GETSTARTED;
exports.ACTION_FINISHADDOPTION = ACTION_FINISHADDOPTION;
exports.ACTION_CONFIRMQUESTIONYES = ACTION_CONFIRMQUESTIONYES;
exports.ACTION_CONFIRMQUESTIONNO = ACTION_CONFIRMQUESTIONNO;