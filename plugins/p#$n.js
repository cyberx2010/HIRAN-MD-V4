const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

const searchCache = {};

const services = {
  "xnxx": {
    site: "xnxx",
    search: "https://aemt.me/xnxxsearch?query=",
    download: "https://aemt.me/xnxxdl?url="
  },
  "phub": {
    site: "pornhub",
    search: "https://aemt.me/phsearch?query=",
    download: "https://aemt.me/phdl?url="
  },
  "red": {
    site: "redtube",
    search: "https://aemt.me/redsearch?query=",
    download: "https://aemt.me/reddl?url="
  },
  "youp": {
    site: "youporn",
    search: "https://aemt.me/youpsearch?query=",
    download: "https://aemt.me/youpdl?url="
  }
};

for (const [cmdName, config] of Object.entries(services)) {
  cmd({
    pattern: cmdName,
    react: "🔞",
    desc: `${config.site} video downloader`,
    category: "downloader",
    filename: __filename
  }, async (conn, mek, m, { q, isCmd, reply }) => {
    const from = m.chat;
    const sender = m.sender;

    // Quality selection
    if (!isCmd && searchCache[from] && Array.isArray(searchCache[from][sender])) {
      const selected = parseInt(q.trim()) - 1;
      const urls = searchCache[from][sender];
      if (!urls[selected]) return reply("❌ Invalid quality number.");
      delete searchCache[from][sender];

      return await conn.sendMessage(from, {
        video: { url: urls[selected] },
        mimetype: 'video/mp4',
        caption: `> ʜɪʀᴀɴ ᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ\n\n🔞 Video sent in selected quality. Enjoy!`
      }, { quoted: mek });
    }

    // Video selection
    if (!isCmd && searchCache[from] && searchCache[from][sender] && !Array.isArray(searchCache[from][sender])) {
      const selected = parseInt(q.trim()) - 1;
      const results = searchCache[from][sender];
      if (!results[selected]) return reply("❌ Invalid selection.");
      const video = results[selected];
      delete searchCache[from][sender];

      const result = await fetchJson(`${config.download}${encodeURIComponent(video.link)}`);
      if (!result || !result.result) return reply("❌ Failed to fetch video info.");

      const { title, desc, duration, quality } = result.result;
      let listText = '', qualities = [];
      Object.entries(quality).forEach(([k, v], i) => {
        listText += `*${i + 1}.* ${k}\n`;
        qualities.push(v);
      });

      searchCache[from] = { [sender]: qualities };

      return await reply(
        `> ʜɪʀᴀɴ ᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ\n\n🎬 *${title}*\n🕐 Duration: ${duration}\n📄 ${desc}\n\n📥 *Choose quality:*\n${listText}`
      );
    }

    // If direct video URL
    if (q && q.includes(config.site)) {
      try {
        const result = await fetchJson(`${config.download}${encodeURIComponent(q)}`);
        if (!result || !result.result) return reply("❌ Failed to get video.");

        const { title, desc, duration, quality } = result.result;
        let listText = '', qualities = [];
        Object.entries(quality).forEach(([k, v], i) => {
          listText += `*${i + 1}.* ${k}\n`;
          qualities.push(v);
        });

        searchCache[from] = { [sender]: qualities };

        return await reply(
          `> ʜɪʀᴀɴ ᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ\n\n🎬 *${title}*\n🕐 Duration: ${duration}\n📄 ${desc}\n\n📥 *Choose quality:*\n${listText}`
        );
      } catch (e) {
        console.log(e);
        return reply("❌ Error while fetching video.");
      }
    }

    // Search mode
    try {
      if (!q) return reply(`Send .${cmdName} <search> or direct link`);
      const result = await fetchJson(`${config.search}${encodeURIComponent(q)}`);
      if (!result || !result.result || result.result.length === 0) return reply("❌ No results found.");
      const list = result.result.slice(0, 20);

      let text = `> ʜɪʀᴀɴ ᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ\n\n🔍 *Top 20 ${config.site} results for:* _${q}_\n\n`;
      list.forEach((v, i) => {
        text += `*${i + 1}.* ${v.title}\n`;
      });

      if (!searchCache[from]) searchCache[from] = {};
      searchCache[from][sender] = list;

      return await conn.sendMessage(from, {
        image: { url: 'https://files.catbox.moe/wgvkoa.jpg' },
        caption: text + `\n\n_Reply with a number (1-${list.length}) to continue._`
      }, { quoted: mek });
    } catch (e) {
      console.log(e);
      return reply("❌ Error during search.");
    }
  });
}
