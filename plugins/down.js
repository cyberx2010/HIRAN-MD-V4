const config = require('../config');
const {cmd , commands} = require('../command');
const { fetchJson } = require('../lib/functions')
const axios = require('axios');
const cheerio = require('cheerio');

//------------------------------pron video---------------------------------//

//09 xnxx downloader
let session = {};

async function xnxxs(query) {
    return new Promise((resolve, reject) => {
        const baseurl = 'https://www.xnxx.com';
        axios.get(`${baseurl}/search/${query}/${Math.floor(Math.random() * 3) + 1}`)
            .then((res) => {
                const $ = cheerio.load(res.data);
                const title = [];
                const url = [];
                const desc = [];
                const results = [];
                
                $('div.mozaique').each(function(a, b) {
                    $(b).find('div.thumb').each(function(c, d) {
                        url.push(baseurl + $(d).find('a').attr('href').replace('/THUMBNUM/', '/'));
                    });
                });

                $('div.mozaique').each(function(a, b) {
                    $(b).find('div.thumb-under').each(function(c, d) {
                        desc.push($(d).find('p.metadata').text());
                        $(d).find('a').each(function(e, f) {
                            title.push($(f).attr('title'));
                        });
                    });
                });

                // Prepare results
                for (let i = 0; i < title.length; i++) {
                    results.push({ title: title[i], info: desc[i], link: url[i] });
                }
                resolve({ status: true, result: results });
            }).catch((err) => {
                console.error(err);
                reject({ status: false, result: err });
            });
    });
}

cmd({
    pattern: "xnxx",
    alias: ["xnxxdl"],
    use: '.xnxx <query>',
    react: "🔞",
    desc: "xn",
    category: "download",
    filename: __filename
}, async (messageHandler, context, quotedMessage, { from, q, reply }) => {
    try {
        if (!q) return reply('⭕ *Please Provide Search Terms.*');

        let res = await xnxxs(q);
        const data = res.result;
       
        const limitedData = data.slice(0, 10);
        if (limitedData.length < 1) 
            
return await messageHandler.sendMessage(from, {
            text: "⭕ *I Couldn't Find Anything 🙄*" 
        }, { quoted: quotedMessage });

        let message = `*🔞 𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 𝐗𝐍𝐗𝐗 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑 🔞*\n\n`;
        let options = ""; 

        limitedData.forEach((v, index) => {
            options += `${index + 1}. *${v.title}*\n\n`;
        });

        message += options;
        message += `\n\n> ⚜️ _ʀᴇᴄᴏᴅᴇᴅ ʙʏ_ *- :* *_𝐇𝐢𝐫𝐚𝐧𝐲𝐚_𝐒𝐚𝐭𝐡𝐬𝐚𝐫𝐚*`;

        const sentMessage = await messageHandler.sendMessage(from, {
            image: { url: `https://files.catbox.moe/lacqi4.jpg` },
            caption: message,          
        }, { quoted: quotedMessage });

        session[from] = {
            searchResults: limitedData,
            messageId: sentMessage.key.id, 
        };

        const handleUserReply = async (update) => {
            const userMessage = update.messages[0];

            if (!userMessage.message.extendedTextMessage ||
                userMessage.message.extendedTextMessage.contextInfo.stanzaId !== sentMessage.key.id) {
                return;
            }

            const userReply = userMessage.message.extendedTextMessage.text.trim();
            const videoIndexes = userReply.split(',').map(x => parseInt(x.trim()) - 1); // Convert reply to an array of indexes

            for (let index of videoIndexes) {
                if (isNaN(index) || index < 0 || index >= limitedData.length) {
                    return reply("⭕ *Please Enter Valid Numbers From The List.*");
                }
            }

            for (let index of videoIndexes) {
                const selectedVideo = limitedData[index];

                try {
                    let downloadRes = await fetchJson(`https://raganork-network.vercel.app/api/xvideos/download?url=${selectedVideo.link}`);
                    let videoUrl = downloadRes.url;

                    if (!videoUrl) {
                        return reply(`⛔ *Failed To Fetch Video* For "${selectedVideo.title}".`);
                    }

                    await messageHandler.sendMessage(from, {
                        video: { url: videoUrl },
                        caption: `${selectedVideo.title}\n\n> 𝐓𝐇𝐀𝐓𝐒 𝐁𝐑𝐎𝐔𝐆𝐇𝐓 𝐅𝐎𝐑 𝐘𝐎𝐔 𝐁𝐘 𝐇𝐈𝐑𝐀𝐍 𝐌𝐃`,
               }, { quoted: quotedMessage });         

                } catch (err) {
                    console.error(err);
                    return reply(`⛔ *An Error Occurred While Downloading "${selectedVideo.title}".*`);
                }
            }

            delete session[from];
        };

        messageHandler.ev.on("messages.upsert", handleUserReply);

    } catch (error) {
        console.error(error);
        await messageHandler.sendMessage(from, { text: '⛔ *Error Occurred During The Process!*' }, { quoted: quotedMessage });
    }
});

