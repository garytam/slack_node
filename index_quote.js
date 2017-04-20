var Bot = require('slackbots');

var settings = {
    token: process.env.SLACK_TOKEN,
    name: 'quotebot'
};

var bot = new Bot(settings);

bot.on('start', function() {
    bot.postMessageToChannel('general', 'Hi channel.');
    bot.postMessageToUser('gutterballgt', 'Hi user.');
    // bot.postMessageToGroup('a-private-group', 'Hi private group.');
});