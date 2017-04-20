'use strict';

// import the natural library
const natural = require('natural');

const request = require('superagent');

const Bot = require('./Bot');

const weatherURL = `http://api.openweathermap.org/data/2.5/weather?&units=metric&appid=${process.env.WEATHER_API_KEY}&q=`;

// initialize the stemmer
const stemmer = natural.PorterStemmer;

// attach the stemmer to the prototype of String, enabling
// us to use it as a native String function
stemmer.attach();

const bot = new Bot({
    token: process.env.SLACK_TOKEN,
    autoReconnect: true,
    autoMark: true
});

bot.respondTo('weather', (message, channel, user) => {

    let args = getArgs(message.text);

    let city = args.join(' ');

    getWeather(city, (error, fullName, description, temperature) => {
        if (error) {
            console.log("ERROR RRRRRR");
            bot.send(error.message, channel);
            return;
        }
        console.log("Logging --->", fullName, description, temperature);
        bot.send(`The weather for ${fullName} is ${description} with a temperature of ${Math.round(temperature)} celsius.`, channel);
    });
}, true);

function getWeather(location, callback) {
    console.log('location --> ', location);
    // make an AJAX GET call to the Open Weather Map API
    request.get(weatherURL + location)
        .end((err, res) => {
            if (err) throw err;

            let data = JSON.parse(res.text);

            if (data.cod === '404') {
                return callback(new Error('Sorry, I can\'t find that location!'));
            }

            console.log(data);

            let weather = [];
            data.weather.forEach((feature) => {
                weather.push(feature.description);
            });

            let description = weather.join(' and ');
            callback(null, data.name, description, data.main.temp);
        });
}

// Take the message text and return the arguments
function getArgs(msg) {
    return msg.split(' ').slice(1);
}