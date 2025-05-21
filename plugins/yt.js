const { cmd } = require('../command');
const yts = require('yt-search');
const ddownr = require('denethdev-ytmp3');
const fetch = require('node-fetch');

const defaultPreview = 'https://files.catbox.moe/16uz1x.jpg';

// SONG COMMAND
cmd({
  pattern: "song",
  desc: "Download songs.",
  category: "download",
  react: '🎧',
  filename: __filename
}, async (m, ctx, quoted, { from, reply, q }) => {
  try {
    if (!q) return reply("Please Provide A Song Name or Url 🙄");

    const isYTLink = q.includes("youtube.com") || q.includes("youtu.be");
    let songData;

    if (isYTLink) {
      const id = q.split("v=")[1]?.split("&")[0] || q.split("/").pop();
      const search = await yts({ videoId: id });
      songData = search.videos[0];
    } else {
      const searchResults = await yts(q);
      if (!searchResults || searchResults.videos.length === 0)
        return reply("*No Song Found Matching Your Query 🧐*");

      const top = searchResults.videos.slice(0, 5);
      let list = "*🍃 ＳＯＮＧ ＲＥＳＵＬＴＳ 🎶*\n\n";
      top.forEach((v, i) => {
        list += `${i + 1}. ${v.title} - ${v.timestamp}\n`;
      });
      list += `\n_Reply with 1-5 to choose your song._\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

      const sent = await m.sendMessage(from, {
        image: { url: defaultPreview },
        caption: list
      }, { quoted });

      const pick = m.ev.once || m.ev.on;
      return pick.call(m.ev, "messages.upsert", async (update) => {
        const msg = update.messages[0];
        if (!msg.message?.extendedTextMessage) return;
        if (msg.message.extendedTextMessage.contextInfo?.stanzaId !== sent.key.id) return;

        const choice = parseInt(msg.message.extendedTextMessage.text.trim());
        if (isNaN(choice) || choice < 1 || choice > 5) return reply("*Invalid option. Choose 1–5*");

        songData = top[choice - 1];
        sendSong(songData);
      });
    }

    if (songData) sendSong(songData);

    async function sendSong(data) {
      const result = await ddownr.download(data.url, 'mp3');

      const caption = `*🍃 ＳＯＮＧ ＤＯＷＮＬＯＡＤＥＲ 🎶*\n\n` +
        `*☘️ Title:* ${data.title}\n` +
        `*➥ Views:* ${data.views}\n` +
        `*➥ Duration:* ${data.timestamp}\n` +
        `*➥ Uploaded:* ${data.ago}\n` +
        `*➥ Channel:* ${data.author.name}\n` +
        `*➥ URL:* ${data.url}\n\n` +
        `*Choose Format:*\n1 || Audio File 🎶\n2 || Document File 📂\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

      const sent2 = await m.sendMessage(from, {
        image: { url: data.thumbnail },
        caption
      }, { quoted });

      const pick = m.ev.once || m.ev.on;
      pick.call(m.ev, "messages.upsert", async (u) => {
        const msg2 = u.messages[0];
        if (!msg2.message?.extendedTextMessage) return;
        if (msg2.message.extendedTextMessage.contextInfo?.stanzaId !== sent2.key.id) return;

        const format = msg2.message.extendedTextMessage.text.trim();
        const thumb = await (await fetch(data.thumbnail)).buffer();

        if (format === "1") {
          await m.sendMessage(from, {
            audio: { url: result.downloadUrl },
            mimetype: "audio/mpeg",
            jpegThumbnail: thumb
          }, { quoted });
        } else if (format === "2") {
          await m.sendMessage(from, {
            document: { url: result.downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `ʜɪʀᴀɴ ꜱᴏɴɢᴅʟ 🎶${data.title}.mp3`,
            caption: `${data.title}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`,
            jpegThumbnail: thumb
          }, { quoted });
        } else {
          reply("*Invalid Format. Choose 1 or 2 🙄*");
        }
      });
    }
  } catch (err) {
    console.error(err);
    reply("An Error Occurred While Processing Your Song Request 😔");
  }
});

// VIDEO COMMAND
cmd({
  pattern: "video",
  alias: ["mp4", "ytv"],
  react: "🎥",
  desc: "Download YouTube video",
  category: "download",
  filename: __filename
}, async (m, ctx, quoted, { from, reply, q }) => {
  try {
    if (!q) return reply("Please provide a YouTube URL or video name 🙄");

    const isYTLink = q.includes("youtube.com") || q.includes("youtu.be");
    let vid;

    if (isYTLink) {
      const id = q.split("v=")[1]?.split("&")[0] || q.split("/").pop();
      const search = await yts({ videoId: id });
      vid = search.videos[0];
    } else {
      const search = await yts(q);
      if (!search.videos.length) return reply("*No video found matching your query 🧐*");

      const top = search.videos.slice(0, 5);
      let list = "*🍃 ＶＩＤＥＯ ＲＥＳＵＬＴＳ 🎬*\n\n";
      top.forEach((v, i) => {
        list += `${i + 1}. ${v.title} - ${v.timestamp}\n`;
      });
      list += `\n_Reply with 1–5 to select a video._\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

      const sent = await m.sendMessage(from, {
        image: { url: defaultPreview },
        caption: list
      }, { quoted });

      const pick = m.ev.once || m.ev.on;
      return pick.call(m.ev, "messages.upsert", async (update) => {
        const msg = update.messages[0];
        if (!msg.message?.extendedTextMessage) return;
        if (msg.message.extendedTextMessage.contextInfo?.stanzaId !== sent.key.id) return;

        const choice = parseInt(msg.message.extendedTextMessage.text.trim());
        if (isNaN(choice) || choice < 1 || choice > 5) return reply("*Invalid option. Choose 1–5*");

        vid = top[choice - 1];
        sendVideo(vid);
      });
    }

    if (vid) sendVideo(vid);

    async function sendVideo(video) {
      const res = await fetch(`https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(video.url)}`);
      const json = await res.json();

      if (!json.result || !json.result.download_url) return reply("*Failed to fetch video. Try again later 😔*");

      const caption = `*🍃 ＶＩＤＥＯ ＤＯＷＮＬＯＡＤＥＲ 🎬*\n\n` +
        `*☘️ Title:* ${video.title}\n` +
        `*➥ Views:* ${video.views}\n` +
        `*➥ Duration:* ${video.timestamp}\n` +
        `*➥ Uploaded:* ${video.ago}\n` +
        `*➥ Channel:* ${video.author.name}\n` +
        `*➥ URL:* ${video.url}\n\n` +
        `*Choose Quality:*\n1 || 360p\n2 || 480p\n3 || 720p\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

      const sent2 = await m.sendMessage(from, {
        image: { url: json.result.thumbnail },
        caption
      }, { quoted });

      const pick = m.ev.once || m.ev.on;
      pick.call(m.ev, "messages.upsert", async (u) => {
        const msg2 = u.messages[0];
        if (!msg2.message?.extendedTextMessage) return;
        if (msg2.message.extendedTextMessage.contextInfo?.stanzaId !== sent2.key.id) return;

        const format = msg2.message.extendedTextMessage.text.trim();
        const qualities = {
          '1': json.result.sd,
          '2': json.result.hd,
          '3': json.result.fullhd
        };
        const link = qualities[format];
        if (!link) return reply("*Invalid choice. Choose 1, 2, or 3*");

        const caption2 = `*Choose Send Type:*\n1 || Send as Video 🎥\n2 || Send as Document 📂`;
        const sent3 = await m.sendMessage(from, { text: caption2 }, { quoted });

        pick.call(m.ev, "messages.upsert", async (u2) => {
          const msg3 = u2.messages[0];
          if (!msg3.message?.extendedTextMessage) return;
          if (msg3.message.extendedTextMessage.contextInfo?.stanzaId !== sent3.key.id) return;

          const option = msg3.message.extendedTextMessage.text.trim();
          const thumb = await (await fetch(json.result.thumbnail)).buffer();
          const fileName = `ʜɪʀᴀɴ ᴠɪᴅᴇᴏᴅʟ 🎬${video.title}.mp4`;

          if (option === "1") {
            await m.sendMessage(from, {
              video: { url: link },
              mimetype: "video/mp4",
              jpegThumbnail: thumb
            }, { quoted });
          } else if (option === "2") {
            await m.sendMessage(from, {
              document: { url: link },
              mimetype: "video/mp4",
              fileName,
              caption: `${video.title}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`,
              jpegThumbnail: thumb
            }, { quoted });
          } else {
            reply("*Invalid Format. Choose 1 or 2 🙄*");
          }
        });
      });
    }
  } catch (err) {
    console.error(err);
    reply("An Error Occurred While Processing Your Video Request 😔");
  }
});
