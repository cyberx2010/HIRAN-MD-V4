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
        let resultText =` *𝘾𝙄𝙉𝙀𝙎𝙐𝘽𝙕 𝙈𝙊𝙑𝙄𝙀 𝙎𝙀𝘼𝙍𝘾𝙃 𝙍𝙀𝙎𝙐𝙇𝙏𝙎 𝙁𝙊𝙍:* ${q}\n\n*Reply Below Number 🔢*\n\n`;
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

    // Fetch download links and subtitle author from info API
    const detailsApiUrl = `https://cinesub-info.vercel.app/?url=${encodeURIComponent(q)}&apikey=${config.CINE_API_KEY || 'dinithimegana'}`;
    const detailsRes = await fetchJson(detailsApiUrl);

    // Log the details API response for debugging
    console.log('Info API response:', JSON.stringify(detailsRes, null, 2));

    // Validate info API response
    if (!detailsRes || !detailsRes.data || !detailsRes.data.title) {
      return await reply(`*Error: Invalid response from info API. Please check your URL.*`);
    }
    if (!detailsRes.dl_links || !Array.isArray(detailsRes.dl_links) || detailsRes.dl_links.length === 0) {
      return await reply(`*Error: No download links found for the provided URL: ${q}*`);
    }

    // TMDB API key
    const tmdbApiKey = '68d5b6526b869106a270a6aea22a78e7';

    // Fetch TMDB configuration for image base URL
    let baseImageUrl = 'https://image.tmdb.org/t/p/w500';
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

    // Search TMDB for the movie
    let movieDetails = {};
    let imageUrl = 'https://files.catbox.moe/4fsn8g.jpg'; // Fallback image
    try {
      const tmdbSearchRes = await fetchJson(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(detailsRes.data.title)}`);
      console.log('TMDB search response:', JSON.stringify(tmdbSearchRes, null, 2));
      if (tmdbSearchRes.results?.[0]?.id) {
        // Fetch detailed movie data
        const movieId = tmdbSearchRes.results[0].id;
        const tmdbDetailsRes = await fetchJson(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbApiKey}`);
        console.log('TMDB movie details response:', JSON.stringify(tmdbDetailsRes, null, 2));

        movieDetails = {
          title: tmdbDetailsRes.title || 'Unknown Title',
          releaseDate: tmdbDetailsRes.release_date || 'N/A',
          rating: tmdbDetailsRes.vote_average ? `${tmdbDetailsRes.vote_average}/10` : 'N/A',
          runtime: tmdbDetailsRes.runtime ? `${tmdbDetailsRes.runtime} minutes` : 'N/A',
          country: tmdbDetailsRes.production_countries?.[0]?.name || 'N/A',
          director: tmdbDetailsRes.credits?.crew?.find(p => p.job === 'Director')?.name || 'Unknown',
          genres: tmdbDetailsRes.genres?.map(g => g.name).join(', ') || 'N/A',
          overview: tmdbDetailsRes.overview || 'No description available'
        };
        if (tmdbDetailsRes.poster_path) {
          imageUrl = `${baseImageUrl}${tmdbDetailsRes.poster_path}`;
        }
      } else {
        console.warn('No movie found in TMDB search:', tmdbSearchRes);
      }
    } catch (tmdbErr) {
      console.error('TMDB API error:', tmdbErr);
    }

    // Fallback to info API title if TMDB fails
    const finalTitle = movieDetails.title || detailsRes.data.title || 'Unknown Title';

    // Construct caption with TMDB details and info API subtitle author
    let cap = `*☘️ Title ➜* *${finalTitle}*\n\n` +
              `*📆 Release ➜* _${movieDetails.releaseDate || 'N/A'}_\n` +
              `*⭐ Rating ➜* _${movieDetails.rating || 'N/A'}_\n` +
              `*⏰ Runtime ➖* _${movieDetails.runtime || 'N/A'}_\n` +
              `*🌎 Country ➜* _${movieDetails.country || 'N/A'}_\n` +
              `*🎥 Director ➜* _${movieDetails.director || 'N/A'}_\n` +
              `*📚 Genres ➜* _${movieDetails.genres || 'N/A'}_\n` +
              `*💁 Subtitle Author ➜* _${detailsRes.data.subtitle_author || 'N/A'}_\n\n` +
              `*📖 Overview ➜* _${movieDetails.overview || 'No description available'}_`;

    const sections = [];

    if (Array.isArray(detailsRes.dl_links)) {
      const cinesubzRows = detailsRes.dl_links.map(item => ({
        title: `${item.quality || 'Unknown Quality'} (${item.size || 'Unknown Size'})`,
        rowId: `${prefix}cinedl ${imageUrl}±${item.link}±${finalTitle}±${item.quality || 'Unknown Quality'}`
      }));
      sections.push({
        title: "🎬 Cinesubz",
        rows: cinesubzRows
      });
    }

    const listMessage = {
      image: { url: imageUrl.replace("fit=", "") },
      text: cap,
      footer: `\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴ-ᴍᴅ 🔒🪄 | Uses TMDB API for movie details`,
      title: "📥 Download Option",
      buttonText: "*Reply Below Number 🔢*",
      sections,
      callback: async (m, responseText, { reply }) => {
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
