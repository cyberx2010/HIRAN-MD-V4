const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

cmd({
  pattern: "cine",
  react: '🎬',
  alias: ['cinesubz'],
  category: "movie",
  filename: __filename
}, async (conn, m, mek, { q, from, prefix, reply }) => {
  try {
    if (!q) return await reply("*Please provide a movie name to search!*");

    const res = await fetchJson(`https://cinesubz.mizta-x.com/movie-search?name=${encodeURIComponent(q)}`);
    const results = res?.data;

    if (!results || results.length === 0) {
      return await reply("*No movie found!*");
    }

    let msg = `*🔍 CINESUBZ MOVIE SEARCH RESULTS:*\n\n_Reply with number to continue_\n\n`;
    results.slice(0, 20).forEach((movie, i) => {
      msg += `*${i + 1}.* ${movie.title} (Sinhala Sub)\n`;
    });
    msg += `\n> ⚜️ 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐝  -  𝐇 𝐈 𝐑 𝐀 𝐍  𝐌 𝐃  𝐁 𝐘  𝐇 𝐈 𝐑 𝐀 𝐍 𝐘 𝐀  𝐒 𝐀 𝐓 𝐇 𝐒 𝐀 𝐑 𝐀`;

    await conn.sendMessage(from, {
      image: { url: 'https://files.catbox.moe/4fsn8g.jpg' },
      caption: msg
    }, { quoted: mek });

    conn.replyOnce(from, async (msg2) => {
      const num = parseInt(msg2);
      if (isNaN(num) || num < 1 || num > results.length) {
        return await reply("*Invalid selection number!*");
      }

      const movieLink = results[num - 1].movieLink;
      const detail = await fetchJson(`https://cinesubz.mizta-x.com${movieLink}`);

      const { title, description, image, download } = detail.data;
      let caption = `*🎬 TITLE:* ${title}\n\n*🗒️ DESCRIPTION:*\n${description}\n\n*⬇️ DOWNLOAD OPTIONS:*\n`;

      download.forEach((item, i) => {
        caption += `\n*${i + 1}.* ${item.quality} - ${item.size}`;
      });
      caption += `\n\n> ⚜️ 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐝  -  𝐇 𝐈 𝐑 𝐀 𝐍  𝐌 𝐃  𝐁 𝐘  𝐇 𝐈 𝐑 𝐀 𝐍 𝐘 𝐀  𝐒 𝐀 𝐓 𝐇 𝐒 𝐀 𝐑 𝐀`;

      await conn.sendMessage(from, {
        image: { url: image },
        caption
      }, { quoted: mek });

      conn.replyOnce(from, async (msg3) => {
        const pick = parseInt(msg3);
        if (isNaN(pick) || pick < 1 || pick > download.length) {
          return await reply("*Invalid option selected!*");
        }

        const selected = download[pick - 1];
        await reply(`*🎬 Title:* ${title}\n*📥 Quality:* ${selected.quality}\n\n*🔗 Download Link:* ${selected.link}\n\n> ⚜️ 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐝  -  𝐇 𝐈 𝐑 𝐀 𝐍  𝐌 𝐃  𝐁 𝐘  𝐇 𝐈 𝐑 𝐀 𝐍 𝐘 𝐀  𝐒 𝐀 𝐓 𝐇 𝐒 𝐀 𝐑 𝐀`);
      });

    });

  } catch (e) {
    console.error(e);
    await reply(`❌ Error: ${e.message}`);
  }
});
