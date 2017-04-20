'use strict';


const request = require('superagent');
const mongojs = require('mongojs');
const Bot = require('./Bot');
var db_legal_entity = mongojs('127.0.0.1:27017/legal_entity', ['legal_entity']);
const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;




const bot = new Bot({
    token: process.env.SLACK_TOKEN,
    autoReconnect: true,
    autoMark: true
});

bot.respondTo('get_gc', (message, channel, user) => {

    let args = getArgs(message.text);
    console.log("message -> " + message.text);
    console.log("GC  NAME  again -> " + args);

    search_gc(args, (err, resp) => {
        console.log("before calling bot.send mongo data" + resp[0])

        resp.forEach(function(legal_entity){
            bot.send(legal_entity, channel);
            bot.send("     ", channel);
        })

    });
}, true);



bot.respondTo('get_sub', (message, channel, user) => {
    console.log("message ---->" + message.text);
    let args = message.text.substring(8, message.length);
    console.log("search param = " + args);
    search_sub(args, (err, resp) => {

        let attachments = [];
        resp.forEach(function(legal_entity){

           let name = legal_entity.title;
           let item = legal_entity.item;
           let sub_url = legal_entity.url;

           var attachment = {
               "title": name,
               "title_url": legal_entity.url,
               "text": item,
               "color": "#3AA3E3",
               "footer": legal_entity.location
           }
           attachments.push(attachment);
        });

        send_msg(attachments);

    });
}, true);

bot.respondTo('get_list', (message, channel, user) => {
    console.log("message ---->" + message.text);
    let args = message.text.substring(8, message.length);
    console.log("search param = " + args);
    list_csid(args, (err, resp) => {

        resp.forEach(function(csid){
            bot.send(csid, channel);
            bot.send("     ", channel);
        })

    });
}, true);

function search_sub(parameter, callback){
    // "a04b1a5b-386c-4486-a41e-f4ba6db7bf98"

    console.log("parameter ------>" + parameter + "<---");
    db_legal_entity.legal_entity.find({display_name: parameter},function (err, docs) {

        if (err){
            console.log("error " + err);
        }

        var attachments = [];
        docs.forEach(function(d) {
            let office_locations = d.office_locations;
            let primary_location = office_locations.filter(function(office_location){
                return office_location.primary === true;
            });

            let city = "";
            let prov = "";
            if (primary_location.length > 0){
                console.log(primary_location[0]);
                city = primary_location[0].city;
                prov = primary_location[0].province_state
            }

            let prov_city = city + " " + prov;

            console.log("CITY ---> " + city);
            let total_contract_value = numberWithCommas(d.total_contract_value);

            var attachment= `
current : ${d.current}
CSID    : ${d.csid}
GST #   : ${d.gst_number}
 
legal_entity_id ------ ${d.legal_entity_id}
total contract_value - ${total_contract_value} 
total contracts ------ ${d.total_contracts}
size ----------------- ${d.size}
`;

            console.log(attachment);
            var return_obj = { "title": d.display_name,
                               "sub_url" : d.url,
                               "item": attachment,
                               "location": prov_city}
            attachments.push(return_obj);
        });
        console.log(attachments);
        callback(null, attachments);
    });
}


function search_gc(parameter, callback){
    db_legal_entity.legal_entity.find({type: "gc"},function (err, docs) {

        var attachments = [];
        docs.forEach(function(d) {
            var attachment=
                `display_name: ${d.display_name},
                type: ${d.type},
                legal_entity_id: ${d.legal_entity_id}
                `;
            attachments.push(attachment);
        });
        console.log(attachments);
        callback(null, attachments);
    });
}


function list_csid(parameter, callback){

    var options = {
        "limit": 20,
        "sort": "display_name"
    }


    db_legal_entity.legal_entity.find({current:true, "type":"sub"},
                                      {"csid":1, "display_name":1, "_id":0}
                                      ,function (err, docs) {

        var attachments = [];
        docs.forEach(function(d) {
            var attachment=
                `CSID: ${d.csid}
                name: ${d.display_name} 
                `;
            attachments.push(attachment);
        });
        console.log(attachments);
        callback(null, attachments);
    }, options);
}

function numberWithCommas(x) {
    return "$" + x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


// Take the message text and return the arguments
function getArgs(msg) {
    return msg.split(' ').slice(1);
}

function send_msg(msgs){


    request
        .post(WEBHOOK_URL)
        .send({
            username: "@marty",
            channel: "#general",
            icon_emoji: ":+1:",
            text: 'The sub info requested',
            attachments: msgs
        })
        .end((err, res) => {
            // console.log(res);
        });


}