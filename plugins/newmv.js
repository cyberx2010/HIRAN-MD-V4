const axios = require("axios");
const { cmd, commands } = require('../command');
const config = require('../config');
const { fetchJson } = require('../lib/functions');

cmd({
  pattern: "sinhalasub",
  alias: ["ssub"],
  react: "🎬",
  desc: "Search Sinhala Subtitles",
  category: "movie",
  use: `${config.PREFIX || '.'}sinhalasub 2024`,
  filename: __filename
},
async (conn, mek, m, { from, q, reply, prefix, replyMap }) => {
  try {
    if (!q) return reply(`text එකක් දියන් යකූ (e.g. \`${config.PREFIX || '.'}ssub 2024\`)`);

    const res = await fetchJson(`${config.API_URL || 'https://nethu-api-ashy.vercel.app'}/movie/sinhalasub/search?text=${encodeURIComponent(q)}`);

    if (!res.result || !res.result.data || res.result.data.length === 0) {
      return reply(`API call කරන්නෑ. No results found for: ${q}`);
    }

    const items = res.result.data.slice(0, 10);
    let responseText = `*Sinhala Subtitle Search Results for:* ${q}\n\n`;
    items.forEach((item, i) => {
      responseText += `${i + 1}. *${item.title}* (${item.date || 'No date'})\n🔗 Reply with ${i + 1} to select\n\n`;
    });
    responseText += `> Reply with the number of the movie to get details.\n> © Powered by HIRAN MD V4`;

    const sentMessage = await conn.sendMessage(from, {
      text: responseText,
      image: { url: "https://i.ibb.co/1YPWpS3H/9882.jpg" }
    }, { quoted: mek });

    // Use replyMap to handle user replies
    conn.addReplyTracker(sentMessage.key.id, async (m, userReply) => {
      const selectedIndex = parseInt(userReply) - 1;
      if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < items.length) {
        const selectedItem = items[selectedIndex];
        await conn.sendMessage(from, {
          text: `Selected: *${selectedItem.title}*\nProcessing details...`,
          react: { text: '🔎', key: m.key }
        });
        // Trigger sub_search command
        await conn.sendMessage(from, {
          text: `${prefix}sub_search ${selectedItem.link}`
        });
      } else {
        await conn.sendMessage(from, {
          text: `Invalid number. Please reply with a number between 1 and ${items.length}`
        }, { quoted: m });
      }
    });

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

    const res = await fetchJson(`${config.API_URL || 'https://nethu-api-ashy.vercel.app'}/movie/sinhalasub/movie?url=${encodeURIComponent(q)}`);
    const data = res?.result?.data;
    if (!data) return reply("API එක call කරන්න බෑ. No data found.");

    const caption = `
*☘️ 𝗧ɪᴛʟᴇ ➮* _${data.title || "Not Available"}_
*📅 𝗥ᴇʟᴇꜱᴇᴅ ᴅᴀᴛᴇ ➮* _${data.date || "N/A"}_
*🌎 𝗖ᴏᴜɴᴛʀʏ ➮* _${data.country || "N/A"}_
*💃 �_Rᴀᴛɪɴɢ ➮* _${data.tmdbRate || data.imdb || "N/A"}_
*⏰ 𝗥ᴜɴᴛɪᴍᴇ ➮* _${data.runtime || "N/A"}_
*💁‍♂️ 𝗦ᴜʙᴛɪᴛʟᴇ ʙʏ ➮* _${data.subtitle_author || data.subtitle || "N/A"}_
*🎭 𝗚ᴇɴᴀʀᴇꜱ ➮* _${data.category?.join(", ") || data.genre || ".NEW, Action, Drama"}_

🧾 *Description:* 
${data.description || "No description available"}

> ⚜️ 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐝 - HIRAN MD V4 𝐁𝐘 𝐇𝐈𝐑𝐀𝐍𝐘𝐀 𝐒𝐀𝐓𝐇𝐒𝐀𝐑𝐀
`.trim();

    const sections = [];

    if (Array.isArray(data.pixeldrain_dl) && data.pixeldrain_dl.length > 0) {
      const pixeldrainRows = data.pixeldrain_dl.map(item => ({
        title: `${item.quality} (${item.size})`,
        rowId: `${prefix}sub_dl pixeldrain|${item.link}`
      }));
      sections.push({
        title: "📥 PixelDrain",
        rows: pixeldrainRows
      });
    }

    if (Array.isArray(data.ddl_dl) && data.ddl_dl.length > 0) {
      const ddlRows = data.ddl_dl.map(item => ({
        title: `${item.quality} (${item.size})`,
        rowId: `${prefix}sub_dl ddl|${item.link}`
      });
      sections.push({
        title: "📥 DDL",
        rows: ddlRows
      });
    }

    if (sections.length === 0) {
      return reply("No download links available for this movie.");
    }

    await conn.sendMessage(from, {
      text: caption,
      footer: "> © Powered by HIRAN MD V4",
      title: "Download Links",
      buttonText: "`Reply Below Number` 🔢",
      sections,
      image: { url: data.image || "https://i.ibb.co/1YPWpS3H/9882.jpg" }
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
      fileName: `HIRAN-MD-V4-SINHALASUB-${type.toUpperCase()}.mp4`,
      caption: `Downloaded ${type} subtitle file`
    }, { quoted: mek });

  } catch (e) {
    console.error("Error in sub_dl command:", e.message, e.stack);
    await reply(`*Error:* ${e.message || "Failed to download subtitle"}`);
  }
});
