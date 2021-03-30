// const { Composer } = require('micro-bot');
// const bot = new Composer;
const { Telegraf } = require('telegraf');
const bot = new Telegraf("1725572839:AAFvTQVM0x5AhZzTQ4jk6CnnPd5WU6u5G3E");
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
var AnimeResults = [];
// var MovieResults = [];
var anime_name = ' ';
let page = 1;
var apicalls = [];
apicalls = new Object();
var reply_message = '';
const Methods = ['anime', 'movie', 'undefined'];


//Builds api calls for data receiving function 
ApiCallBuilder = (Item, page, type) => {

    apicalls.anime = `https://api.jikan.moe/v3/search/anime?q=${Item}&page=${page}`

    url = apicalls[type]
    console.log("Builded API Call: " + url);
    return (url);
}




//Receves data from the api
DataRequest = async(Item, page, type) => {
    console.log("Searching for " + Item + ` page:${page}`);
    // ctx.reply("///...Searching for " + Item + ` page:${page}` + " in the server...///");

    console.log("Type: " + type);

    var api_call = ApiCallBuilder(Item, page, type)
    console.log("Requesting Data from: " + api_call);
    const url_options = {
        method: "GET",
        url: api_call
    }
    return new Promise(await
        function(resolve, reject) {

            request(url_options, (error, response, body) => {
                // console.log(response);

                if (!error) {
                    var res = JSON.parse(body);
                    console.log("Data Received");
                    let temp = new Object();
                    temp.results = res;
                    temp.loaded = 0;
                    temp.callbackdata = type + '-' + Item
                    let ret = type;
                    if (ret == "anime")
                        AnimeResults.push(temp);
                    // if (ret == "movie")
                    //     MovieResults.push(temp)
                    console.log("Data pushed into " + ret + "DB");
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
AnimeQueryBuilder = (Item, type, pageno, opcount, start, stop) => {
    var query = [];
    var choices;
    let cbdata = type + '-' + Item;
    let opt = AnimeResults.findIndex(x => x.callbackdata == cbdata)
        // let Type = type;
        // let Items = Item;
    console.log("Searching for " + Item + " as " + type + " in the Results");
    for (let i = start; i < stop; i++) {
        choices = new Object();
        choices.ImageUrl = AnimeResults[opt].results.results[i].image_url;
        choices.Title = AnimeResults[opt].results.results[i].title;
        choices.Type = AnimeResults[opt].results.results[i].type;
        if (choices.AnimeResults[opt].results.results[i].airing) {
            choices.Airing = "Currently Airing"
        } else {
            choices.Airing = "Finished Airing"
        }

        choices.Episodes = AnimeResults[opt].results.results[i].episodes;
        choices.Score = AnimeResults[opt].results.results[i].score;
        choices.Rated = AnimeResults[opt].results.results[i].rated;
        choices.url = AnimeResults[opt].results.results[i].url;
        choices.plot = AnimeResults[opt].results.results[i].synopsis;
        query.push(choices);
    }


    console.log("Query Builded :\n");
    // console.log(query.map((x) => console.log(x)) + '\n');
    return (query);
}





bot.on('inline_query', async(ctx) => {
    let Query = ctx.update.inline_query.query;
    console.log(`Executing the user query: ${Query}`)
    console.log("Chat ID: " + ctx.update.inline_query.from.id)
    let search = Query.split(" ");
    let method = search[0];
    search.shift();
    let searchitem = search.join("").toLowerCase();
    let option = Methods.indexOf(method)
    console.log("Executing " + Methods[option] + " function");
    let InlineResults;
    if (option == 2)
        console.log("Interpreting query.....")
    switch (option) {
        case 0:
            if (searchitem == 'undefined' || searchitem == 'null' || searchitem == "") {
                console.log("Interpreting query....");
                break;
            }

            InlineResults = await Anime(ctx, searchitem);
            ctx.answerInlineQuery(InlineResults).catch((err) => console.log(err));
            break;
        case 1:
            InlineResults = await Movie(ctx, searchitem);
            ctx.answerInlineQuery(InlineResults).catch((err) => console.log(err));
            break;

    }



})

Anime = async(ctx, searchitem) => {


    var returnvalue = await DataRequest(searchitem, page, "anime");

    if (returnvalue.status == 400) {
        ctx.reply(returnvalue.message + '. Try again Later!');
    } else {

        let opcount = returnvalue.results.length;
        let stop = opcount;
        let start = 0;
        let query = AnimeQueryBuilder(searchitem, "anime", page, opcount, start, stop)
            // console.log(query);
        let InlineResults = query.map((item, index) => {
            // console.log(item);
            return {
                type: 'article',
                id: String(index),
                title: item.Title + ':' + item.Type,
                input_message_content: {
                    message_text: '\nTitle: ' + item.Title + '\nType: ' + item.Type + '\nStatus: ' + item.Airing + '\nScore :' + item.Score + '\nNo.of.Episodes: ' + item.Episodes + '\nSynopsis: ' + item.plot,
                    parse_mode: "Markdown"
                },
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Share", switch_inline_query: `${item.Type}` + " " + `${item.Title}` }],
                        [{ text: "Visit for more info", url: `${item.url}` }]
                    ]
                },
                // photo_url: item.ImageUrl,
                thumb_url: item.ImageUrl,
                url: item.url,
                description: item.plot,
                // caption: String(item. + "\n" + ) || "none"

            }
        })
        console.log(InlineResults);
        return (InlineResults);

    }
}


bot.launch();
// module.exports = bot;