var Botkit = require('Botkit');
var os = require('os');

var controller = Botkit.slackbot({
    debug: false,
});

var bot = controller.spawn({
    token: process.env.SLACK_TOKEN
}).startRTM();

controller.hears('hello',['direct_message','direct_mention','mention'],function(bot,message) {
    bot.reply(message,'Hello there!');
});