const { fetchJson } = require('../lib/functions');
const { downloadTiktok } = require('@mrnima/tiktok-downloader');
const { facebook } = require('@mrnima/facebook-downloader');
const { igdl } = require('ruhend-scraper');
const axios = require('axios');
const cheerio = require('cheerio');
const { cmd, commands } = require('../command');

// Common context info for messages
const contextInfo = {
  mentionedJid: ['94768698018@s.whatsapp.net'],
  groupMentions: [],
  forwardingScore: 1,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: '120363192254044294@newsletter',
    newsletterName: '𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 𝐕4 💚',
    serverMessageId: 999
  },
  externalAdReply: {
    title: '𝐇𝐈𝐑𝐀𝐍 𝐌𝐃',
    body: 'ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ',
    mediaType: 1,
    sourceUrl: 'https://files.catbox.moe/cdkii2.jpg',
    thumbnailUrl: 'https://files.catbox.moe/kzemf5.jpg',
    renderLargerThumbnail: true,
    showAdAttribution: true
  }
};

// Helper function to send media
async function sendMedia(client, chat, type, url, caption, mimetype, fileName, quoted) {
  const message = { [type]: { url }, caption, contextInfo };
  if (mimetype) message.mimetype = mimetype;
  if (fileName) message.fileName = fileName;
  if (type === 'audio' && mimetype === 'audio/mp4') message.ptt = true;
  return await client.sendMessage(chat, message, { quoted });
}

// TikTok Downloader
cmd({
  pattern: 'tiktok',
  alias: ['tt'],
  react: '🎥',
  desc: 'Download TikTok videos or audio',
  category: 'download',
  filename: __filename
}, async (client, message, context, { from, quoted, args, q, reply }) => {
  try {
    if (!q || !q.startsWith('https://')) return reply('❌ Please provide a valid TikTok URL!');
    await client.sendMessage(from, { react: { text: '⬇️', key: message.key } });

    const data = await downloadTiktok(q);
    const caption = `
🌟 *Hiran-MD TikTok Downloader* 🌟
══════════════════════════════
🎬 *Title*: ${data.result.title}
══════════════════════════════
🔢 *Reply with a number to download:*
📹 *Video Download*
  1.1  ┃  SD Quality
  1.2  ┃  HD Quality
🎧 *Audio Download*
  2.1  ┃  Audio
  2.2  ┃  Document
  2.3  ┃  Voice
══════════════════════════════
✨ *Hiran-MD* ✨
    `;
    const msg = await client.sendMessage(from, { image: { url: data.result.image }, caption, contextInfo }, { quoted });
    const msgId = msg.key.id;

    client.ev.on('messages.upsert', async ({ messages }) => {
      const msg = messages[0];
      if (!msg.message) return;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
      const chat = msg.key.remoteJid;
      const isReply = msg.message.extendedTextMessage?.contextInfo.stanzaId === msgId;
      if (isReply) {
        await client.sendMessage(chat, { react: { text: '⬇️', key: msg.key } });
        const result = data.result;
        await client.sendMessage(chat, { react: { text: '⬆️', key: msg.key } });

        if (text === '1.1') {
          await sendMedia(client, chat, 'video', result.download_mp4_1, '🎥 *SD Video* | © Hiran-MD', 'video/mp4', null, msg);
        } else if (text === '1.2') {
          await sendMedia(client, chat, 'video', result.download_mp4_2, '🎥 *HD Video* | © Hiran-MD', 'video/mp4', null, msg);
        } else if (text === '2.1') {
          await sendMedia(client, chat, 'audio', result.download_mp3, null, 'audio/mpeg', null, msg);
        } else if (text === '2.2') {
          await sendMedia(client, chat, 'document', result.download_mp3, '📄 *Audio Document* | © Hiran-MD', 'audio/mpeg', 'ʜɪʀᴀɴ-ᴍᴅ/FBDL.mp3', msg);
        } else if (text === '2.3') {
          await sendMedia(client, chat, 'audio', result.download_mp3, null, 'audio/mp4', null, msg);
        }
      }
    });
  } catch (error) {
    console.error('TikTok Error:', error);
    reply(`❌ An error occurred: ${error.message}`);
  }
});

