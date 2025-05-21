const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

const searchApis = {
  xnxx: 'https://toy-api.vercel.app/api/xnxx/search?query=',
  phub: 'https://toy-api.vercel.app/api/phub/search?query=',
  red: 'https://toy-api.vercel.app/api/redtube/search?query=',
  youp: 'https://toy-api.vercel.app/api/youporn/search?query=',
};

const detailApis = {
  xnxx: 'https://toy-api.vercel.app/api/xnxx/download?url=',
  phub: 'https://toy-api.vercel.app/api/phub/download?url=',
  red: 'https://toy-api.vercel.app/api/redtube/download?url=',
  youp: 'https://toy-api.vercel.app/api/youporn/download?url=',
};

const isValidUrl = url => /^https?:\/\/(www\.)?(xnxx|pornhub|redtube|youporn)\.com/.test(url);

global.replyMap = new Map();

for (const cmdName of Object.keys(searchApis)) {
  cmd({
    pattern: cmdName,
    desc: `Download ${cmdName.toUpperCase()} videos`,
    category: 'adult',
    react: '🍑',
    filename: __filename,
  }, async (conn, m, { reply, q }) => {
    if (!q) return reply('Enter a search term or send a video link.');

    const site = cmdName;
    const isLink = isValidUrl(q);

    if (isLink) {
      try {
        const detail = await fetchJson(`${detailApis[site]}${encodeURIComponent(q)}`);
        const { title, qualities, thumb } = detail.result;

        if (!qualities || Object.keys(qualities).length === 0) {
          return reply('No video qualities found.');
        }

        let caption = `*${title}*\n\n_Select a quality:_\n\n`;
        const keys = Object.keys(qualities);
        keys.forEach((k, i) => {
          caption += `${i + 1}. ${k} (${qualities[k].split('/').pop()})\n`;
        });
        caption += `\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

        await conn.sendMessage(m.chat, {
          image: { url: thumb },
          caption
        }, { quoted: m });

        global.replyMap.set(m.key.id, {
          list: keys.map(k => qualities[k]),
          action: async (choice) => {
            const chosen = qualities[keys[choice - 1]];
            return conn.sendMessage(m.chat, {
              video: { url: chosen },
              mimetype: 'video/mp4'
            }, { quoted: m });
          }
        });

      } catch (e) {
        console.log(e);
        return reply('Failed to fetch video details.');
      }

    } else {
      try {
        const data = await fetchJson(`${searchApis[site]}${encodeURIComponent(q)}`);
        const results = data.result?.slice(0, 20);

        if (!results || results.length === 0) return reply('No results found.');

        let caption = '*Search Results:*\n\n';
        results.forEach((res, i) => {
          caption += `${i + 1}. ${res.title}\n`;
        });
        caption += `\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

        await conn.sendMessage(m.chat, {
          image: { url: 'https://files.catbox.moe/wgvkoa.jpg' },
          caption
        }, { quoted: m });

        global.replyMap.set(m.key.id, {
          list: results.map(r => r.link),
          action: async (choice) => {
            const link = results[choice - 1].link;
            const detail = await fetchJson(`${detailApis[site]}${encodeURIComponent(link)}`);
            const { title, qualities, thumb } = detail.result;

            let msg = `*${title}*\n\n_Select a quality:_\n\n`;
            const keys = Object.keys(qualities);
            keys.forEach((k, i) => {
              msg += `${i + 1}. ${k} (${qualities[k].split('/').pop()})\n`;
            });
            msg += `\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

            await conn.sendMessage(m.chat, {
              image: { url: thumb },
              caption: msg
            }, { quoted: m });

            global.replyMap.set(m.key.id, {
              list: keys.map(k => qualities[k]),
              action: async (choice2) => {
                const chosen = qualities[keys[choice2 - 1]];
                return conn.sendMessage(m.chat, {
                  video: { url: chosen },
                  mimetype: 'video/mp4'
                }, { quoted: m });
              }
            });
          }
        });

      } catch (e) {
        console.log(e);
        return reply('Failed to fetch search results.');
      }
    }
  });
}
