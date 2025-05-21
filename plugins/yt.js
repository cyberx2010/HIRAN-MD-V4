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
    if (!q) return reply("*Please Provide A Song Name or YouTube Link 🙄*");

    let songData;
    if (q.includes("youtube.com") || q.includes("youtu.be")) {
      const search = await yts({ videoId: q.split("v=")[1] || q.split("/").pop() });
      songData = search.videos[0];
    } else {
      const search = await yts(q);
      if (!search.videos.length) return reply("*No Song Found Matching Your Query 🧐*");
      songData = search.videos[0];
    }

    const result = await ddownr.download(songData.url, 'mp3');

    const caption = `*🍃 ＳＯＮＧ ＤＯＷＮＬＯＡＤＥＲ 🎶*\n\n` +
      `*☘️ Title:* ${songData.title}\n` +
      `*➥ Views:* ${songData.views}\n` +
      `*➥ Duration:* ${songData.timestamp}\n` +
      `*➥ Uploaded:* ${songData.ago}\n` +
      `*➥ Channel:* ${songData.author.name}\n` +
      `*➥ URL:* ${songData.url}\n\n` +
      `*Choose Format:*\n1 || Audio File 🎶\n2 || Document File 📂\n\n> ʜɪʀᴀɴ ᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

    const sent = await m.sendMessage(from, {
      image: { url: songData.thumbnail },
      caption
    }, { quoted });

    const pick = m.ev.once ? m.ev.once : m.ev.on;
    pick.call(m.ev, "messages.upsert", async (update) => {
      const msg = update.messages[0];
      if (!msg.message?.extendedTextMessage) return;
      if (msg.message.extendedTextMessage.contextInfo?.stanzaId !== sent.key.id) return;

      const format = msg.message.extendedTextMessage.text.trim();
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
          fileName: `ʜɪʀᴀɴ ꜱᴏɴɢᴅʟ 🎶 ${songData.title}.mp3`,
          caption: `${songData.title}\n\n> ʜɪʀᴀɴ ᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`,
          jpegThumbnail: await (await fetch(songData.thumbnail)).buffer()
        }, { quoted });
      } else {
        reply("*Invalid Format. Choose 1 or 2 🙄*");
      }
    });

  } catch (err) {
    console.error(err);
    reply("*An Error Occurred While Processing Your Song Request 😔*");
  }
});

////______________________________________VIDEO____________

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

    let videoData;
    if (q.includes("youtube.com") || q.includes("youtu.be")) {
      const search = await yts({ videoId: q.split("v=")[1] || q.split("/").pop() });
      videoData = search.videos[0];
    } else {
      const search = await yts(q);
      if (!search.videos.length) return reply("*No Video Found Matching Your Query 🧐*");
      videoData = search.videos[0];
    }

    const api = `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(videoData.url)}`;
    const res = await fetch(api);
    const json = await res.json();

    if (json.status !== 200 || !json.success || !json.result.download_url)
      return reply("*Failed to fetch video. Try again later 😔*");

    const caption = `*🍃 ＶＩＤＥＯ ＤＯＷＮＬＯＡＤＥＲ 🎬*\n\n` +
      `*☘️ Title:* ${videoData.title}\n` +
      `*➥ Views:* ${videoData.views}\n` +
      `*➥ Duration:* ${videoData.timestamp}\n` +
      `*➥ Uploaded:* ${videoData.ago}\n` +
      `*➥ Channel:* ${videoData.author.name}\n` +
      `*➥ URL:* ${videoData.url}\n\n` +
      `*Choose Format:*\n1 || Video File 🎥\n2 || Document File 📂\n\n> ʜɪʀᴀɴ ᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

    const sent = await m.sendMessage(from, {
      image: { url: json.result.thumbnail },
      caption
    }, { quoted });

    const pick = m.ev.once ? m.ev.once : m.ev.on;
    pick.call(m.ev, "messages.upsert", async (update) => {
      const msg = update.messages[0];
      if (!msg.message?.extendedTextMessage) return;
      if (msg.message.extendedTextMessage.contextInfo?.stanzaId !== sent.key.id) return;

      const format = msg.message.extendedTextMessage.text.trim();
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
          fileName: `ʜɪʀᴀɴ ᴠɪᴅᴇᴏᴅʟ 🎬 ${json.result.title}.mp4`,
          caption: `${videoData.title}\n\n> ʜɪʀᴀɴ ᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`,
          jpegThumbnail: await (await fetch(json.result.thumbnail)).buffer()
        }, { quoted });
      } else {
        reply("*Invalid Format. Choose 1 or 2 🙄*");
      }
    });

  } catch (err) {
    console.error(err);
    reply("*An Error Occurred While Processing Your Video Request 😔*");
  }
});