// Facebook Downloader
cmd({
  pattern: 'fb',
  alias: ['facebook'],
  desc: 'Download Facebook videos or audio',
  category: 'download',
  filename: __filename
}, async (client, message, context, { from, quoted, args, q, reply }) => {
  try {
    if (!q || !q.startsWith('https://')) return reply('❌ Please provide a valid Facebook URL!');
    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

    const data = await facebook(q);
    const caption = `
🌟 *Hiran-MD Facebook Downloader* 🌟
══════════════════════════════
⏱ *Duration*: ${data.result.duration}
══════════════════════════════
🔢 *Reply with a number to download:*
📹 *Video Download*
  1.1  ┃  SD Quality
  1.2  ┃  HD Quality
🎧 *Audio Download*
  2.1  ┃  Audio
  2.2  ┃  Document
  2.3  ┃  Voice
══════════════════════════════
✨ *Hiran-MD* ✨
    `;
    const msg = await client.sendMessage(from, { image: { url: data.result.thumbnail }, caption, contextInfo }, { quoted });
    const msgId = msg.key.id;

    client.ev.on('messages.upsert', async ({ messages }) => {
      const msg = messages[0];
      if (!msg.message) return;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
      const chat = msg.key.remoteJid;
      const isReply = msg.message.extendedTextMessage?.contextInfo.stanzaId === msgId;
      if (isReply) {
        await client.sendMessage(chat, { react: { text: '⬇️', key: msg.key } });
        const result = data.result;
        await client.sendMessage(chat, { react: { text: '⬆️', key: msg.key } });

        if (text === '1.1') {
          await sendMedia(client, chat, 'video', result.links.SD, '🎥 *SD Video* | © Hiran-MD', 'video/mp4', null, msg);
        } else if (text === '1.2') {
          await sendMedia(client, chat, 'video', result.links.HD, '🎥 *HD Video* | © Hiran-MD', 'video/mp4', null, msg);
        } else if (text === '2.1') {
          await sendMedia(client, chat, 'audio', result.links.SD, null, 'audio/mpeg', null, msg);
        } else if (text === '2.2') {
          await sendMedia(client, chat, 'document', result.links.SD, '📄 *Audio Document* | © Hiran-MD', 'audio/mpeg', 'ʜɪʀᴀɴ-ᴍᴅ/FBDL.mp3', msg);
        } else if (text === '2.3') {
          await sendMedia(client, chat, 'audio', result.links.SD, null, 'audio/mp4', null, msg);
        }
      }
    });
  } catch (error) {
    console.error('Facebook Error:', error);
    reply(`❌ An error occurred: ${error.message}`);
  }
});

// Twitter Downloader
cmd({
  pattern: 'twitter',
  alias: ['twdl', 'tweet'],
  desc: 'Download Twitter videos or audio',
  category: 'download',
  filename: __filename
}, async (client, message, context, { from, quoted, args, q, reply }) => {
  try {
    if (!q || !q.startsWith('https://')) return reply('❌ Please provide a valid Twitter URL!');
    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });

    const response = await axios.get(`https://www.dark-yasiya-api.site/download/twitter?url=${q}`);
    const data = response.data;
    if (!data || !data.status || !data.result) return reply('❌ Failed to retrieve Twitter video. Please check the link and try again.');

    const { desc, thumb, video_sd, video_hd } = data.result;
    const caption = `
🌟 *Hiran-MD Twitter Downloader* 🌟
══════════════════════════════
🔢 *Reply with a number to download:*
📹 *Video Download*
  1.1  ┃  SD Quality
  1.2  ┃  HD Quality
🎧 *Audio Download*
  2.1  ┃  Audio
  2.2  ┃  Document
  2.3  ┃  Voice
══════════════════════════════
✨ *Hiran-MD* ✨
    `;
    const msg = await client.sendMessage(from, { image: { url: thumb }, caption, contextInfo }, { quoted });
    const msgId = msg.key.id;

    client.ev.on('messages.upsert', async ({ messages }) => {
      const msg = messages[0];
      if (!msg.message) return;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
      const chat = msg.key.remoteJid;
      const isReply = msg.message.extendedTextMessage?.contextInfo.stanzaId === msgId;
      if (isReply) {
        await client.sendMessage(chat, { react: { text: '⬇️', key: msg.key } });
        await client.sendMessage(chat, { react: { text: '⬆️', key: msg.key } });

        if (text === '1.1') {
          await sendMedia(client, chat, 'video', video_sd, '🎥 *SD Video* | © Hiran-MD', 'video/mp4', null, msg);
        } else if (text === '1.2') {
          await sendMedia(client, chat, 'video', video_hd, '🎥 *HD Video* | © Hiran-MD', 'video/mp4', null, msg);
        } else if (text === '2.1') {
          await sendMedia(client, chat, 'audio', video_sd, null, 'audio/mpeg', null, msg);
        } else if (text === '2.2') {
          await sendMedia(client, chat, 'document', video_sd, '📄 *Audio Document* | © Hiran-MD', 'audio/mpeg', 'ʜɪʀᴀɴ-ᴍᴅ/TWDL.mp3', msg);
        } else if (text === '2.3') {
          await sendMedia(client, chat, 'audio', video_sd, null, 'audio/mp4', null, msg);
        }
      }
    });
  } catch (error) {
    console.error('Twitter Error:', error);
    reply(`❌ An error occurred: ${error.message}`);
  }
});

