'use strict';


const request = require('superagent');
const mongojs = require('mongojs');
const commands = ['csid', 'gst']
const Bot = require('./Bot');
var db_legal_entity = mongojs('127.0.0.1:27017/legal_entity', ['legal_entity']);
var db_trades = mongojs('127.0.0.1:27017/trades', ['trades']);
var db_score = mongojs('127.0.0.1:27017/score', ['score']);
const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const async = require("async");

const bot = new Bot({
    token: process.env.SLACK_TOKEN,
    autoReconnect: true,
    autoMark: true
});

bot.respondTo('get_all_gc', (message, channel, user) => {

    let args = getArgs(message.text);
    search_gc(args, (err, resp) => {
        console.log("before calling bot.send mongo data" + resp[0])

        resp.forEach(function(legal_entity){
            bot.send(legal_entity, channel);
            bot.send("     ", channel);
        })

    });
}, true);

bot.respondTo('get_sub', (message, channel, user) => {
    let args = message.text.split(' ');
    if (args.length != 3){
        bot.send("invalid argument list", channel);
    };

    let command = args[1].toLowerCase();
    let value = args[2];

    if (commands.indexOf(command) == -1) {
        bot.send("Invalid command " + command, channel);
    }

    search_legal_entity(command, value, (err, resp) =>{
        if (err){
            bot.send("error " + err, channel);
        }
        send_msg(resp);
    });
}, true);

function search_legal_entity(command, parameter, callback){

    try {
        async.waterfall([
                function (callback) {
                    if (command === 'csid') {
                        db_legal_entity.legal_entity.findOne({csid: parameter, current: true}, function (err, result) {
                            callback(null, result);
                        });
                    } else if (command === 'gst') {
                        db_legal_entity.legal_entity.findOne({
                            gst_number: parameter,
                            current: true
                        }, function (err, result) {
                            callback(null, result);
                        });
                    }

                },
                function (legal_entity, callback) {
                    let _trade_id = legal_entity.trades.primary;
                    db_trades.trades.findOne({trade_id: _trade_id, current: true}, function (err, trade) {
                        if (err) {
                            console.log("fail to retrieve trade.  Error => ", err);
                        }
                        callback(err, legal_entity, trade);
                    });
                },
                function(legal_entity, trade, callback){
                    let _legal_entity_id = legal_entity.legal_entity_id;
                    db_score.score.findOne({legal_entity_id: _legal_entity_id, current: true}, function(err, score){
                        if (err) {
                            console.log("fail to retrieve trade.  Error => ", err);
                        }
                        callback(err, legal_entity, trade, score);
                    })
                }
            ],
            function (err, legal_entity, trade, score) {
                if (err) {
                    callback(err);
                }

                let slack_response = process_legal_entity(err, legal_entity, trade, score);
                callback(null, slack_response);
            });
    }   catch(err){
        callback(err);
    }


}


// ************************************ //
//    Process a single legal entity     //
// ************************************ //
function process_legal_entity(err, legal_entity, trade, score){
    if (err){
        console.log("error " + err);
    }

    console.log(trade);
    let office_locations = legal_entity.office_locations;
    let primary_location = office_locations.filter(function(office_location){
        return office_location.primary === true;
    });

    let city = "";
    let prov = "";
    if (primary_location.length > 0){
        city = primary_location[0].city;
        prov = primary_location[0].province_state
    }

    let prov_city = city + " " + prov;

    let total_contract_value = numberWithCommas(legal_entity.total_contract_value);

//     var attachment= `
// Q Score    : ${score.q_score}
// trade rank : ${score.trade_rank}
// current    : ${legal_entity.current}
// CSID       : ${legal_entity.csid}
// GST #      : ${legal_entity.gst_number}
// TRADE      : ${trade.trade_type}

// var attachment= `
// legal_entity_id ------ ${legal_entity.legal_entity_id}
// total contract_value - ${total_contract_value}
// total contracts ------ ${legal_entity.total_contracts}
// size ----------------- ${legal_entity.size}
// `;

    var fields = [];
    let q_score = {
        "title": "Q Score",
        "value": score.q_score,
        "short": true
    }

    let trade_rank = {
        "title": "Trade Rank",
        "value": score.trade_rank,
        "short": true
    }

    let current = {
        "title": "Current",
        "value": legal_entity.current,
        "short": true
    }

    let csid = {
        "title": "CSID",
        "value": legal_entity.csid,
        "short": true
    }

    let gst = {
        "title": "GST number",
        "value": legal_entity.gst_number,
        "short": true
    }

    let trade_field = {
        "title": "Trade",
        "value": trade.trade_type,
        "short": false
    }

    let total_contract_field = {
        "title": "Total Contract",
        "value": legal_entity.total_contracts,
        "short": true
    }

    let size_field = {
        "title": "Company Size",
        "value": legal_entity.size,
        "short": true
    }

    let legal_entity_id_field = {
        "title": "Legal Entity ID",
        "value": legal_entity.legal_entity_id,
        "short": false
    }

    let total_contract_value_field = {
        "title": "Total Contract Value",
        "value": total_contract_value,
        "short": true
    }

    fields.push(legal_entity_id_field);
    fields.push(q_score);
    fields.push(trade_rank);
    fields.push(current);
    fields.push(csid);
    fields.push(gst);
    fields.push(size_field);
    fields.push(total_contract_field);
    fields.push(total_contract_value_field);

    fields.push(trade_field);

    // var return_obj = { "title": d.display_name,
    //     "sub_url" : d.url,
    //     "item": attachment,
    //     "location": prov_city}
    //
    // attachments.push(return_obj);


    let name = legal_entity.display_name;
    let sub_url = legal_entity.url;

    var slack_result = [];

    var slack_object = {
        "title": name,
        "title_url": sub_url,
        // "text": attachment,
        "color": "#3AA3E3",
        "footer": prov_city,
        "fields": fields
    }

    slack_result.push(slack_object)
    return slack_result;
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