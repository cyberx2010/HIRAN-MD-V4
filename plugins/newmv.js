const config = require('../config');
const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

cmd({
    pattern: "cine",
    react: '🔎',
    category: "movie",
    alias: ["cinesubz"],
    desc: "Movie downloader with Sinhala subtitles",
    filename: __filename
},
async (conn, m, mek, { from, q, prefix, reply }) => {
    try {
        if (!q) return await reply('*Please provide a search query!*');

        // Fetch movie data from API
        const apiUrl = config.CINE_API_URL || 'https://darksadas-yt-cinezub-search.vercel.app/';
        const res = await fetchJson(`${apiUrl}?query=${encodeURIComponent(q)}`);

        // Validate API response
        if (!res.data || !Array.isArray(res.data) || res.data.length === 0) {
            return await reply('*No movies found for your query!*');
        }

        // Construct the result message
        let resultText =` *𝘾𝙄𝙉𝙀𝙎𝙐𝘽𝙕 𝙈𝙊𝙃𝙄𝙀 𝙎𝙀𝘼𝙍𝘾𝙃 𝙍𝙀𝙎𝙐𝙇𝙏𝙎 𝙁𝙊𝙍:* ${q}\n\n*Reply Below Number 🔢*\n\n`;
        res.data.forEach((item, index) => {
            const title = item.title || 'Unknown Title';
            const year = item.year || 'N/A';
            resultText += `*${index + 1} ||* ${title} (${year}) Sinhala Subtitles | සිංහල උපසිරසි සමඟ\n`;
        });
        resultText += `\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴ-ᴍᴅ 🔒🪄`;

        // Send the image with the caption
        const imageUrl = 'https://files.catbox.moe/4fsn8g.jpg';
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: resultText
        }, { quoted: mek });

    } catch (e) {
        console.error('Error in cine command:', e);
        await reply(`*Error: ${e.message || 'Something went wrong!'}*`);
    }
});

cmd({
  pattern: "cinedl",
  dontAddCommandList: true,
  react: '🎥',
  desc: "movie downloader",
  filename: __filename
},
async (conn, m, mek, { from, q, isMe, prefix, reply }) => {
  try {
    if (!q) return await reply('*Please provide a movie URL!*');

    // Fetch movie details from the details API
    const detailsApiUrl = `https://cinesub-info.vercel.app/?url=${encodeURIComponent(q)}&apikey=${config.CINE_API_KEY || 'dinithimegana'}`;
    const detailsRes = await fetchJson(detailsApiUrl);

    // Log the details API response for debugging
    console.log('Details API response:', JSON.stringify(detailsRes, null, 2));

    // Validate details API response
    if (!detailsRes || !detailsRes.data) {
      return await reply(`*Error: Invalid response from details API. Please check your URL.*`);
    }
    if (!detailsRes.dl_links || !Array.isArray(detailsRes.dl_links) || detailsRes.dl_links.length === 0) {
      return await reply(`*Error: No download links found for the provided URL: ${q}*`);
    }

    // TMDB API key
    const tmdbApiKey = '68d5b6526b869106a270a6aea22a78e7'; // Your provided key

    // Fetch TMDB configuration for image base URL
    let baseImageUrl = 'https://image.tmdb.org/t/p/w500'; // Default base URL and size
    try {
      const tmdbConfigRes = await fetchJson(`https://api.themoviedb.org/3/configuration?api_key=${tmdbApiKey}`);
      if (tmdbConfigRes.images?.base_url && tmdbConfigRes.images?.poster_sizes.includes('w500')) {
        baseImageUrl = `${tmdbConfigRes.images.base_url}w500`;
      } else {
        console.warn('TMDB configuration fallback used:', tmdbConfigRes);
      }
    } catch (configError) {
      console.error('TMDB config API error:', configError);
    }

    // Search TMDB for the movie poster using the title
    let imageUrl = detailsRes.data.image || 'https://files.catbox.moe/4fsn8g.jpg'; // Fallback to details API or static image
    try {
      const tmdbSearchRes = await fetchJson(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(detailsRes.data.title || 'Unknown Title')}`);
      console.log('TMDB search response:', JSON.stringify(tmdbSearchRes, null, 2));
      if (tmdbSearchRes.results?.[0]?.poster_path) {
        imageUrl = `${baseImageUrl}${tmdbSearchRes.results[0].poster_path}`;
      } else {
        console.warn('No poster found in TMDB search results:', tmdbSearchRes);
      }
    } catch (tmdbError) {
      console.error('TMDB search API error:', tmdbError);
    }

    // Construct caption with details from the details API
    let cap = `*☘️ Title ➜* *${detailsRes.data.title || 'Unknown Title'}*\n\n` +
              `*📆 Release ➜* _${detailsRes.data.date || 'N/A'}_\n` +
              `*⭐ Rating ➜* _${detailsRes.data.imdb || 'N/A'}_\n` +
              `*⏰ Runtime ➜* _${detailsRes.data.runtime || 'N/A'}_\n` +
              `*🌎 Country ➜* _${detailsRes.data.country || 'N/A'}_\n` +
              `*💁‍♂️ Director ➜* _${detailsRes.data.subtitle_author || 'N/A'}_\n`;

    const sections = [];

    if (Array.isArray(detailsRes.dl_links)) {
      const cinesubzRows = detailsRes.dl_links.map(item => ({
        title: `${item.quality || 'Unknown Quality'} (${item.size || 'Unknown Size'})`,
        rowId: `${prefix}cinedl ${imageUrl}±${item.link}±${detailsRes.data.title || 'Unknown Title'}±${item.quality || 'Unknown Quality'}`
      }));
      sections.push({
        title: "🎬 Cinesubz",
        rows: cinesubzRows
      });
    }

    const listMessage = {
      image: { url: imageUrl.replace("fit=", "") },
      text: cap,
      footer: `\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴ-ᴍᴅ 🔒🪄 | Uses TMDB API for posters`,
      title: "📥 Download Option",
      buttonText: "*Reply Below Number 🔢*",
      sections,
      callback: async (m, responseText, { reply }) => {
        // Handle the selected rowId
        if (responseText.startsWith(prefix + 'cinedl')) {
          const [, image, link, title, quality] = responseText.split('±');
          await reply(`🎥 *Downloading ${title} (${quality})*\n🔗 *Link*: ${link}`);
          // Optionally, implement download logic here
        } else {
          await reply('🚩 *Invalid selection!*');
        }
      }
    };

    return await conn.replyList(from, listMessage, mek);
  } catch (e) {
    console.error('Error in cinedl command:', e);
    await conn.sendMessage(from, { text: `🚩 *Error: ${e.message || 'Something went wrong!'}*` }, { quoted: mek });
  }
});
