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




//Receives data from the api
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
AnimeKeyboardBuilder = (Item, type, pageno, opcount, start, stop) => {
        var keyboard = [];
        var choices = [];
        let cbdata = type + '-' + Item;
        // let Type = type;
        // let Items = Item;
        console.log("Searching for " + Item + " as " + type + " in the Results");
        reply_message = 'Searching for : ' + Item + '\n' + `Loaded Options : ${(pageno*opcount)-(opcount-stop)}`;
        for (let i = start; i < stop; i++) {
            choices[i] = new Object();
            choices[i].Title = AnimeResults[AnimeResults.findIndex(x => x.callbackdata == cbdata)].results.results[i].title;
            choices[i].Type = AnimeResults[AnimeResults.findIndex(x => x.callbackdata == cbdata)].results.results[i].type;
            keyboard.push([{
                text: choices[i].Title + ' : ' + choices[i].Type,
                callback_data: JSON.stringify(pageno) + '-' + JSON.stringify(AnimeResults.findIndex(x => x.callbackdata == cbdata)) + '-' + JSON.stringify(i)

            }]);
        }
        keyboard.push([{
            text: "Load More",
            callback_data: pageno + '-' + AnimeResults.findIndex(x => x.callbackdata == cbdata)

        }]);
        AnimeResults[AnimeResults.findIndex(x => x.callbackdata == cbdata)].loaded = stop;
        console.log("Keyboard Builded :\n");
        console.log(keyboard + '\n');
        return (keyboard);

    }
    // MovieKeyboardBuilder = (Item, type, pageno, opcount, start, stop) => {
    //     var keyboard = [];
    //     var choices = [];
    //     let cbdata = type + '-' + Item;
    //     // let Type = type;
    //     // let Items = Item;
    //     console.log("Searching for " + Item + " as " + type + " in the Results");
    //     reply_message = 'Searching for : ' + Item + '\n' + `Loaded Options : ${(pageno*opcount)-(opcount-stop)}`;
    //     for (let i = start; i < stop; i++) {
    //         choices[i] = new Object();
    //         choices[i].Title = MovieResults[MovieResults.findIndex(x => x.callbackdata == cbdata)].results.results[i].title;
    //         choices[i].Type = MovieResults[MovieResults.findIndex(x => x.callbackdata == cbdata)].results.results[i].media_type;
    //         keyboard.push([{
    //             text: choices[i].Title + ' : ' + choices[i].Type,
    //             callback_data: JSON.stringify(pageno) + '-' + JSON.stringify(MovieResults.findIndex(x => x.callbackdata == cbdata)) + '-' + JSON.stringify(i)

//         }]);
//     }
//     keyboard.push([{
//         text: "Load More",
//         callback_data: pageno + '-' + MovieResults.findIndex(x => x.callbackdata == cbdata)

//     }]);
//     MovieResults[MovieResults.findIndex(x => x.callbackdata == cbdata)].loaded = stop;
//     console.log("Keyboard Builded :\n");
//     console.log(keyboard + '\n');
//     return (keyboard);

// }


KeyboardSender = (repmsg, keydata, ctx) => {
    ctx.reply(repmsg, {
            reply_markup: JSON.stringify({
                inline_keyboard: keydata

            })
        })
        .then(console.log(`Keyboard Sent to the chat ${ctx.message.chat.id}`))
        .catch(err => console.log(err))

}
Datasender = (cbdata, media, ctx) => {

    // console.log(cbdata);
    // console.log(media);
    // console.log(ctx);
    let run;
    anime = () => {
        let imageurl = AnimeResults[cbdata[1]].results.results[cbdata[2]].image_url;
        let Title = AnimeResults[cbdata[1]].results.results[cbdata[2]].title;
        let type = AnimeResults[cbdata[1]].results.results[cbdata[2]].type;
        let Airing = () => {
            if (AnimeResults[cbdata[1]].results.results[cbdata[2]].airing) {
                return ("Currently Airing")
            } else {
                return ("Finished Airing")
            }
        }
        let Episodes = AnimeResults[cbdata[1]].results.results[cbdata[2]].episodes;
        let Score = AnimeResults[cbdata[1]].results.results[cbdata[2]].score;
        let Rating = AnimeResults[cbdata[1]].results.results[cbdata[2]].rated;
        let url = AnimeResults[cbdata[1]].results.results[cbdata[2]].url;
        let plot = AnimeResults[cbdata[1]].results.results[cbdata[2]].synopsis;
        ctx.replyWithPhoto(imageurl, { caption: "\n\nTitle: " + Title + "\nType: " + type + "\nStatus: " + Airing() + "\nNo.of.Episodes: " + Episodes + "\nScore: " + Score + "\nRating: " + Rating + "\n" + plot + "\n\nFor more info visit: " + url })
    }
    if (media[0] == "anime")
        run = anime
    run();
}

bot.on('inline_query', (ctx) => {
    let Query = ctx.update.inline_query.query;
    console.log("Query for " + Query);
    console.log(ctx.update.inline_query.from)
    switch (Methods.findIndex(ctx.update.inline_query.query)) {
        case 0:
            Anime(ctx);
            break;
        case 1:
            Movie(ctx);
            break;
    }


})

