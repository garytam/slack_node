'use strict';

let weather = require('weather-js');



weather.find({search: 'Toronto, Canada', degreeType: 'C'}, function(err, result) {
    if(err) console.log(err);

    let cities = result.filter(function (res) {
        return res.location.name === 'Toronto, Canada';
    })

    let city =  null;
    if (cities.length > 0){
        city = cities[0];
    }

    if (city){
        console.log(JSON.stringify(city.location, null, 4));
        let temperature = city.current.temperature;
        let feels_like = city.current.feelslike;
        console.log("TEMPERATURE ===> ", temperature, " feels like ", feels_like);

    }

    // console.log(JSON.stringify(result, null, 2));
});


const Bot = require('./Bot');
const request = require('superagent');

const wikiAPI = "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles="
const wikiURL = 'https://en.wikipedia.org/wiki/';

const bot = new Bot({  token: process.env.SLACK_TOKEN,
    autoReconnect: true,
    autoMark: true
});



function garyGetWeather(city, callback){
    console.log("In getWeather **** ", city);

    weather.find({search: city, degreeType: 'C'}, callback);
}

bot.respondTo('weather', (message, channel, user) => {

    if (user && user.is_bot) {
        return;
    }

    // grab the search parameters, but remove the command 'wiki' from the beginning
    // of the message first
    let args = message.text.split(' ').slice(1).join(' ');

    // if there are no arguments, return
    if (args.length < 1) {
        bot.send('I\'m sorry, but you need to provide a city!', channel);
        return;
    }

    console.log(args);

    garyGetWeather(args, (err, result) =>{
        if(err) console.log(err);

        let cities = result.filter(function (res) {
            return res.location.name === args +', Canada';
        })

        let city =  null;
        if (cities.length > 0){
            city = cities[0];
        }

        if (city){
            console.log(JSON.stringify(city.location, null, 4));
            let temperature = city.current.temperature;
            let feels_like = city.current.feelslike;
            bot.send(city.location.name + ":  current temperature " + temperature + "c,  feels like " + feels_like, channel);

            city.forecast.forEach(function(eachDay){
                bot.send(eachDay.day + " " + eachDay.high + " low " + eachDay.low, channel);
            });
        }
    })

}, true);


