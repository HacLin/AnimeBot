const { Telegraf } = require('telegraf');
const BOT_TOKEN = process.env.BOT_TOKEN
const PORT = process.env.PORT || 3000
const URL = process.env.BOT_DOMAIN
const bot = new Telegraf(BOT_TOKEN);
const request = require('request');
const cron = require('node-cron');
const fetch = require('node-fetch');
bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);
bot.startWebhook(`/bot${BOT_TOKEN}`, null, PORT)

bot.start((ctx) => {

    // console.log(ctx.message.from);
    // console.log(ctx.message.chat);
    ctx.reply('Welcome to the AnimeBot ' + ctx.message.chat.first_name);
    ctx.reply('<Usage>: @anim4rvrbot anime <anime-name>');
})


bot.help((ctx) => {

    // console.log(ctx.message.from);
    // console.log(ctx.message.chat);
    // ctx.reply('Welcome to the MoviesBot ' + ctx.message.chat.first_name);
    ctx.reply('<Usage>: @anim4rvrbot anime <anime-name>');
})


//Global Variables
var AnimeResults = [];
var AnimeDB = [];
let page = 1;
var apicalls = [];
apicalls = new Object();

const Methods = ['anime', 'movie', 'undefined'];


//Builds api calls for data receiving function 
ApiCallBuilder = (Item, page, type) => {

    apicalls.anime = `https://api.jikan.moe/v3/search/anime?q=${Item}&page=${page}`
    if (Number.isInteger(Item)) {
        apicalls.anime = `https://api.jikan.moe/v3/anime/${Item}`
    }
    url = apicalls[type]
    console.log("Builded API Call: " + url);
    return (url);
}




//Receves data from the api
DataRequest = async(Item, page, type) => {
    console.log("Searching for " + Item + ` page:${page}`);
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
                if (!error) {
                    var res = JSON.parse(body);
                    console.log("Data Received");
                    let temp = new Object();
                    temp.results = res;
                    temp.loaded = 0;
                    temp.callbackdata = type + '-' + Item
                    let ret = type;
                    if (ret == "anime" && Number.isInteger(Item)) {
                        AnimeDB.push(temp);
                    } else {
                        AnimeResults.push(temp);
                    }
                    console.log("Data pushed into " + ret + "Results");
                    resolve(res);
                    if (res.status == 400) {
                        reject(res.message);
                    }

                }
            })
        })


}


//Builds Inline Query
AnimeQueryBuilder = (Item, type, start, stop) => {
    var query = [];
    var choices;
    let cbdata = type + '-' + Item;
    let opt = AnimeResults.findIndex(x => x.callbackdata == cbdata)

    console.log("Searching for " + Item + " as " + type + " in the Results");
    for (let i = start; i < stop; i++) {
        choices = new Object();
        choices.ImageUrl = AnimeResults[opt].results.results[i].image_url;
        choices.Title = AnimeResults[opt].results.results[i].title;
        choices.Type = AnimeResults[opt].results.results[i].type;
        if (AnimeResults[opt].results.results[i].airing) {
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
            if (InlineResults == null) {
                console.log("Interpreting Query....")
                break;
            } else {

                ctx.answerInlineQuery(InlineResults, 60).catch((err) => console.log(err));
                break;
            }
        case 1:
            InlineResults = await Movie(ctx, searchitem);
            ctx.answerInlineQuery(InlineResults).catch((err) => console.log(err));
            break;

    }
    bot.catch((err) => console.log(err));

})






bot.on('chosen_inline_result', async(cir) => {

    let id = cir.update.chosen_inline_result.result_id;
    console.log("Result ID : " + id);
    let Query = cir.update.chosen_inline_result.query;
    console.log(`Executing the user query: ${Query}`)
    console.log("Chat ID: " + cir.update.chosen_inline_result.from.id)
    let search = Query.split(" ");
    let method = search[0];
    let searchitem = search[1];
    let cbdata = method + '-' + searchitem;
    let index = AnimeResults.findIndex(x => x.callbackdata == cbdata)
    let malid = AnimeResults[index].results.results[id].mal_id
    let Data = await DataRequest(malid, page, method)

    //Building Response
    console.log("Started Building Response...")
    let title_eng = Data.title_english
    let title_jap = Data.title_japanese
    let type = Data.type
    let genre = [];
    Data.genres.map((x) => { genre.push(x.name) })
    let episodes = Data.episodes
    let status = Data.status
    let aired = Data.aired.string
    let duration = Data.duration
    let rating = Data.rating
    let score = Data.score
    let plot = [];
    let synop = Data.synopsis.split("");
    for (let j = 0; j < 300; j++) {
        plot.push(synop[j])
    }
    plot = plot.join("")
    let ImageUrl = Data.image_url
    let anilisturl = Data.url
    let trailerurl = Data.trailer_url
    let markdown = `
        **Title : ${title_eng}(${title_jap})**
        \nType  : ${type}
        \nGenre : ${genre.join(",")}
        \nNo.of.Episodes : ${episodes}
        \nStatus: ${status}
        \nAiring: ${aired}
        \nDuration:${duration}
        \nRating: ${rating}
        \nScore:${score}
        \n\n${plot}...\n\n\tvia@jikon\n\t#anime`
    let keyboard = [
        [{ text: "Trailer", url: trailerurl }],
        [{ text: "For more info", url: anilisturl }]
    ]
    bot.telegram.sendPhoto(cir.update.chosen_inline_result.from.id, ImageUrl, { caption: markdown, reply_markup: { inline_keyboard: keyboard } })
    let update = await bot.telegram.getUpdates()
    console.log(update)
    let sentid;
    let respondedto;
    update.forEach((item, index) => {
        if (item.hasOwnProperty('message')) {
            sentid = update[index].message.chat.id;
            respondedto = update[index].message.chat.title
        }
    })
    console.log(sentid);
    bot.telegram.sendPhoto(sentid, ImageUrl, { caption: markdown, reply_markup: { inline_keyboard: keyboard } })
    console.log("Response sent to " + respondedto);

})

Anime = async(ctx, searchitem) => {


    var returnvalue = await DataRequest(searchitem, page, "anime");
    return new Promise((resolve, reject) => {
        if (returnvalue.status == 400 || returnvalue.results == undefined) {
            reject(returnvalue.message + '. Try again Later!');
        } else {

            let opcount = returnvalue.results.length;
            let stop = opcount;
            let start = 0;
            let query = AnimeQueryBuilder(searchitem, "anime", start, stop)
            console.log("Started Building InlineResults...")
            let InlineResults = query.map((item, index) => {
                return {
                    type: 'article',
                    id: String(index),
                    title: item.Title + ':' + item.Type,
                    input_message_content: {
                        message_text: '\nResults for ' + item.Title,
                        parse_mode: "Markdown"
                    },
                    thumb_url: item.ImageUrl,
                    thumb_width: 500,
                    thumb_height: 500,
                    url: item.url,
                    description: item.plot
                }

            })
            console.log("Builded InlineResults");
            bot.catch((err) => console.log(err));
            resolve(InlineResults);

        }


    })


}

// keepAlive.js




(() => {


    const cronJob = cron.CronJob('0 */25 * * * *', () => {

        fetch(URL)
            .then(res => console.log(`response-ok: ${res.ok}, status: ${res.status}`))
            .catch(err => console.log(err))

    });

    cronJob.start();
})();


bot.launch();