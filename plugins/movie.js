const axios = require('axios');

module.exports = [
  {
    pattern: 'sinhalasub',
    fromMe: false,
    desc: 'Download SinhalaSub movies',
    type: 'movie',
    async function(conn, m, text, { reply }) {
      if (!text) return reply('Please provide a movie name.');

      let searchUrl = `https://www.dark-yasiya-api.site/movie/sinhalasub/search?text=${encodeURIComponent(text)}`;
      let search = await axios.get(searchUrl).then(res => res.data.result).catch(() => null);
      if (!search || search.length === 0) return reply('No results found.');

      let msg = `*SinhalaSub Search Results:*\n\n`;
      search.slice(0, 20).forEach((movie, i) => {
        msg += `${i + 1}. ${movie.title}\n`;
      });
      msg += `\nReply with a number to get download.`;
      await conn.sendMessage(m.from, { text: msg }, { quoted: m });

      const filter = (msg) => msg.key?.fromMe === false && msg.key.remoteJid === m.from;
      const picked = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(), 30000);
        const handler = conn.ev.on('messages.upsert', async ({ messages }) => {
          let msg = messages[0];
          if (filter(msg)) {
            let num = parseInt(msg.message?.conversation || msg.message?.extendedTextMessage?.text);
            if (!isNaN(num) && num >= 1 && num <= search.length) {
              clearTimeout(timeout);
              handler.off();
              resolve(num - 1);
            } else {
              await conn.sendMessage(m.from, { text: 'Invalid number, try again.' }, { quoted: msg });
            }
          }
        });
      }).catch(() => null);

      if (picked === null) return reply('Timed out.');

      let selected = search[picked];
      let detailUrl = `https://www.dark-yasiya-api.site/movie/sinhalasub/movie?url=${selected.url}`;
      let detail = await axios.get(detailUrl).then(res => res.data.result).catch(() => null);

      if (!detail || !detail.download) return reply('Download failed.');

      try {
        await conn.sendMessage(m.from, {
          video: { url: detail.download },
          caption: `*${detail.title}*\n\n${detail.description}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`,
          mimetype: 'video/mp4'
        }, { quoted: m });
      } catch (e) {
        reply(`*${detail.title}*\n\n${detail.description}\n\nDownload: ${detail.download}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`);
      }
    }
  },
  {
    pattern: 'firemovie',
    fromMe: false,
    desc: 'Download FireMovie movies',
    type: 'movie',
    async function(conn, m, text, { reply }) {
      if (!text) return reply('Please provide a movie name.');

      let searchUrl = `https://www.dark-yasiya-api.site/movie/firemovie/search?text=${encodeURIComponent(text)}`;
      let search = await axios.get(searchUrl).then(res => res.data.result).catch(() => null);
      if (!search || search.length === 0) return reply('No results found.');

      let msg = `*FireMovie Search Results:*\n\n`;
      search.slice(0, 20).forEach((movie, i) => {
        msg += `${i + 1}. ${movie.title}\n`;
      });
      msg += `\nReply with a number to get download.`;
      await conn.sendMessage(m.from, { text: msg }, { quoted: m });

      const filter = (msg) => msg.key?.fromMe === false && msg.key.remoteJid === m.from;
      const picked = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(), 30000);
        const handler = conn.ev.on('messages.upsert', async ({ messages }) => {
          let msg = messages[0];
          if (filter(msg)) {
            let num = parseInt(msg.message?.conversation || msg.message?.extendedTextMessage?.text);
            if (!isNaN(num) && num >= 1 && num <= search.length) {
              clearTimeout(timeout);
              handler.off();
              resolve(num - 1);
            } else {
              await conn.sendMessage(m.from, { text: 'Invalid number, try again.' }, { quoted: msg });
            }
          }
        });
      }).catch(() => null);

      if (picked === null) return reply('Timed out.');

      let selected = search[picked];
      let detailUrl = `https://www.dark-yasiya-api.site/movie/firemovie/movie?url=${selected.url}`;
      let detail = await axios.get(detailUrl).then(res => res.data.result).catch(() => null);

      if (!detail || !detail.download) return reply('Download failed.');

      try {
        await conn.sendMessage(m.from, {
          video: { url: detail.download },
          caption: `*${detail.title}*\n\n${detail.description}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`,
          mimetype: 'video/mp4'
        }, { quoted: m });
      } catch (e) {
        reply(`*${detail.title}*\n\n${detail.description}\n\nDownload: ${detail.download}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`);
      }
    }
  }
];
