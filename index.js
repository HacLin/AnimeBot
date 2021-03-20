// const { Composer } = require('micro-bot');
// const bot = new Composer;
const { Telegraf } = require('telegraf');
const bot = new Telegraf("1341590139:AAE_Zq-OKl4woXAwBKYkN1MDDRtEtosSz7E");
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
    ctx.reply('<Usage>: /anime <anime-name>');
})

var Results = [];
var req = [];
var anime_name = ' ';
let page = 1;
//Globalise the function
function DataRequest() {
    console.log("Searching for " + anime_name + ` page:${page}`);
    ctx.reply("///...Searching for " + anime_name + ` page:${page}` + " in the server...///");

    var api_call = `https://api.jikan.moe/v3/search/anime?q=${anime_name}&page=${page}`;
    console.log("Requesting Data as :" + api_call);
    const url_options = {
        method: "GET",
        url: api_call
    }
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

            if (res.status == 404) {
                ctx.reply(res.message + " Try Again Later!");

            }
        }
    })
}
//Globalise the function
function keyboard_sender(start, stop) {
    var keyboard = [];
    var reply_message = `Loaded Page : ${page}` + '\n' + `Loaded Options : ${(page*50)-(50-stop)}`;

    for (let i = start; i < stop; i++) {
        choices[i] = new Object();
        choices[i].Title = Results[req.findIndex(x => x.anime = anime_name)].results.results[i].title;
        choices[i].Type = Results[req.findIndex(x => x.anime = anime_name)].results.results[i].type;
        keyboard.push([{ text: choices[i].Title + ' : ' + choices[i].Type, callback_data: JSON.stringify(i) + '-' + JSON.stringify(page) + '-' + JSON.stringify(req.findIndex(x => x.anime = anime_name)) }]);

    }

    keyboard.push([{ text: "Load More", callback_data: "#" }]);
    //console.log(keyboard);
    ctx.reply(reply_message, {
        reply_markup: JSON.stringify({
            inline_keyboard: keyboard

        })
    }).catch(err => console.log(err))
}




bot.command('anime', (ctx) => {

    console.log(ctx);
    console.log(`Executing ${ctx.message.text}`)
    chatId = ctx.message.chat.id;
    console.log("Chat ID:" + chatId);
    let search = ctx.message.text.split(" ");
    search.shift();
    anime_name = search.join(" ").toLowerCase();
    // console.log(search);
    if (search.length == 0) {
        console.log("No Arguments Passed");
        ctx.reply(`Kindly Follow The Procedure ${ctx.message.chat.first_name}`);
        ctx.reply("<Usage>: /anime <anime-name>");
    } else {



    }
});

bot.launch();
// module.exports = bot;