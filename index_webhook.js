'use strict';

const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

const request = require('superagent');

request
    .post(WEBHOOK_URL)
    .send({
        username: "Incoming bot",
        channel: "#general",
        icon_emoji: ":+1:",
        text: 'Ola! Here is a fun link: <http://www.github.com|Github is great!>',
        attachments: [
            {
                "text": "Choose a game to play",
                "fallback": "You are unable to choose a game",
                "callback_id": "wopr_game",
                "color": "#3AA3E3",
                "attachment_type": "default",
                "actions": [
                    {
                        "name": "game",
                        "text": "Chess",
                        "type": "button",
                        "value": "chess"
                    },
                    {
                        "name": "game",
                        "text": "Falken's Maze",
                        "type": "button",
                        "value": "maze"
                    },
                    {
                        "name": "game",
                        "text": "Thermonuclear War",
                        "style": "danger",
                        "type": "button",
                        "value": "war",
                        "confirm": {
                            "title": "Are you sure?",
                            "text": "Wouldn't you prefer a good game of chess?",
                            "ok_text": "Yes",
                            "dismiss_text": "No"
                        }
                    }
                ]
            }
        ]

    })
    .end((err, res) => {
        console.log(res);
    });

