const { cmd, getBuffer } = require('../lib');
const { socialdl } = require('@dark-yasiya/scraper');

let sessions = {};

const sendMenuOrDownload = async (m, result) => {
  if (!result || result.length === 0) return m.reply('No downloadable media found.');

  if (result.length === 1) {
    const media = result[0];
    const buffer = await getBuffer(media.url);
    const caption = generateCaption(media);
    return m.sendMessage(m.chat, {
      video: buffer,
      mimetype: 'video/mp4',
      caption,
    }, { quoted: m });
  }

  sessions[m.sender] = { list: result, type: 'social' };
  let text = `Found ${result.length} download options:\n\n`;
  result.forEach((v, i) => {
    text += `*${i + 1}.* ${v.quality || 'Unknown Quality'} - ${v.title || 'Video'}\n`;
  });
  text += `\nReply with a number (1-${result.length}) to choose.\nAdd "d" to send as document. (e.g., 2d)`;
  return m.reply(text);
};

const handleDownload = async (m, link, platform) => {
  if (!link) return m.reply(`Please provide a ${platform || 'social'} video link.`);

  m.reply('Fetching your media, please wait...');
  try {
    const result = await socialdl(link);

    const filtered = platform
      ? result.filter(x => link.includes(platform))
      : result;

    if (!filtered.length) return m.reply('No media found for the specified platform.');
    await sendMenuOrDownload(m, filtered);
  } catch (e) {
    console.error(e);
    m.reply('Failed to fetch video. Make sure the URL is correct and supported.');
  }
};

const generateCaption = (media) => {
  const platformName = (media.url.includes('tiktok') && 'TikTok') ||
                       (media.url.includes('instagram') && 'Instagram') ||
                       (media.url.includes('facebook') && 'Facebook') ||
                       (media.url.includes('twitter') && 'Twitter') ||
                       'Unknown';

  return `**Title**: ${media.title || 'Unknown'}
**Quality**: ${media.quality || 'Unknown'}
**Platform**: ${platformName}
**Size**: ${media.size || 'Unknown'}
**Duration**: ${media.duration || 'Unknown'}
**Watermark**: ${media.nowatermark === false ? 'Yes' : 'No'}

This video brought for you by HIRAN MD.`;
};

// Commands
cmd({
  pattern: 'social',
  desc: 'Auto-detect platform and download video',
  category: 'downloader',
  use: '.social <url>',
}, async (m, command) => {
  await handleDownload(m, command.trim());
});

cmd({
  pattern: 'fb',
  desc: 'Download Facebook videos',
  category: 'downloader',
  use: '.fb <url>',
}, async (m, command) => {
  await handleDownload(m, command.trim(), 'facebook');
});

cmd({
  pattern: 'in',
  desc: 'Download Instagram videos',
  category: 'downloader',
  use: '.in <url>',
}, async (m, command) => {
  await handleDownload(m, command.trim(), 'instagram');
});

cmd({
  pattern: 'tt',
  desc: 'Download TikTok videos',
  category: 'downloader',
  use: '.tt <url>',
}, async (m, command) => {
  await handleDownload(m, command.trim(), 'tiktok');
});

// Number reply handler
cmd({
  on: 'text',
  fromMe: false
}, async (m) => {
  if (!sessions[m.sender]) return;

  const input = m.body.trim().toLowerCase();
  const match = input.match(/^(\d+)(d?)$/);
  if (!match) return;

  const index = parseInt(match[1]) - 1;
  const asDoc = match[2] === 'd';
  const session = sessions[m.sender];

  if (!session.list[index]) return m.reply('Invalid selection.');

  const media = session.list[index];
  const buffer = await getBuffer(media.url);
  const caption = generateCaption(media);

  await m.sendMessage(m.chat, {
    [asDoc ? 'document' : 'video']: buffer,
    mimetype: 'video/mp4',
    fileName: `${media.title || 'video'}.mp4`,
    caption,
  }, { quoted: m });

  delete sessions[m.sender];
});
