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


//Global Variables
var Results = [];
var req = [];
var anime_name = ' ';
let page = 1;
var apicalls = [];
apicalls = new Object();
var reply_message = '';

//Builds api calls for data receiving function 
ApiCallBuilder = (Item, page, type) => {

    apicalls.anime = `https://api.jikan.moe/v3/search/anime?q=${Item}&page=${page}`
    url = apicalls[type]
    console.log("Builded API Call: " + url);
    return (url);
}



//Globalised function for receiving data
DataRequest = (Item, page, type) => {
    console.log("Searching for " + Item + ` page:${page}`);
    // ctx.reply("///...Searching for " + Item + ` page:${page}` + " in the server...///");

    console.log("Type: " + type);

    var api_call = ApiCallBuilder(Item, page, type)
    console.log("Requesting Data from: " + api_call);
    const url_options = {
        method: "GET",
        url: api_call
    }
    return new Promise(function(resolve, reject) {

        request(url_options, (error, response, body) => {

            if (!error) {
                var res = JSON.parse(body);
                console.log("Data Received");
                let temp = new Object();
                temp.results = res;
                // temp.type = type;
                // temp.Item = Item;
                temp.callbackdata = type + '-' + Item
                Results.push(temp);
                resolve(res);
                // console.log(res);
                if (res.status == 400) {
                    reject(res.message);
                }

                // console.log(Results); 
                // console.log("Not Returned");
            }
        })
    })


}


//Globalise the function
KeyboardBuilder = (Item, type, pageno, opcount, start, stop) => {
    var keyboard = [];
    var choices = [];
    let cbdata = type + '-' + Item;
    // let Type = type;
    // let Items = Item;
    console.log("Searching for " + Item + " as " + type + " in the Results");
    reply_message = `Loaded Page : ${pageno}` + '\n' + `Loaded Options : ${(pageno*opcount)-(opcount-stop)}`;
    for (let i = start; i < stop; i++) {
        choices[i] = new Object();
        choices[i].Title = Results[Results.findIndex(x => x.callbackdata == cbdata)].results.results[i].title;
        choices[i].Type = Results[Results.findIndex(x => x.callbackdata == cbdata)].results.results[i].type;
        keyboard.push([{
            text: choices[i].Title + ' : ' + choices[i].Type,
            callback_data: JSON.stringify(pageno) + '-' + JSON.stringify(Results.findIndex(x => x.callbackdata == cbdata)) + '-' + JSON.stringify(i)

        }]);
    }
    keyboard.push([{
        text: "Load More",
        callback_data: pageno + '-' + Results.findIndex(x => x.callbackdata == cbdata)

    }]);
    console.log("Keyboard Builded :\n");
    console.log(keyboard + '\n');
    return (keyboard);

}


KeyboardSender = (repmsg, keydata, ctx) => {
    ctx.reply(repmsg, {
            reply_markup: JSON.stringify({
                inline_keyboard: keydata

            })
        })
        .then(console.log(`Keyboard Sent to the chat ${ctx.message.chat.id}`))
        .catch(err => console.log(err))

}




bot.command('anime', async(ctx) => {

    // console.log(ctx);
    console.log(`Executing the user command: ${ctx.message.text}`)
    chatId = ctx.message.chat.id;
    console.log("Chat ID:" + chatId);
    let search = ctx.message.text.split(" ");
    search.shift();
    anime_name = search.join("").toLowerCase();
    // console.log(search);
    if (search.length == 0) {
        console.log("No Arguments Passed");
        ctx.reply(`Kindly Follow The Procedure ${ctx.message.chat.first_name}`);
        ctx.reply("<Usage>: /anime <anime-name>");
    } else {

        var returnvalue = await DataRequest(anime_name, page, "anime");
        // console.log("Returned")
        // console.log(returnvalue)
        console.log(Results);
        if (returnvalue.status == 400) {
            ctx.reply(returnvalue.message + '. Try again Later!');
        } else {

            let opcount = returnvalue.results.length;
            let stop = 5;
            let start = 0;
            let keyboard = KeyboardBuilder(anime_name, "anime", page, opcount, start, stop)
            KeyboardSender(reply_message, keyboard, ctx);
            // let cbdata = 'anime-fullmetal'
            // console.log(Results.findIndex(x => x.callbackdata == cbdata));


            bot.on('callback_query', (cbd) => {
                const cbquery = cbd.update.callback_query.data;
                // console.log(ctx.update.callback_query);
                // console.log(ctx.update);
                // console.log(ctx);
                console.log("Received Callback Query Data :" + cbquery);
                var cbdata = cbquery.split("-");
                cbdata = cbdata.map((x) => { return parseInt(x, 10) })
                console.log(cbdata);
                if (cbdata.length == 2) {
                    let media = Results[cbdata[1]].callbackdata.split('-')
                    console.log(media);
                    console.log("Loading More Options for " + Results[cbdata[1]].callbackdata)
                    let keydata = KeyboardBuilder(media[1], media[0], cbdata[0], opcount, stop, stop += 5)
                    KeyboardSender(reply_message, keydata, ctx);
                }




            })
        }


        // console.log(Results)

    }
});

bot.launch();
// module.exports = bot;