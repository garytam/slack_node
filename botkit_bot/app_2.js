var Botkit = require('Botkit');
var os = require('os');

var mongojs = require('mongojs');
var db = mongojs('127.0.0.1:27017/BotDB',['ReferenceDocuments']);

var controller = Botkit.slackbot({
    debug: false
});

var bot = controller.spawn({
    token: process.env.SLACK_TOKEN
}).startRTM();


controller.hears('hello',['direct_message','direct_mention','mention'],function(bot,message) {
    bot.reply(message,'Hello there!');
    db.ReferenceDocuments.find({title:"Newsletter Template"},function (err, docs) {
        bot.reply(message,'I have a document with title:'+ docs[0].title);
    })

});

controller.hears(['docs','template','research documentation','documents'],
    ['direct_message','direct_mention','mention'],function(bot,message) {
        bot.startConversation(message, askForKeywords);
    });

askForKeywords = function(response, convo) {
    convo.ask("Pl. type the word or keywords for document search.", function(response, convo) {
        convo.say("Awesome! Wait for a moment. Will search documents for word(s) *" + response.text +"*");
        searchDocuments(response, convo);
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
                "color": '#3AA3E3',
                "footer": "From Amazon S3 | Version " +d.version
            };
            attachments.push(attachment);
        });

        convo.say({
            text: '*Document(s):*',
            attachments: attachments,
        })
    });
}

db.on('error', function (err) {
    console.log('Database error', err)
})

db.on('connect', function () {
    console.log('Database connected')
})