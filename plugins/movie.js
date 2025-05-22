const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

const API_URL = "https://api.skymansion.site/movies-dl/search";
const DOWNLOAD_URL = "https://api.skymansion.site/movies-dl/download";
const API_KEY = config.MOVIE_API_KEY;

let sessions = {};

cmd({
  pattern: "movie",
  alias: ["moviedl", "films"],
  react: '🎬',
  category: "download",
  desc: "Search and download movies from PixelDrain",
  filename: __filename
}, async (robin, m, mek, { from, q, reply }) => {
  try {
    if (!q && !sessions[from]) return await reply('❌ Please provide a movie name! (e.g., Deadpool)');

    // User replies with a number
    if (!q && sessions[from]) {
      const body = m.message?.extendedTextMessage?.text || m.message?.conversation;
      const num = parseInt(body.trim());
      const userSession = sessions[from];

      if (userSession.stage === 'choose_movie') {
        if (!userSession.results[num - 1]) return await reply('❌ Invalid movie selection.');

        const selected = userSession.results[num - 1];
        const detailsUrl = `${DOWNLOAD_URL}/?id=${selected.id}&api_key=${API_KEY}`;
        const details = await fetchJson(detailsUrl);

        if (!details || !details.downloadLinks || !details.downloadLinks.result.links.driveLinks.length) {
          delete sessions[from];
          return await reply('❌ No download links found.');
        }

        const links = details.downloadLinks.result.links.driveLinks;
        let text = `🎬 *${selected.title}*\n\nAvailable Qualities:\n`;
        links.forEach((link, i) => {
          text += `${i + 1}. ${link.quality}\n`;
        });
        text += `\n🔢 Reply with a number to select quality.`;

        sessions[from] = {
          stage: 'choose_quality',
          links,
          title: selected.title,
          poster: selected.poster
        };

        return await robin.sendMessage(from, {
          image: { url: selected.poster },
          caption: text,
          quoted: mek
        });
      }

      if (userSession.stage === 'choose_quality') {
        const chosen = userSession.links[num - 1];
        if (!chosen || !chosen.link.startsWith('http')) {
          delete sessions[from];
          return await reply('❌ Invalid or broken link.');
        }

        const fileId = chosen.link.split('/').pop();
        const directDownloadLink = `https://pixeldrain.com/api/file/${fileId}?download`;
        const safeTitle = userSession.title.replace(/[\\/:*?"<>|]/g, '');
        const filePath = path.join(__dirname, `${safeTitle}-${chosen.quality}.mp4`);
        const writer = fs.createWriteStream(filePath);

        await reply(`⏳ Downloading *${userSession.title}* in ${chosen.quality}...`);

        const { data } = await axios({
          url: directDownloadLink,
          method: 'GET',
          responseType: 'stream'
        });

        data.pipe(writer);

        writer.on('finish', async () => {
          await robin.sendMessage(from, {
            document: fs.readFileSync(filePath),
            mimetype: 'video/mp4',
            fileName: `${safeTitle}-${chosen.quality}.mp4`,
            caption: `🎬 *${userSession.title}*\n📌 Quality: ${chosen.quality}\n✅ Download Complete!\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`,
            quoted: mek
          });
          fs.unlinkSync(filePath);
        });

        writer.on('error', async (err) => {
          console.error('Download error:', err);
          await reply('❌ Failed to download. Please try again.');
        });

        delete sessions[from];
        return;
      }
    }

    // Step 1: Search
    const searchUrl = `${API_URL}?q=${encodeURIComponent(q)}&api_key=${API_KEY}`;
    const res = await fetchJson(searchUrl);
    if (!res || !res.SearchResult || !res.SearchResult.result.length) {
      return await reply(`❌ No results found for: *${q}*`);
    }

    const results = res.SearchResult.result.slice(0, 5);
    let text = `🎬 *Search results for:* ${q}\n\n`;
    results.forEach((r, i) => {
      text += `${i + 1}. ${r.title} (${r.year || 'N/A'})\n`;
    });
    text += `\n🔢 Reply with a number to select a movie.`;

    sessions[from] = {
      stage: 'choose_movie',
      results
    };

    return await reply(text);

  } catch (error) {
    console.error('Error:', error);
    await reply('❌ Something went wrong. Please try again.');
    delete sessions[from];
  }
});
