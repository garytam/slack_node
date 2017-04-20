'use strict';

const redis = require('redis');
const Bot = require('./Bot');

// const client = redis.createClient();

let client = redis.createClient(6379, "localhost");

const bot = new Bot({
    token: process.env.SLACK_TOKEN,
    autoReconnect: true,
    autoMark: true
});

client.on('error', (err) => {
    console.log('Error ' + err);
});

client.on('connect', () => {
    console.log('Connected to Redis!');
});


client.set('hello', 'Hello World!', redis.print); // Reply: OK
client.get('hello', redis.print);                 // Reply: Hello World!

client.get('hello', (err, reply) => {
    if (err) {
        console.log(err);
        return;
    }

    console.log(`Retrieved: ${reply}`);
});


bot.respondTo('store', (message, channel, user) => {
    let args = getArgs(message.text);

    let key = args.shift();
    let value = args.join(' ');

    client.set(key, value, (err) => {
        if (err) {
            bot.send('Oops! I tried to store that but something went wrong :(', channel);
        } else {
            bot.send(`Okay ${user.name}, I will remember that for you.`, channel);
        }
    });
}, true);

bot.respondTo('retrieve', (message, channel, user) => {
    bot.setTypingIndicator(message.channel);

    let args = getArgs(message.text);
    let key = args.shift();

    client.get(key, (err, reply) => {
        if (err) {
            console.log(err);
            return;
        }

        bot.send('Here\'s what I remember: ' + reply,  channel);
    });
});


// Take the message text and return the arguments
function getArgs(msg) {
    return msg.split(' ').slice(1);
}