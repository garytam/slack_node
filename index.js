'use strict';

let Bot = require('./Bot');

const bot = new Bot({
    token: process.env.SLACK_TOKEN,
    autoReconnect: true,
    autoMark: true
});

bot.respondTo('hello', (message, channel, user) => {
    bot.send(`Hello to you too, ${user.name}!`, channel)
}, true);

bot.respondTo('roll', (message, channel, user) => {

    // *****  ensure channel has at least one member other than BOT *** //
    const members = bot.getMembersByChannel(channel);
    if (! members ) {
        bot.send("no member in channel, go AWAY");
        return;
    }

    // ******************************************* //
    //   get the arguments from the message body   //
    // ******************************************* //
    console.log("message -> ", message);
    let args = getArgs(message.text);

    // ensure there is an opponent
    if (args.length < 1){
        bot.send('You have to provide the name of the opponent', channel);
        return;
    }
    console.log("********* members ************");
    console.log(members);
    console.log(args[0]);

    // ***************************** //
    //   if opponent is valid member //
    // ***************************** //
    if (members.indexOf(args[0]) < 0){
        bot.send(` Sorry ${user.name}, cannot find ${args[0]} from the list of active member`, channel);
        return;
    }



    // Roll two random numbers between 0 and 100
    let firstRoll = Math.round(Math.random() * 100);
    let secondRoll = Math.round(Math.random() * 100);

    let challenger = user.name;
    let opponent = args[0];

    // reroll in the unlikely event that it's a tie
    while (firstRoll === secondRoll) {
        secondRoll = Math.round(Math.random() * 100);
    }

    let winner = firstRoll > secondRoll ? challenger : opponent;

    // Using new line characters (\n) to format our response
    bot.send(
        `${challenger} fancies their chances against ${opponent}!\n
         ${challenger} rolls: ${firstRoll}\n
         ${opponent} rolls: ${secondRoll}\n\n
         *${winner} is the winner!*`
        , channel);

}, true);

// Take the message text and return the arguments
function getArgs(msg) {
    return msg.split(' ').slice(1);
}