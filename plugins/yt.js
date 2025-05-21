const { cmd } = require('../command');
const yts = require('yt-search');
const ddownr = require('denethdev-ytmp3');
const fetch = require('node-fetch');
const defaultPreview = 'https://files.catbox.moe/16uz1x.jpg';

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

    const top = searchResults.videos.slice(0, 5);
    let list = "*🍃 ＳＯＮＧ ＲＥＳＵＬＴＳ 🎶*\n\n";
    top.forEach((v, i) => {
      list += `${i + 1}. ${v.title} - ${v.timestamp}\n`;
    });
    list += `\n_Reply with 1-5 to choose your song._\n\n> ʜɪʀᴀɴ ᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

    const sent = await m.sendMessage(from, {
      image: { url: defaultPreview },
      caption: list
    }, { quoted });

    const pick = (m.ev.once ? m.ev.once : m.ev.on);
    pick.call(m.ev, "messages.upsert", async (update) => {
      const msg = update.messages[0];
      if (!msg.message?.extendedTextMessage) return;
      if (msg.message.extendedTextMessage.contextInfo?.stanzaId !== sent.key.id) return;

      const choice = parseInt(msg.message.extendedTextMessage.text.trim());
      if (isNaN(choice) || choice < 1 || choice > 5) return reply("*Invalid option. Choose 1–5*");

      const songData = top[choice - 1];
      const result = await ddownr.download(songData.url, 'mp3');

      const caption = `*🍃 ＳＯＮＧ ＤＯＷＮＬＯＡＤＥＲ 🎶*\n\n` +
        `*☘️ Title:* ${songData.title}\n` +
        `*➥ Views:* ${songData.views}\n` +
        `*➥ Duration:* ${songData.timestamp}\n` +
        `*➥ Uploaded:* ${songData.ago}\n` +
        `*➥ Channel:* ${songData.author.name}\n` +
        `*➥ URL:* ${songData.url}\n\n` +
        `*Choose Format:*\n1 || Audio File 🎶\n2 || Document File 📂\n\n` +
        `> ʜɪʀᴀɴ ᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

      const sent2 = await m.sendMessage(from, {
        image: { url: songData.thumbnail },
        caption
      }, { quoted });

      pick.call(m.ev, "messages.upsert", async (u) => {
        const msg2 = u.messages[0];
        if (!msg2.message?.extendedTextMessage) return;
        if (msg2.message.extendedTextMessage.contextInfo?.stanzaId !== sent2.key.id) return;

        const format = msg2.message.extendedTextMessage.text.trim();
        if (format === "1") {
          await m.sendMessage(from, {
            audio: { url: result.downloadUrl },
            mimetype: "audio/mpeg",
            jpegThumbnail: await (await fetch(songData.thumbnail)).buffer()
          }, { quoted });
        } else if (format === "2") {
          await m.sendMessage(from, {
            document: { url: result.downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `ʜɪʀᴀɴ ꜱᴏɴɢᴅʟ 🎶${songData.title}.mp3`,
            caption: `${songData.title}\n\n> ʜɪʀᴀɴ ᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`,
            jpegThumbnail: await (await fetch(songData.thumbnail)).buffer()
          }, { quoted });
        } else {
          reply("*Invalid Format. Choose 1 or 2 🙄*");
        }
      });
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

    const top = search.videos.slice(0, 5);
    let list = "*🍃 ＶＩＤＥＯ ＲＥＳＵＬＴＳ 🎬*\n\n";
    top.forEach((v, i) => {
      list += `${i + 1}. ${v.title} - ${v.timestamp}\n`;
    });
    list += `\n_Reply with 1–5 to select a video._\n\n> ʜɪʀᴀɴ ᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

    const sent = await m.sendMessage(from, {
      image: { url: defaultPreview },
      caption: list
    }, { quoted });

    const pick = (m.ev.once ? m.ev.once : m.ev.on);
    pick.call(m.ev, "messages.upsert", async (update) => {
      const msg = update.messages[0];
      if (!msg.message?.extendedTextMessage) return;
      if (msg.message.extendedTextMessage.contextInfo?.stanzaId !== sent.key.id) return;

      const choice = parseInt(msg.message.extendedTextMessage.text.trim());
      if (isNaN(choice) || choice < 1 || choice > 5) return reply("*Invalid option. Choose 1–5*");

      const vid = top[choice - 1];
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
        `*Choose Format:*\n1 || Video File 🎥\n2 || Document File 📂\n\n` +
        `> ʜɪʀᴀɴ ᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

      const sent2 = await m.sendMessage(from, {
        image: { url: json.result.thumbnail },
        caption
      }, { quoted });

      pick.call(m.ev, "messages.upsert", async (u) => {
        const msg2 = u.messages[0];
        if (!msg2.message?.extendedTextMessage) return;
        if (msg2.message.extendedTextMessage.contextInfo?.stanzaId !== sent2.key.id) return;

        const format = msg2.message.extendedTextMessage.text.trim();
        if (format === "1") {
          await m.sendMessage(from, {
            video: { url: json.result.download_url },
            mimetype: "video/mp4",
            jpegThumbnail: await (await fetch(json.result.thumbnail)).buffer()
          }, { quoted });
        } else if (format === "2") {
          await m.sendMessage(from, {
            document: { url: json.result.download_url },
            mimetype: "video/mp4",
            fileName: `ʜɪʀᴀɴ ᴠɪᴅᴇᴏᴅʟ 🎬${json.result.title}.mp4`,
            caption: ` ${vid.title}\n\n> ʜɪʀᴀɴ ᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`,
            jpegThumbnail: await (await fetch(json.result.thumbnail)).buffer()
          }, { quoted });
        } else {
          reply("*Invalid Format. Choose 1 or 2 🙄*");
        }
      });
    });

  } catch (err) {
    console.error(err);
    reply("*An Error Occurred While Processing Your Video Request 😔*");
  }
});
