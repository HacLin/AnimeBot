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

var Results = [];
let req = 0;
bot.command('anime', (ctx) => {
    var anime_name = ' ';
    let page = 1;
    req += 1;


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

        console.log(search);
        search.shift();
        anime_name = search.join(" ");

        function DataReceiver(page, search) {
            console.log("Arguments Passed");

            console.log(anime_name);
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
                    let temp = new Object();
                    temp.results = res;
                    Results.push(temp);
                    console.log(Results);
                    // console.log(Results[0].results.results[0].image_url);
                    // console.log(Results);
                    // console.log(Results[0]);
                    // console.log(Results[0].results[0].image_url);
                    // console.log(Results[0].res.results[0]);
                    // console.log(Results);
                    // console.log(Results[0]['results'][0][image_url]);
                    // console.log(Results[0].results.image_url);
                    if (res.status == 404) {
                        ctx.reply(res.message + " Try Again Later!");

                    } else {
                        // console.log(Results);
                        // console.log(res); 
                        var choices = [];
                        // var keyboard = [];
                        let start = 0;
                        let stop = 10;


                        function keyboard_sender(start, stop, req) {
                            var keyboard = [];
                            var reply_message = `Loaded Page : ${page}` + '\n' + `Loaded Options : ${(page*50)-(50-stop)}`;

                            for (let i = start; i < stop; i++) {
                                choices[i] = new Object();
                                choices[i].Title = Results[(req - 1)].results.results[i].title;
                                choices[i].Type = Results[(req - 1)].results.results[i].type;
                                keyboard.push([{ text: choices[i].Title + ' : ' + choices[i].Type, callback_data: JSON.stringify(i) + '-' + JSON.stringify(page) + '-' + JSON.stringify(req) }]);

                            }

                            keyboard.push([{ text: "Load More", callback_data: "#" + ' - ' + JSON.stringify(req) }]);
                            //console.log(keyboard);
                            ctx.reply(reply_message, {
                                reply_markup: JSON.stringify({
                                    inline_keyboard: keyboard

                                })
                            }).catch(err => console.log(err))
                            console.log("Options Sent to the Chat");
                            bot.on('callback_query', (cbd) => {
                                let cbdata = cbd.update.callback_query.data;
                                cbdata = cbdata.split("-");
                                console.log(cbdata);

                                if (cbdata.length == 2) {
                                    console.log("length compared");
                                    if (JSON.stringify(cbdata[0]) == "#") {
                                        console.log("# compared")
                                            // keyboard.splice(-1, 1);
                                            // console.log(keyboard);
                                            // console.log(cbd.update.callback_query.message);
                                            // console.log(cbd.update.callback_query.from);


                                        cbd.deleteMessage(cbd.update.callback_query.message.id);
                                        // cbd.editMessageReplyMarkup().then(console.log("Loaded More Options")).catch(err => console.log(err))
                                        if (stop != 50) {
                                            stop += 10;

                                            keyboard_sender(start, stop, cbdata[1]);
                                        } else {
                                            page += 1;
                                            keyboard_sender(start, stop, cbdata[1]);
                                            stop = 10;
                                            DataReceiver(page, search);

                                        }
                                    }
                                } else {

                                    // console.log(cbdata);
                                    let pageno = cbdata[1] - 1;
                                    let itemno = cbdata[0];
                                    let reqno = cbdata[2] - 1;
                                    console.log("Data Sent\nPage No:" + pageno + "\nItem No:" + itemno);
                                    // console.log(Results[pageno].results[pageno].image_url);
                                    cbd.replyWithPhoto(Results[reqno].results.results[itemno].image_url, { caption: "\n\nTitle :" + Results[reqno].results.results[itemno].title + '\n\nType :' + Results[reqno].results.results[itemno].type + '\n\nEpisodes :' + Results[reqno].results.results[itemno].episodes + '\n\nAiring:' + Results[reqno].results.results[itemno].airing + '\n\nRating :' + Results[reqno].results.results[itemno].score + '\n\nRated :' + Results[reqno].results.results[itemno].rated + '\n\n\n\n For more info visit the link:\n' + Results[reqno].results.results[itemno].url + '\n@AniList' })
                                        .catch(err => console.log(err));


                                }
                            })
                        }

                        keyboard_sender(start, stop, req);


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