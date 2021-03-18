const { Composer } = require('micro-bot');
const bot = new Composer;
const request = require('request');

bot.start((ctx) => {

    // console.log(ctx.message.from);
    // console.log(ctx.message.chat);
    ctx.reply('Welcome to the AnimeBot ' + ctx.message.chat.first_name);
    ctx.reply('<Usage>: /anime <anime-name>');
})


bot.help((ctx) => {

    // console.log(ctx.message.from);
    // console.log(ctx.message.chat);
    // ctx.reply('Welcome to the MoviesBot ' + ctx.message.chat.first_name);
    ctx.reply('<Usage>: /anime <anime-name>or<series-name>');
})

bot.command('anime', (ctx) => {
    var anime_name = ' ';
    let page = 1;

    ctx.reply('///...Requesting Data From the Server...///');
    chatId = ctx.message.chat.id;
    console.log("Chat ID:" + chatId);
    let search = ctx.message.text.split(" ");
    // console.log(search);
    if (search.length == 1) {
        console.log("No Arguments Passed");
        ctx.reply("Kindly Follow The Procedure");
        ctx.reply("<Usage>: /anime <anime-name>");
    } else {
        var Results = [];

        function DataReceiver(page, search) {
            console.log("Arguments Passed");
            search.shift();
            anime_name = search.join(" ");
            console.log("Searching for " + anime_name + ` page:${page}`);
            ctx.reply("///...Searching for " + anime_name + ` page:${page}` + " in the server...///");
            // ctx.reply("///...Choose From The Options Below ...///");
            var api_call = `https://api.jikan.moe/v3/search/anime?q=${anime_name}&page=${page}`;
            console.log("Requesting Data as :" + api_call);
            const url_options = {
                    method: "GET",
                    url: api_call
                }
                // console.log(url_options);
            request(url_options, (error, response, body) => {

                if (!error) {
                    console.log("Data Received");
                    // console.log(Results.results);
                    //console.log(response);
                    // console.log(body);
                    var res = JSON.parse(body);
                    Results.push(res);
                    // console.log(Results);
                    // console.log(Results[0].results);
                    if (res.status == 404) {
                        ctx.reply(res.message + " Try Again Later!");

                    } else {
                        // console.log(Results);
                        // console.log(res); 
                        var choices = [];
                        // var keyboard = [];
                        let start = 0;
                        let stop = 10;


                        function keyboard_sender(start, stop) {
                            var keyboard = [];
                            var reply_message = `Loaded Page : ${page}` + '\n' + `Loaded Options : ${stop}`;

                            for (let i = start; i < stop; i++) {
                                choices[i] = new Object();
                                choices[i].Title = res.results[i].title;
                                choices[i].Type = res.results[i].type;
                                keyboard.push([{ text: choices[i].Title + ' : ' + choices[i].Type, callback_data: JSON.stringify(i) + '-' + JSON.stringify(page) }]);

                            }

                            keyboard.push([{ text: "Load More", callback_data: "#" }]);
                            //console.log(keyboard);
                            ctx.reply(reply_message, {
                                reply_markup: JSON.stringify({
                                    inline_keyboard: keyboard

                                })
                            }).catch(err => console.log(err))
                            console.log("Options Sent to the Chat");
                            bot.on('callback_query', (cbd) => {
                                if (cbd.update.callback_query.data == "#") {
                                    // keyboard.splice(-1, 1);
                                    // console.log(keyboard);
                                    // console.log(cbd.update.callback_query.message);
                                    // console.log(cbd.update.callback_query.from);
                                    cbd.deleteMessage(cbd.update.callback_query.message.id);

                                    // cbd.editMessageReplyMarkup().then(console.log("Loaded More Options")).catch(err => console.log(err))
                                    if (stop != 50) {
                                        stop += 10;
                                        keyboard_sender(start, stop);
                                    } else {
                                        page += 1;
                                        DataReceiver(page, search);
                                    }
                                } else {
                                    let cbdata = cbd.update.callback_query.data;
                                    cbdata = cbdata.split("-");
                                    // console.log(cbdata);
                                    let pageno = cbdata[1] - 1;
                                    let itemno = cbdata[0];
                                    console.log("Data Sent\nPage No:" + pageno + "\nItem No:" + itemno);
                                    // console.log(Results[pageno].results[pageno].image_url);
                                    cbd.replyWithPhoto(Results[pageno].results[itemno].image_url, { caption: "\n\nTitle :" + Results[pageno].results[itemno].title + `(${anime_name.toUpperCase()})` + '\n\nType :' + Results[pageno].results[itemno].type + '\n\nEpisodes :' + Results[pageno].results[itemno].episodes + '\n\nStatus :' + Results[pageno].results[itemno].airing + '\n\nRating :' + Results[pageno].results[itemno].score + '\n\nRated :' + Results[pageno].results[itemno].rated + '\n\n\n\n For more info visit the link:\n' + Results[pageno].results[itemno].url + '\n@AniList' })
                                        .catch(err => console.log(err));


                                }
                            }).catch(err => console.log(err));
                        }

                        keyboard_sender(start, stop);


                    }







                } else {
                    console.log(error);

                }



            });

        }
        DataReceiver(page, search);
    }



});

// bot.launch();
module.exports = bot;