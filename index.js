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
const Methods = ['anime', 'movie'];


//Builds api calls for data receiving function 
ApiCallBuilder = (Item, page, type) => {

    apicalls.anime = `https://api.jikan.moe/v3/search/anime?q=${Item}&page=${page}`

    url = apicalls[type]
    console.log("Builded API Call: " + url);
    return (url);
}




//Receves data from the api
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
        choices[i] = new Object();
        choice[i].ImageUrl = AnimeResults[opt].results.results[i].image_url;
        choice[i].Title = AnimeResults[opt].results.results[i].title;
        choice[i].Type = AnimeResults[opt].results.results[i].type;
        let Airing = () => {
            if (choice[i].AnimeResults[opt].results.results[i].airing) {
                choice[i].Airing = "Currently Airing"
            } else {
                choice[i].Airing = "Finished Airing"
            }
        }
        choice[i].Episodes = AnimeResults[opt].results.results[i].episodes;
        choice[i].Score = AnimeResults[opt].results.results[i].score;
        choice[i].Rated = AnimeResults[opt].results.results[i].rated;
        choice[i].url = AnimeResults[opt].results.results[i].url;
        choice[i].plot = AnimeResults[opt].results.results[i].synopsis;
        query.push(choices);
    }


    console.log("Query Builded :\n");
    console.log(query.map((x) => console.log(x)) + '\n');
    return (query);
}





bot.on('inline_query', (ctx) => {
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
    switch (option) {
        case 0:
            InlineResults = Anime(ctx, searchitem);
            break;
        case 1:
            InlineResults = Movie(ctx, searchitem);
            break;
    }
    ctx.answerInlineQuery(InlineResults);


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
        let InlineResults = query.map((item, index) => {
                // console.log(item);
                return {
                    type: 'photo',
                    id: String(index),
                    title: item.text,
                    input_message_content: {
                        message_text: item.text
                    }
                }
            })
            // console.log(InlineResults);
        return (InlineResults);

    }
}


bot.launch();
// module.exports = bot;