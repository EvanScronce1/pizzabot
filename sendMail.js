'use strict';
const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        type: 'OAuth2',
        user: "pizzabot4@gmail.com", 
        clientId: "1068367020394-5m44imdc27vrqbfjvg4dil7sir0m1jev.apps.googleusercontent.com",
        clientSecret: "yVZt-eEeFHDghUftZGpcspDP",
        refreshToken: "1/53tTX8uF1-IijPv3lYRrxMKD8uBTxBenXLkNuLpf2zk",
        accessToken:"ya29.GlsFBAfkeKEYrM4Da25t2A3eqtw3W-DG_RVmproyRyAM9ljf2BdczHu9gqx0cMNBxE9nNex_jZCRiG5g2VoNpNuD8r08axN1W5Gguj-zVnOOqFqKoFy3XVI6756F",
        expires: 1484314697598
    }
});

transporter.on('log', console.log);
transporter.on('token', token => {
    console.log('A new access token was generated');
    console.log('User: %s', token.user);
    console.log('Access Token: %s', token.accessToken);
    console.log('Expires: %s', new Date(token.expires));
});


// setup email data with unicode symbols
// let mailOptions = {
//     from: 'pizzabot4@gmail.com', // sender address
//     to: 'pizzabot4@gmail.com', // list of receivers
//     subject: 'Hello ✔', // Subject line
//     text: 'Hello world ?', // plain text body
//     html: '<b>Hello world ?</b>' // html body
// };
var mailOptions = {
  from: "pizzabot4@gmail.com",
  to: "pizzabot4@gmail.com",
  subject: "",
  generateTextFromHTML: true,
  html: ""
};

function createMailBody(state)
{
    //console.log(state, state.phone);
    mailOptions.subject = "New order from " + state.phone;
    mailOptions.html = "<b>Pizza Type</b>&nbsp;&nbsp;<b>Pizza Size</b>&nbsp;&nbsp;<b>Toppings</b>&nbsp;&nbsp;<br/>"
    state.order.forEach(function (order){
        var str = "";

        if(order.sides)
            mailOptions.html += order.sides + "<br/>";
        else{
            str = order.type + "&nbsp;&nbsp;" + order.size + "&nbsp;&nbsp;" + order.toppings+ "<br/>";
            mailOptions.html += str;  
        } 
    });
}
module.exports = {
    sendMailToUser: function (state) {

        createMailBody(state);
        transporter.sendMail(mailOptions, function(error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log(response);
        }
        transporter.close();
    });
}
}