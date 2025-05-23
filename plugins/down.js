const { cmd } = require('../command');
const axios = require('axios');

const BOT_IMAGE = 'https://files.catbox.moe/lacqi4.jpg';
const CREDIT = '> ⚜️ 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐝  -  𝐇 𝐈 𝐑 𝐀 𝐍  𝐌 𝐃  𝐁 𝐘  𝐇 𝐈 𝐑 𝐀 𝐍 𝐘 𝐀  𝐒 𝐀 𝐓 𝐇 𝐒 𝐀 𝐑 𝐀';

/* XNXX Command */
cmd({
  pattern: 'xnxx',
  desc: 'Download videos from XNXX',
  category: 'adult',
  react: '🔞',
  filename: __filename
}, async (message, match, m) => {
  if (!match) return message.reply('*Please enter a search term or link.*');

  if (match.includes('xnxx.com')) {
    try {
      const res = await axios.get(`https://aemt.me/xnxx?url=${match}`);
      const data = res.data;

      let txt = `*🔞 XNXX Downloader*\n\n`;
      txt += `*Title:* ${data.title}\n`;
      txt += `*Duration:* ${data.duration}\n`;
      txt += `*Quality:* ${data.quality}\n\n`;
      txt += `${CREDIT}`;

      return await message.sendFromUrl(data.url, {
        caption: txt,
        quoted: m,
        thumbnail: BOT_IMAGE
      });
    } catch (e) {
      return message.reply('*Error:* Could not fetch the video.');
    }
  } else {
    try {
      const search = await axios.get(`https://aemt.me/xnxxsearch?query=${encodeURIComponent(match)}`);
      const results = search.data.result.slice(0, 20);

      if (!results.length) return message.reply('*No results found.*');

      let msg = '*🔞 XNXX Search Results:*\n\n';
      results.forEach((item, i) => msg += `*${i + 1}.* ${item.title}\n`);
      msg += '\n_Reply with a number to download._';

      const sent = await message.reply(msg);
      message.replyHandler(sent.key.id, async (resMsg) => {
        const choice = parseInt(resMsg.body.trim());
        if (isNaN(choice) || choice < 1 || choice > results.length) {
          return message.reply('*Invalid choice.*');
        }

        const video = results[choice - 1];
        const result = await axios.get(`https://aemt.me/xnxx?url=${video.link}`);
        const data = result.data;

        let caption = `*🔞 XNXX Video*\n\n`;
        caption += `*Title:* ${data.title}\n`;
        caption += `*Duration:* ${data.duration}\n`;
        caption += `*Quality:* ${data.quality}\n\n`;
        caption += `${CREDIT}`;

        await message.sendFromUrl(data.url, {
          caption,
          quoted: m,
          thumbnail: BOT_IMAGE
        });
      });
    } catch (err) {
      message.reply('*An error occurred while searching.*');
    }
  }
});

/* XVideos Command */
cmd({
  pattern: 'xvideos',
  desc: 'Download videos from Xvideos',
  category: 'adult',
  react: '🔞',
  filename: __filename
}, async (message, match, m) => {
  if (!match) return message.reply('*Please enter a search term or link.*');

  if (match.includes('xvideos.com')) {
    try {
      const res = await axios.get(`https://aemt.me/xvideos?url=${match}`);
      const data = res.data;

      let txt = `*🔞 XVideos Downloader*\n\n`;
      txt += `*Title:* ${data.title}\n`;
      txt += `*Duration:* ${data.duration}\n`;
      txt += `*Quality:* ${data.quality}\n\n`;
      txt += `${CREDIT}`;

      return await message.sendFromUrl(data.url, {
        caption: txt,
        quoted: m,
        thumbnail: BOT_IMAGE
      });

    } catch (e) {
      return message.reply('*Error:* Could not fetch the video.');
    }

  } else {
    try {
      const search = await axios.get(`https://aemt.me/xvideossearch?query=${encodeURIComponent(match)}`);
      const results = search.data.result.slice(0, 20);

      if (!results.length) return message.reply('*No results found.*');

      let msg = '*🔞 XVideos Search Results:*\n\n';
      results.forEach((item, i) => msg += `*${i + 1}.* ${item.title}\n`);
      msg += '\n_Reply with a number to download._';

      const sent = await message.reply(msg);
      message.replyHandler(sent.key.id, async (resMsg) => {
        const choice = parseInt(resMsg.body.trim());
        if (isNaN(choice) || choice < 1 || choice > results.length) {
          return message.reply('*Invalid choice.*');
        }

        const video = results[choice - 1];
        const result = await axios.get(`https://aemt.me/xvideos?url=${video.link}`);
        const data = result.data;

        let caption = `*🔞 XVideos Video*\n\n`;
        caption += `*Title:* ${data.title}\n`;
        caption += `*Duration:* ${data.duration}\n`;
        caption += `*Quality:* ${data.quality}\n\n`;
        caption += `${CREDIT}`;

        await message.sendFromUrl(data.url, {
          caption,
          quoted: m,
          thumbnail: BOT_IMAGE
        });
      });
    } catch (err) {
      message.reply('*An error occurred while searching.*');
    }
  }
});
