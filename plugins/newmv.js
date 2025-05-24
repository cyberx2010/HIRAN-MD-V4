const axios = require("axios");
const { cmd, commands } = require('../command');
const config = require('../config');
const { fetchJson } = require('../lib/functions');

cmd({
  pattern: "sinhalasub",
  alias: ["ssub"],
  desc: "Search Sinhala Subtitles",
  category: "movie",
  use: ".sinhalasub 2024",
  filename: __filename
},
async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    if (!q) return reply("text එකක් දියන් යකූ (e.g. `.ssub 2024`)");

    const res = await fetchJson(`https://nethu-api-ashy.vercel.app/movie/sinhalasub/search?text=${encodeURIComponent(q)}`);

    if (!res.result || !res.result.data || res.result.data.length === 0) {
      return reply("API call කරන්නෑ. No results found for: " + q);
    }

    const items = res.result.data.slice(0, 10);

    const sections = [{
      title: "📽️ Search Results",
      rows: items.map((item, i) => ({
        title: item.title,
        rowId: `${prefix}sub_search ${item.link}`,
        description: item.date || "No date available"
      }))
    }];

    const listMessage = {
      text: `*Sinhala Subtitle Search Results for:* ${q}`,
      footer: "> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ԋιɾαɳ ɱԃ ʋ3 🔒🪄",
      title: "Select a Movie",
      buttonText: "📋 Select Movie",
      sections,
      image: { url: "https://i.ibb.co/1YPWpS3H/9882.jpg" }
    };

    await conn.sendMessage(from, listMessage, { quoted: mek });

  } catch (e) {
    console.error("Error in sinhalasub command:", e.message, e.stack);
    await reply(`*Error:* ${e.message || "Unknown error occurred"}`);
  }
});

cmd({
  pattern: "sub_search",
  react: "🔎",
  dontAddCommandList: true,
  filename: __filename
},
async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    if (!q) return reply("Link එක දියන් යකූ!");

    const res = await fetchJson(`https://nethu-api-ashy.vercel.app/movie/sinhalasub/movie?url=${encodeURIComponent(q)}`);
    const movieData = res?.result?.data;
    if (!movieData) return reply("API එක call කරන්න බෑ. No data found.");

    const downloadMessage = `
*☘️ 𝗧ɪᴛʟᴇ ➮* _${movieData.title || "Not Available"}_
*📅 𝗥ᴇʟᴇꜱᴇᴅ ᴅᴀᴛᴇ ➮* _${movieData.date || "N/A"}_
*🌎 𝗖ᴏᴜɴᴛʀʏ ➮* _${movieData.country || "N/A"}_
*💃 𝗥ᴀᴛɪɴɢ ➮* _${movieData.tmdbRate || movieData.imdb || "N/A"}_
*⏰ �_Rᴜɴᴛɪᴍᴇ ➮* _${movieData.runtime || "N/A"}_
*💁‍♂️ 𝗦ᴜʙᴛɪᴛʟᴇ ʙʏ ➮* _${movieData.subtitle_author || movieData.subtitle || "N/A"}_
*🎭 𝗚ᴇɴᴀʀᴇꜱ ➮* _${movieData.category?.join(", ") || movieData.genre || ".NEW, Action, Drama"}_

> ⚜️ 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐝  -  ԋιɾαɳ ɱԃ ʋ3  𝐁𝐘  𝐇𝐈𝐑𝐀𝐍𝐘𝐀  𝐒𝐀𝐓𝐇𝐒𝐀𝐑𝐀  
`.trim();

    const sections = [];

    if (Array.isArray(movieData.pixeldrain_dl) && movieData.pixeldrain_dl.length > 0) {
      const pixeldrainRows = movieData.pixeldrain_dl.map(item => ({
        title: `${item.quality} (${item.size})`,
        rowId: `${prefix}sub_dl pixeldrain|${item.link}`
      }));
      sections.push({
        title: "📥 PixelDrain",
        rows: pixeldrainRows
      });
    }

    if (Array.isArray(movieData.ddl_dl) && movieData.ddl_dl.length > 0) {
      const ddlRows = movieData.ddl_dl.map(item => ({
        title: `${item.quality} (${item.size})`,
        rowId: `${prefix}sub_dl ddl|${item.link}`
      }));
      sections.push({
        title: "📥 DDL",
        rows: ddlRows
      });
    }

    if (sections.length === 0) {
      return reply("No download links available for this movie.");
    }

    await conn.sendMessage(from, {
      text: downloadMessage,
      footer: "> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ԋιɾαɳ ɱԃ ʋ3 🔒🪄",
      title: "Download Links",
      buttonText: "📥 Select Download",
      sections,
      image: { url: movieData.image || "https://i.ibb.co/1YPWpS3H/9882.jpg" }
    }, { quoted: mek });

  } catch (e) {
    console.error("Error in sub_search command:", e.message, e.stack);
    await reply(`*Error:* ${e.message || "Unknown error occurred"}`);
  }
});

cmd({
  pattern: "sub_dl",
  fromMe: false,
  desc: "Downloads the subtitle file from selected quality link",
  type: "download",
  filename: __filename
},
async (conn, mek, m, { q, reply }) => {
  try {
    const [type, link] = q.split("|");
    if (!link) return reply("❌ Link එක දියන් යකූ!");

    await conn.sendMessage(m.chat, {
      document: { url: link },
      mimetype: 'video/mp4',
      fileName: `ԋιɾαɳ-ɱԃ-ʋ3-SINHALASUB-${type.toUpperCase()}.mp4`,
      caption: `Downloaded ${type} subtitle file`
    }, { quoted: mek });

  } catch (e) {
    console.error("Error in sub_dl command:", e.message, e.stack);
    await reply(`*Error:* ${e.message || "Failed to download subtitle"}`);
  }
});
