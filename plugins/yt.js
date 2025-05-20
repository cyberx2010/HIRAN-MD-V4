const { cmd } = require('../command');
const yts = require('yt-search');
const ddownr = require('denethdev-ytmp3');

const waitForReply = async (messageHandler, from, sentMsgId, isGroup) => {
  return new Promise((resolve) => {
    const handler = async (update) => {
      const msg = update.messages?.[0];
      if (!msg || msg.key.fromMe) return;

      const text = msg.message?.extendedTextMessage?.text?.trim();
      const stanzaId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;

      if (text && stanzaId === sentMsgId) {
        messageHandler.ev.off('messages.upsert', handler);
        resolve(text);
      }
    };

    messageHandler.ev.on('messages.upsert', handler);

    // timeout after 60 seconds
    setTimeout(() => {
      messageHandler.ev.off('messages.upsert', handler);
      resolve(null);
    }, 60000);
  });
};

// ================= SONG =================
cmd({
  pattern: "song",
  desc: "Download YouTube songs",
  category: "download",
  react: '🎧',
  filename: __filename
}, async (m, c, qmsg, { from, reply, q }) => {
  if (!q) return reply("*Please provide a song name or URL.*");

  try {
    const search = await yts(q);
    const result = search.videos?.[0];
    if (!result) return reply("*No results found.*");

    let caption = `*🍃 ＳＯＮＧ ＤＯＷＮＬＯＡＤＥＲ 🎶*\n\n`;
    caption += `*☘️ Title:* ${result.title}\n`;
    caption += `*➥ Views:* ${result.views}\n`;
    caption += `*➥ Duration:* ${result.timestamp}\n`;
    caption += `*➥ Uploaded:* ${result.ago}\n`;
    caption += `*➥ Channel:* ${result.author.name}\n`;
    caption += `*➥ URL:* ${result.url}\n\n`;
    caption += `*Choose Format:*\n1 || Audio 🎶\n2 || Document 📂\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

    const sent = await m.sendMessage(from, {
      image: { url: result.thumbnail },
      caption
    }, { quoted: qmsg });

    const response = await waitForReply(m, from, sent.key.id, from.endsWith('@g.us'));
    if (!response) return reply("*⏱️ Timeout. Please try again.*");

    let dl;
    try {
      dl = await ddownr.download(result.url, 'mp3');
    } catch {
      return reply("*❌ Failed to download this song. Format may be blocked.*");
    }

    if (!dl?.downloadUrl) return reply("*❌ No download link available.*");

    if (response === '1') {
      await m.sendMessage(from, {
        audio: { url: dl.downloadUrl },
        mimetype: 'audio/mpeg'
      }, { quoted: qmsg });
    } else if (response === '2') {
      await m.sendMessage(from, {
        document: { url: dl.downloadUrl },
        mimetype: 'audio/mpeg',
        fileName: `${result.title}.mp3`,
        caption: `ʜɪʀᴀɴᴍᴅ ꜱᴏɴɢ\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
      }, { quoted: qmsg });
    } else {
      reply("*Invalid option. Use 1 or 2 only.*");
    }

  } catch (err) {
    console.error(err);
    reply("*An error occurred while processing your song.*");
  }
});


// ================= VIDEO =================
cmd({
  pattern: "video",
  desc: "Download YouTube videos",
  category: "download",
  react: '🎥',
  filename: __filename
}, async (m, c, qmsg, { from, reply, q }) => {
  if (!q) return reply("*Please provide a video name or URL.*");

  try {
    const search = await yts(q);
    const result = search.videos?.[0];
    if (!result) return reply("*No video results found.*");

    let caption = `*🎥 ＶＩＤＥＯ ＤＯＷＮＬＯＡＤＥＲ 🎬*\n\n`;
    caption += `*🌿 Title:* ${result.title}\n`;
    caption += `*️➥ Views:* ${result.views}\n`;
    caption += `*➥ Duration:* ${result.timestamp}\n`;
    caption += `*➥ Uploaded:* ${result.ago}\n`;
    caption += `*➥ Channel:* ${result.author.name}\n`;
    caption += `*➥ URL:* ${result.url}\n\n`;
    caption += `*Choose Format:*\n1 || Video 🎬\n2 || Document 📁\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

    const sent = await m.sendMessage(from, {
      image: { url: result.thumbnail },
      caption
    }, { quoted: qmsg });

    const response = await waitForReply(m, from, sent.key.id, from.endsWith('@g.us'));
    if (!response) return reply("*⏱️ Timeout. Please try again.*");

    let dl;
    try {
      dl = await ddownr.download(result.url, 'mp4');
    } catch {
      return reply("*❌ Failed to download video. Format not supported.*");
    }

    if (!dl?.downloadUrl) return reply("*❌ No download link available.*");

    if (response === '1') {
      await m.sendMessage(from, {
        video: { url: dl.downloadUrl },
        mimetype: 'video/mp4',
        caption: `🎬 ${result.title}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
      }, { quoted: qmsg });
    } else if (response === '2') {
      await m.sendMessage(from, {
        document: { url: dl.downloadUrl },
        mimetype: 'video/mp4',
        fileName: `${result.title}.mp4`,
        caption: `🎬 ${result.title}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
      }, { quoted: qmsg });
    } else {
      reply("*Invalid option. Use 1 or 2 only.*");
    }

  } catch (err) {
    console.error(err);
    reply("*An error occurred while processing your video.*");
  }
});
