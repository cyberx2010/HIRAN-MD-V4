const axios = require('axios');
const { cmd } = require('../command');
const { sleep } = require('../lib/functions');

let replyStore = {};

function buildQualityMenu(qualities) {
  return qualities.map((q, i) => `${i + 1}. ${q.quality} (${q.size})`).join('\n');
}

async function handleVideoDownload(conn, mek, reply, site, url, userJid) {
  const apiUrl = `https://www.dark-yasiya-api.site/download/${site}?url=${encodeURIComponent(url)}`;
  const { data } = await axios.get(apiUrl);
  if (!data?.result?.video) return reply('❌ Failed to fetch video.');

  const result = data.result;
  const qualities = result.videos || [{ quality: 'Default', size: 'Unknown', url: result.video }];

  if (qualities.length === 1) {
    return conn.sendMessage(mek.key.remoteJid, {
      video: { url: qualities[0].url },
      caption: `🎬 Title: ${result.title}\n\nBy HIRANYA SATHSARA`
    }, { quoted: mek });
  }

  replyStore[userJid] = {
    selections: qualities,
    originalMessage: mek,
    title: result.title
  };

  return reply(`🎬 *${result.title}*\n\nSelect quality to download:\n\n${buildQualityMenu(qualities)}\n\n_Reply with a number (1-${qualities.length})_`);
}

// Command: .phub <url>
cmd({
  pattern: 'phub',
  desc: 'Download Pornhub video',
  category: 'adult',
  filename: __filename
}, async (conn, mek, m, { reply }) => {
  const url = m.text.split(' ')[1];
  if (!url?.includes('pornhub.com')) return reply('Give a valid Pornhub URL.');
  await reply('🔎 Processing your request...');
  return handleVideoDownload(conn, mek, reply, 'phub', url, m.sender);
});

// Command: .xnxx <url>
cmd({
  pattern: 'xnxx',
  desc: 'Download XNXX video',
  category: 'adult',
  filename: __filename
}, async (conn, mek, m, { reply }) => {
  const url = m.text.split(' ')[1];
  if (!url?.includes('xnxx.com')) return reply('Give a valid XNXX URL.');
  await reply('🔎 Processing your request...');
  return handleVideoDownload(conn, mek, reply, 'xnxx', url, m.sender);
});

// Listen for number replies
cmd({
  on: 'message'
}, async (conn, mek, m, { reply }) => {
  const user = m.sender;
  if (!(user in replyStore)) return;

  const choice = parseInt(m.text.trim());
  const data = replyStore[user];

  if (isNaN(choice) || choice < 1 || choice > data.selections.length) {
    return reply('Invalid selection. Please reply with a valid number.');
  }

  const video = data.selections[choice - 1];
  await conn.sendMessage(mek.key.remoteJid, {
    video: { url: video.url },
    caption: `🎬 Title: ${data.title}\n\nDownloaded in ${video.quality} — By HIRANYA SATHSARA`
  }, { quoted: data.originalMessage });

  delete replyStore[user];
});