// MediaFire Downloader
cmd({
  pattern: 'mediafire',
  desc: 'Download MediaFire files',
  react: '🎥',
  category: 'download',
  filename: __filename
}, async (client, message, context, { from, quoted, args, q, reply }) => {
  try {
    if (!q) return reply('❌ Please provide a MediaFire URL!');
    await client.sendMessage(from, { react: { text: '⬇️', key: message.key } });

    const response = await axios.get(`https://www.dark-yasiya-api.site/download/mfire?url=${q}`);
    const data = response.data;
    if (!data || !data.status || !data.result || !data.result.dl_link) return reply('❌ Failed to fetch MediaFire download link. Ensure the link is valid and public.');

    const { dl_link, fileName = 'mediafire_download', fileType = 'application/octet-stream' } = data.result;
    await client.sendMessage(from, { react: { text: '⬆️', key: message.key } });

    const caption = `
🌟 *Hiran-MD MediaFire Downloader* 🌟
══════════════════════════════
📄 *File Name*: ${fileName}
📦 *File Type*: ${fileType}
══════════════════════════════
✨ *Hiran-MD* ✨
    `;
    await sendMedia(client, from, 'document', dl_link, caption, fileType, fileName, quoted);
  } catch (error) {
    console.error('MediaFire Error:', error);
    reply(`❌ An error occurred: ${error.message}`);
  }
});

// Instagram Downloader
cmd({
  pattern: 'ig',
  desc: 'Download Instagram videos',
  react: '🎥',
  category: 'download',
  filename: __filename
}, async (client, message, context, { from, quoted, args, q, reply }) => {
  try {
    if (!q) return reply('❌ Please provide an Instagram URL!');
    await client.sendMessage(from, { react: { text: '⬇️', key: message.key } });

    const data = await igdl(q);
    const videos = await data.data;
    for (let i = 0; i < Math.min(videos.length, 20); i++) {
      await client.sendMessage(from, { react: { text: '⬆️', key: message.key } });
      await sendMedia(client, from, 'video', videos[i].url, '🎥 *Instagram Video* | © Hiran-MD', 'video/mp4', null, quoted);
      await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    }
  } catch (error) {
    console.error('Instagram Error:', error);
    reply(`❌ An error occurred: ${error.message}`);
  }
});

// APK Downloader
cmd({
  pattern: 'apk',
  desc: 'Download APK files',
  category: 'download',
  filename: __filename
}, async (client, message, context, { from, quoted, args, q, reply }) => {
  try {
    await client.sendMessage(from, { react: { text: '⬇', key: message.key } });
    const response = await axios.get(`http://ws75.aptoide.com/api/7/apps/search/query=${q}/limit=1`);
    const data = response.data;
    const app = data.datalist.list[0];
    const sizeMB = (app.size / 1000000).toFixed(1);
    const caption = `
🌟 *Hiran-MD APK Downloader* 🌟
══════════════════════════════
🏷 *Name*: ${app.name}
📦 *Size*: ${sizeMB} MB
🔖 *Package*: ${app.package}
📆 *Last Update*: ${app.updated.views}
👤 *Developer*: ${app.developer.name}
══════════════════════════════
✨ *Hiran-MD* ✨
    `;
    await client.sendMessage(from, { react: { text: '⬆', key: message.key } });
    await sendMedia(client, from, 'document', app.file.path_alt, caption, 'application/vnd.android.package-archive', app.name, quoted);
    await client.sendMessage(from, { react: { text: '✅', key: message.key } });
  } catch (error) {
    console.error('APK Error:', error);
    reply(`❌ An error occurred: ${error.message}`);
  }
});

// Google Drive Downloader
cmd({
  pattern: 'gdrive',
  desc: 'Download Google Drive files',
  react: '🌐',
  category: 'download',
  filename: __filename
}, async (client, message, context, { from, quoted, args, q, reply }) => {
  try {
    await client.sendMessage(from, { react: { text: '⬇️', key: message.key } });
    if (!q) return reply('❌ Please provide a Google Drive URL!');
    const response = await axios.get(`https://api.fgmods.xyz/api/downloader/gdrive?url=${q}&apikey=mnp3grlZ`);
    const data = response.data;
    const url = data.result.downloadUrl;
    if (!url) return reply('❌ Failed to fetch Google Drive download link.');
    await client.sendMessage(from, { react: { text: '⬆️', key: message.key } });
    await sendMedia(client, from, 'document', url, '📄 *Google Drive File* | © Hiran-MD', data.result.mimetype, data.result.fileName, quoted);
    await client.sendMessage(from, { react: { text: '✅', key: message.key } });
  } catch (error) {
    console.error('Google Drive Error:', error);
    reply('❌ Failed to download Google Drive file. Please check the URL.');
  }
});
