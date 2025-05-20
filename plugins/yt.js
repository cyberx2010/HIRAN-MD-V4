const { cmd } = require('../command');
const yts = require('yt-search');
const ddownr = require('denethdev-ytmp3');
const fetch = require('node-fetch');

cmd({
  pattern: "song",
  desc: "Download songs.",
  category: "download",
  react: '🎧',
  filename: __filename
}, async (m, ctx, quoted, { from, reply, q }) => {
  try {
    if (!q) return reply("*Please Provide A Song Name or Url 🙄*");

    const searchResults = await yts(q);
    if (!searchResults || searchResults.videos.length === 0)
      return reply("*No Song Found Matching Your Query 🧐*");

    const songData = searchResults.videos[0];
    const result = await ddownr.download(songData.url, 'mp3');

    const caption = `*🍃 ＳＯＮＧ ＤＯＷＮＬＯＡＤＥＲ 🎶*\n\n` +
      `*☘️ Title:* ${songData.title}\n` +
      `*➥ Views:* ${songData.views}\n` +
      `*➥ Duration:* ${songData.timestamp}\n` +
      `*➥ Uploaded:* ${songData.ago}\n` +
      `*➥ Channel:* ${songData.author.name}\n` +
      `*➥ URL:* ${songData.url}\n\n` +
      `*Choose Your Download Format:*\n\n` +
      `1 || Audio File 🎶\n` +
      `2 || Document File 📂\n\n` +
      `> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

    const sent = await m.sendMessage(from, {
      image: { url: songData.thumbnail },
      caption
    }, { quoted });

    m.ev.on("messages.upsert", async (update) => {
      const msg = update.messages[0];
      if (!msg.message?.extendedTextMessage) return;
      if (msg.message.extendedTextMessage.contextInfo?.stanzaId !== sent.key.id) return;

      const text = msg.message.extendedTextMessage.text.trim();
      if (text === "1") {
        await m.sendMessage(from, {
          audio: { url: result.downloadUrl },
          mimetype: "audio/mpeg"
        }, { quoted });
      } else if (text === "2") {
        await m.sendMessage(from, {
          document: { url: result.downloadUrl },
          mimetype: 'audio/mpeg',
          fileName: `${songData.title}.mp3`,
          caption: `ʜɪʀᴀɴᴍᴅ ꜱᴏɴɢ ${songData.title}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
        }, { quoted });
      } else {
        reply("*Invalid Option. Please Select 1 or 2 🙄*");
      }
    });
  } catch (err) {
    console.error(err);
    reply("*An Error Occurred While Processing Your Song Request 😔*");
  }
});

cmd({
  pattern: "video",
  alias: ["mp4", "ytv"],
  react: "🎥",
  desc: "Download YouTube video",
  category: "download",
  filename: __filename
}, async (m, ctx, quoted, { from, reply, q }) => {
  try {
    if (!q) return reply("*Please provide a YouTube URL or video name 🙄*");

    const search = await yts(q);
    if (!search.videos.length) return reply("*No video found matching your query 🧐*");

    const vid = search.videos[0];
    const api = `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(vid.url)}`;
    const res = await fetch(api);
    const json = await res.json();

    if (json.status !== 200 || !json.success || !json.result.download_url)
      return reply("*Failed to fetch video. Try again later 😔*");

    const caption = `*🍃 ＶＩＤＥＯ ＤＯＷＮＬＯＡＤＥＲ 🎬*\n\n` +
      `*☘️ Title:* ${vid.title}\n` +
      `*➥ Views:* ${vid.views}\n` +
      `*➥ Duration:* ${vid.timestamp}\n` +
      `*➥ Uploaded:* ${vid.ago}\n` +
      `*➥ Channel:* ${vid.author.name}\n` +
      `*➥ URL:* ${vid.url}\n\n` +
      `*Choose Your Download Format:*\n\n` +
      `1 || Video File 🎥\n` +
      `2 || Document File 📂\n\n` +
      `> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

    const sent = await m.sendMessage(from, {
      image: { url: json.result.thumbnail },
      caption
    }, { quoted });

    m.ev.on("messages.upsert", async (update) => {
      const msg = update.messages[0];
      if (!msg.message?.extendedTextMessage) return;
      if (msg.message.extendedTextMessage.contextInfo?.stanzaId !== sent.key.id) return;

      const text = msg.message.extendedTextMessage.text.trim();
      if (text === "1") {
        await m.sendMessage(from, {
          video: { url: json.result.download_url },
          mimetype: "video/mp4"
        }, { quoted });
      } else if (text === "2") {
        await m.sendMessage(from, {
          document: { url: json.result.download_url },
          mimetype: "video/mp4",
          fileName: `${json.result.title}.mp4`,
          caption: `ʜɪʀᴀɴᴍᴅ ᴠɪᴅᴇᴏ ${vid.title}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
        }, { quoted });
      } else {
        reply("*Invalid Option. Please Select 1 or 2 🙄*");
      }
    });
  } catch (err) {
    console.error(err);
    reply("*An Error Occurred While Processing Your Video Request 😔*");
  }
});
