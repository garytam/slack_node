var Botkit = require('Botkit');
var os = require('os');
var mongojs = require("mongojs");
var db_legal_entity = mongojs('127.0.0.1:27017/legal_entity', ['legal_entity']);
var db = mongojs('127.0.0.1:27017/BotDB',['ReferenceDocuments']);


var controller = Botkit.slackbot({
    debug: false,
});

var bot = controller.spawn({
    token: process.env.SLACK_TOKEN
}).startRTM();

controller.hears(['get_gc'],
    ['direct_message','direct_mention','mention'],function(bot,message) {
        bot.startConversation(message, askForKeywords);
    });


askForKeywords = function(response, convo) {
    convo.ask("Pl. type the word or keywords for document search.", function(response, convo) {
        convo.say("Awesome! Wait for a moment. Will search documents for word(s) *" + response.text +"*");
        searchDocuments2(response, convo);
        convo.next();
    });
}

searchDocuments = function(response, convo) {
    //db.ReferenceDocuments.createIndex( { keywords: "text" } )
    var qtext ="\""+response.text+"\"";
    db.ReferenceDocuments.find({$text:{$search:qtext}},{},{limit:3},function (err, docs) {
        var attachments = [];
        docs.forEach(function(d) {
            var attachment= {
                "title": d.title,
                "title_link": d.url,
                "text": d.description,
                "color": '#3AA3E3'
            };
            attachments.push(attachment);
        });

        convo.say({
            text: '*Document(s):*',
            attachments: attachments,
        })
    });
}

searchDocuments2 = function(response, convo) {
    var qtext ="\""+response.text+"\"";
    db_legal_entity.legal_entity.find({type: "gc"},function (err, docs) {
        var attachments = [];
        docs.forEach(function(d) {
            console.log("legal entity ---> " + d);
            var attachment= {
                "title": d.display_name,
                "display_name": d.display_name,
                "text": d.legal_entity_id,
                "color": '#3AA3E3'
            };
            attachments.push(attachment);
        });
        console.log(attachments);
        convo.say({
            text: '*Document(s):*',
            attachments: attachments,
        })
    });
}

search_gc = function(response, convo){
    db.legal_entity.find({type: "gc"},function (err, docs) {

        var attachments = [];
        docs.forEach(function(d) {
            var attachment= {
                "display_name": d.display_name,
                "type": d.type,
                "legal_entity_id": d.legal_entity_id,
                "current": d.current
            };
            attachments.push(attachment);
        });
        console.log(attachments);
        convo.say({
            text: '*Document(s):*',
            attachments: attachments,
        });
    });
}


controller.hears('get_gc1',['direct_message','direct_mention','mention'],function(bot,message) {

    db.legal_entity.find({type: "gc"},function (err, docs) {
        if (err){
            bot.reply(message, " got an error" + err);
        }

        bot.reply(message, 'I have a legal_entity with display_name:'+ docs.display_name);


        var attachments = [];
        docs.forEach(function(d) {
            var attachment= {
                "display_name": d.display_name,
                "type": d.type,
                "legal_entity_id": d.legal_entity_id,
                "current": d.current
            };
            attachments.push(attachment);
        });

        convo.say({
            text: '*Document(s):*',
            attachments: attachments,
        });
    })
});