//------------------- Xvideo --------------------//
// 11.xvideo downloader
cmd({
    pattern: "xvid",
    alias: ["xvideo"],
    use: '.xvid <query>',
    react: "🔞",
    desc: "xv",
    category: "download",
    filename: __filename
}, async (messageHandler, context, quotedMessage, { from, q, reply }) => {
    try {
        if (!q) return reply('⭕ *Please Provide Search Terms.*');

        let res = await fetchJson(`https://raganork-network.vercel.app/api/xvideos/search?query=${q}`);
        
        if (!res || !res.result || res.result.length === 0) return reply(N_FOUND);

        const data = res.result.slice(0, 10);
        
        if (data.length < 1) return await messageHandler.sendMessage(from, { text: "⭕ *I Couldn't Find Anything 🙄*" }, { quoted: quotedMessage });

        let message = `*🔞 𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 𝐗𝐕𝐈𝐃𝐄𝐎 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑 🔞*\n\n`;
        let options = '';

        data.forEach((v, index) => {
            options += `${index + 1}. *${v.title}*\n\n`;
        });
        
        message += options;
        message += `\n\n> ⚜️ _ʀᴇᴄᴏᴅᴇᴅ ʙʏ_ *- :* *_𝐇𝐢𝐫𝐚𝐧𝐲𝐚_𝐒𝐚𝐭𝐡𝐬𝐚𝐫𝐚*`;

        const sentMessage = await messageHandler.sendMessage(from, {
            image: { url: `https://files.catbox.moe/lacqi4.jpg` },
            caption: message
        }, { quoted: quotedMessage });

        session[from] = {
            searchResults: data,
            messageId: sentMessage.key.id,
        };

        const handleUserReply = async (update) => {
            const userMessage = update.messages[0];

            if (!userMessage.message.extendedTextMessage ||
                userMessage.message.extendedTextMessage.contextInfo.stanzaId !== sentMessage.key.id) {
                return;
            }

            const userReply = userMessage.message.extendedTextMessage.text.trim();
            const videoIndexes = userReply.split(',').map(x => parseInt(x.trim()) - 1);

            for (let index of videoIndexes) {
                if (isNaN(index) || index < 0 || index >= data.length) {
                    return reply("⭕ *Please Enter Valid Numbers From The List.*");
                }
            }

            for (let index of videoIndexes) {
                const selectedVideo = data[index];

                try {
                    let downloadRes = await fetchJson(`https://raganork-network.vercel.app/api/xvideos/download?url=${selectedVideo.url}`);
                    let videoUrl = downloadRes.url;

                    if (!videoUrl) {
                        return reply(`⭕ *Failed To Fetch Video* for "${selectedVideo.title}".`);
                    }

                    await messageHandler.sendMessage(from, {
                        video: { url: videoUrl },
                        caption: `${selectedVideo.title}\n\n> ⚜️ _𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐝_ *- :* *_SL NETHU MAX_ ᵀᴹ*`
                    });

                } catch (err) {
                    console.error(err);
                    return reply(`⭕ *An Error Occurred While Downloading "${selectedVideo.title}".*`);
                }
            }

            delete session[from];
        };

        messageHandler.ev.on("messages.upsert", handleUserReply);

    } catch (error) {
        console.error(error);
        await messageHandler.sendMessage(from, { text: '⭕ *Error Occurred During The Process!*' }, { quoted: quotedMessage });
    }
});

/*cmd({
    pattern: "xvideo",
    alias: ["xvid"],
    use: '.xvideo <query>',
    react: "🔞",
    desc: "Search and DOWNLOAD VIDEOS from xvideos.",
    category: "search",
    filename: __filename
}, async (message, { from, q, reply }) => {
    try {
        if (!q) return reply('⭕ *Please Provide Search Terms.*');

        let res = await fetchJson(`https://raganork-network.vercel.app/api/xvideos/search?query=${q}`);
        
        if (!res || !res.result || res.result.length === 0) return reply('⭕ *No results found or API error.*');

        const data = res.result.slice(0, 10);
        if (data.length < 1) return await message.sendMessage(from, { text: "⭕ *I Couldn't Find Anything 🙄*" });

        let messageText = `*🔞 QUEEN NETHU MD XVIDEO DOWNLOADER 🔞* "${q}"\n\n`;
        let options = '';

        data.forEach((v, index) => {
            options += `${index + 1}. *${v.title}*\n\n`;
        });

        const buttons = [
            { buttonId: '.xv ' + data[0].url, buttonText: { displayText: 'DOWNLOAD XVIDEO 🔞' }, type: 1 }
        ];

        const buttonMessage = {
            image: { url: "https://i.ibb.co/ntvzPr8/s-Wuxk4b-KHr.jpg" },
            caption: messageText,
            footer: config.FOOTER,
            buttons: buttons,
            headerType: 4
        };

        await message.buttonMessage(from, buttonMessage);

    } catch (e) {
        reply('*ERROR*');
        console.log(e);
    }
});*/

// Xvideo Downloader
cmd({
    pattern: "xv",
    alias: ["dlxv", "xvdl"],
    react: '🔞',
    desc: "xvu",
    category: "download",
    use: '.xv <xvideos link>',
    filename: __filename
},
async (conn, mek, m, { from, q, quoted, reply }) => {
    try {
        if (!q) return reply(urlneed);

        let xv_info = await fetchJson(`https://www.dark-yasiya-api.site/download/xvideo?url=${q}`);
        if (!xv_info.result) return reply('*Error retrieving video details!!*');

        const msg = `*🔞 QUEEN NETHU XVIDEO DOWNLOADER 🔞*
     
☘️ *Title:* ${xv_info.result.title}
📈 *Views:* ${xv_info.result.views}
👍 *Like:* ${xv_info.result.like}
👎 *Dislike:* ${xv_info.result.deslike}
🏷️ *Size:* ${xv_info.result.size}`;

        await conn.sendMessage(from, {
            video: { url: xv_info.result.dl_link },
            caption: msg,
        }, { quoted: mek });

    } catch (e) {
        reply('*ERROR*');
        console.log(e);
    }
});
