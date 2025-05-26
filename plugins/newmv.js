const config = require('../config')
const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions')
const axios = require('axios');
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { Buffer } = require('buffer'); 
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const fileType = require("file-type")
const l = console.log


cmd({
    pattern: "cine",	
    react: '🔎',
    category: "movie",
	 alias: ["cinesub"],
    desc: "Moive downloader",
    filename: __filename
},
async (conn, m, mek, { from, q, prefix, isMe, reply }) => {
try{
 if(!q) return await reply('*please give me text !..*')
let res = await fetchJson(`https://darksadas-yt-cinezub-search.vercel.app/?query=${q}`)

if (url.length < 1) return await conn.sendMessage(from, { text: N_FOUND }, { quoted: mek } )
var srh = [];  
for (var i = 0; i < res.data.length; i++) {
srh.push({
title: i + 1,
description: res.data[i].title,
rowId: prefix + 'cineinfo ' + res.data[i].link
});
}

const sections = [{
title: "",
rows: srh
}	  
]
const listMessage = {
text: `*╭──[LOKU MD MOVIE DL]*

*Movie Search : ${q} 🔎*`,
footer: config.FOOTER,
title: '_[cinesubz.co results 🎬]_',
buttonText: '*Reply Below Number 🔢,*',
sections
}
await conn.replyList(from, listMessage,mek)
} catch (e) {
    console.log(e)
  await conn.sendMessage(from, { text: '🚩 *Error !!*' }, { quoted: mek } )
}
})

cmd({
    pattern: "cinedl",	
    dontAddCommandList: true,
    react: '🎥',
    desc: "moive downloader",
    filename: __filename
},
async (conn, m, mek, { from, q, isMe, prefix, reply }) => {
try{


     if(!q) return await reply('*please give me url!..*')


let res = await fetchJson(`https://cinesub-info.vercel.app/?url=${q}&apikey=dinithimegana`)


	let cap = `*☘️ Tιтle ➜* *${res.data.title}*

*📆 Rᴇʟᴇᴀꜱᴇ ➜* _${res.data.date}_
*⭐ Rᴀᴛɪɴɢ ➜* _${res.data.imdb}_
*⏰ Rᴜɴᴛɪᴍᴇ ➜* _${res.data.runtime}_
*🌎 Cᴏᴜɴᴛʀʏ ➜* _${res.data.country}_
*💁‍♂️ Dɪʀᴇᴄᴛᴏʀ ➜* _${res.data.subtitle_author}_
`



if (res.length < 1) return await conn.sendMessage(from, { text: 'erro !' }, { quoted: mek } )



const sections = [];

    if (Array.isArray(res.dl_links)) {
      const cinesubzRows = res.dl_links.map(item => ({
        title: `${v.quality} (${v.size})`,
        rowId: `${prefix}cinedl ${res.data.image}±${v.link}±${res.data.title}
	
	*\`${v.quality}\`*`
      }));
      sections.push({
        title: "🎬 Cinesubz",
        rows: cinesubzRows
      });
    }


  
const listMessage = {
 
image: {url: res.data.image.replace("fit=", "")},	
      text: cap,
      footer: config.FOOTER,
      title: "📥 Download Option",
      buttonText: "*Reply Below Number 🔢,",
      sections
}
return await conn.replyList(from, listMessage, mek)
} catch (e) {
    console.log(e)
  await conn.sendMessage(from, { text: '🚩 *Error !!*' }, { quoted: mek } )
}
})
