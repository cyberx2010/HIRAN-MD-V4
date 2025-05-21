const { cmd } = require('../command');
const yts = require('yt-search');
const ddownr = require('denethdev-ytmp3');
const fetch = require('node-fetch');
const defaultPreview = 'https://files.catbox.moe/16uz1x.jpg';

const isYoutubeUrl = (url) => /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url);

cmd({
  pattern: "yt",
  desc: "Download YouTube song or video",
  category: "download",
  react: "🎶",
  filename: __filename
}, async (m, ctx, quoted, { from, reply, q }) => {
  try {
    if (!q) return reply("*Please provide a YouTube URL or search query 🙄*");

    const pick = m.ev.once || m.ev.on;

    const processDownload = async (video) => {
      const resultMp3 = await ddownr.download(video.url, 'mp3');
      const resultMp4Req = await fetch(`https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(video.url)}`);
      const resultMp4 = await resultMp4Req.json();

      if (!resultMp4?.result?.download_url) return reply("*Video download failed.*");

      const caption = `*🍃 ＹＴ ＤＯＷＮＬＯＡＤＥＲ 🎧🎥*\n\n` +
        `*☘️ Title:* ${video.title}\n` +
        `*➥ Views:* ${video.views}\n` +
        `*➥ Duration:* ${video.timestamp}\n` +
        `*➥ Uploaded:* ${video.ago}\n` +
        `*➥ Channel:* ${video.author.name}\n` +
        `*➥ URL:* ${video.url}\n\n` +
        `*Choose Format:*\n` +
        `1 || Audio File 🎶\n2 || Audio Document 📂\n` +
        `3 || Video File 🎥\n4 || Video Document 📂\n\n` +
        `> ʜɪʀᴀɴ ᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

      const msg = await m.sendMessage(from, {
        image: { url: video.thumbnail },
        caption
      }, { quoted });

      pick.call(m.ev, "messages.upsert", async (u) => {
        const msg2 = u.messages[0];
        if (!msg2.message?.extendedTextMessage) return;
        if (msg2.message.extendedTextMessage.contextInfo?.stanzaId !== msg.key.id) return;

        const format = msg2.message.extendedTextMessage.text.trim();

        const thumbBuffer = await (await fetch(video.thumbnail)).buffer();

        if (format === "1") {
          await m.sendMessage(from, {
            audio: { url: resultMp3.downloadUrl },
            mimetype: "audio/mpeg",
            jpegThumbnail: thumbBuffer
          }, { quoted });
        } else if (format === "2") {
          await m.sendMessage(from, {
            document: { url: resultMp3.downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `HiranMD-Audio-${video.title}.mp3`,
            caption: `${video.title}\n\n> ʜɪʀᴀɴ ᴍᴅ`,
            jpegThumbnail: thumbBuffer
          }, { quoted });
        } else if (format === "3") {
          await m.sendMessage(from, {
            video: { url: resultMp4.result.download_url },
            mimetype: "video/mp4",
            jpegThumbnail: thumbBuffer
          }, { quoted });
        } else if (format === "4") {
          await m.sendMessage(from, {
            document: { url: resultMp4.result.download_url },
            mimetype: 'video/mp4',
            fileName: `HiranMD-Video-${video.title}.mp4`,
            caption: `${video.title}\n\n> ʜɪʀᴀɴ ᴍᴅ`,
            jpegThumbnail: thumbBuffer
          }, { quoted });
        } else {
          reply("*Invalid option. Choose 1–4*");
        }
      });
    };

    if (isYoutubeUrl(q)) {
      const search = await yts({ videoId: q.split('v=')[1]?.split('&')[0] || q.split('/').pop() });
      if (!search || !search.title) return reply("*Could not fetch video details.*");
      return await processDownload(search);
    }

    const results = await yts(q);
    if (!results.videos.length) return reply("*No results found.*");

    const top = results.videos.slice(0, 5);
    let list = "*🍃 ＹＴ ＲＥＳＵＬＴＳ 🎧🎥*\n\n";
    top.forEach((v, i) => {
      list += `${i + 1}. ${v.title} - ${v.timestamp}\n`;
    });
    list += `\n_Reply with 1-5 to choose._\n\n> ʜɪʀᴀɴ ᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

    const sent = await m.sendMessage(from, {
      image: { url: defaultPreview },
      caption: list
    }, { quoted });

    pick.call(m.ev, "messages.upsert", async (u) => {
      const msg = u.messages[0];
      if (!msg.message?.extendedTextMessage) return;
      if (msg.message.extendedTextMessage.contextInfo?.stanzaId !== sent.key.id) return;

      const choice = parseInt(msg.message.extendedTextMessage.text.trim());
      if (isNaN(choice) || choice < 1 || choice > 5) return reply("*Invalid choice. Choose 1–5.*");

      await processDownload(top[choice - 1]);
    });

  } catch (err) {
    console.error(err);
    reply("*An error occurred while processing your request 😔*");
  }
});