Anime = async(ctx) => {

    // console.log(ctx);

    console.log(`Executing the user query: ${ctx.update.inline_query.query}`)
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
        // console.log(Results);
        if (returnvalue.status == 400) {
            ctx.reply(returnvalue.message + '. Try again Later!');
        } else {

            let opcount = returnvalue.results.length;
            let stop = 5;
            let start = 0;
            let keyboard = AnimeKeyboardBuilder(anime_name, "anime", page, opcount, start, stop)
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
                    // console.log(cbdata);
                if (cbdata.length == 2) {
                    let media = AnimeResults[cbdata[1]].callbackdata.split('-')
                        // console.log(media);
                    let options = AnimeResults[cbdata[1]].loaded;
                    // console.log(options);
                    // console.log(opcount);
                    if (options + 5 > opcount) {
                        console.log("Resource does not exist")
                        ctx.reply("Resource does not exist")
                    } else {
                        console.log("Loading More Options for " + AnimeResults[cbdata[1]].callbackdata)
                        let keydata = AnimeKeyboardBuilder(media[1], media[0], cbdata[0], opcount, options, options + 5)
                        KeyboardSender(reply_message, keydata, ctx);
                    }
                } else {
                    let media = AnimeResults[cbdata[1]].callbackdata.split('-')
                        // console.log(media);
                        // console.log(Results[cbdata[1]].results.results[cbdata[2]]);
                        // ctx.replyWithPhoto(Results[cbdata[1]].results.results[cbdata[2]])
                    Datasender(cbdata, media, ctx);
                    console.log("Data sent for " + media[0] + "-" + media[1]);

                }



            })
        }


        // console.log(Results)

    }
}



// bot.command('movie', async(ctx) => {

//     // console.log(ctx);
//     console.log(`Executing the user command: ${ctx.message.text}`)
//     chatId = ctx.message.chat.id;
//     console.log("Chat ID:" + chatId);
//     let search = ctx.message.text.split(" ");
//     search.shift();
//     movie_name = search.join("").toLowerCase();
//     // console.log(search);
//     if (search.length == 0) {
//         console.log("No Arguments Passed");
//         ctx.reply(`Kindly Follow The Procedure ${ctx.message.chat.first_name}`);
//         ctx.reply("<Usage>: /movie <movie-name>");
//     } else {

//         var returnvalue = await DataRequest(movie_name, page, "movie");
//         // console.log("Returned")
//         // console.log(returnvalue)
//         console.log(returnvalue.results[0].genre_ids)
//         console.log(MovieResults)
//             // console.log(MovieResults.results.results);
//             // console.log(MovieResults.results.results.genre_ids)
//         if (returnvalue.status == 400) {
//             ctx.reply(returnvalue.message + '. Try again Later!');
//         } else {

//             let opcount = returnvalue.results.length;
//             let stop = 5;
//             let start = 0;
//             let keyboard = MovieKeyboardBuilder(movie_name, "movie", page, opcount, start, stop)
//             KeyboardSender(reply_message, keyboard, ctx);
//             // let cbdata = 'anime-fullmetal'
//             // console.log(Results.findIndex(x => x.callbackdata == cbdata));


//             bot.on('callback_query', (cbd) => {
//                 const cbquery = cbd.update.callback_query.data;
//                 // console.log(ctx.update.callback_query);
//                 // console.log(ctx.update);
//                 // console.log(ctx);

//                 console.log("Received Callback Query Data :" + cbquery);
//                 var cbdata = cbquery.split("-");
//                 cbdata = cbdata.map((x) => { return parseInt(x, 10) })
//                     // console.log(cbdata);
//                 if (cbdata.length == 2) {
//                     let media = MovieResults[cbdata[1]].callbackdata.split('-')
//                         // console.log(media);
//                     let options = MovieResults[cbdata[1]].loaded;
//                     // console.log(options);
//                     // console.log(opcount);
//                     if (options + 5 > opcount) {
//                         console.log("Resource does not exist")
//                         ctx.reply("Resource does not exist")
//                     } else {
//                         console.log("Loading More Options for " + MovieResults[cbdata[1]].callbackdata)
//                         let keydata = MovieKeyboardBuilder(media[1], media[0], cbdata[0], opcount, options, options + 5)
//                         KeyboardSender(reply_message, keydata, ctx);
//                     }
//                 } else {
//                     let media = MovieResults[cbdata[1]].callbackdata.split('-')
//                         // console.log(media);
//                         // console.log(Results[cbdata[1]].results.results[cbdata[2]]);
//                         // ctx.replyWithPhoto(Results[cbdata[1]].results.results[cbdata[2]])
//                         // Datasender(cbdata, media, ctx);
//                     console.log("Data sent for " + media[0] + "-" + media[1]);

//                 }



//             })
//         }


//         // console.log(Results)

//     }
// });


bot.launch();
// module.exports = bot;