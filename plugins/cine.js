const axios = require('axios');

module.exports = {
  pattern: 'movie',  // command: .movie <movie name>
  fromMe: false,
  desc: 'Search movie, get details and download link with poster thumbnail',
  type: 'download',
  filename: __filename,
  async function(conn, mek, m, { q, reply }) {
    if (!q) return reply('Please provide a movie name to search.');

    const API_KEY = process.env.INFINITY_API_KEY || 'SW5maW5pdHktRkEyNDBGLTI4NENFLUZDMDAtODc1QTc=';

    try {
      // 1. Search movies
      const searchRes = await axios.get('https://api.infinityapi.org/cine-movie-search', {
        headers: { Authorization: `Bearer ${API_KEY}` },
        params: { name: q }
      });

      const movies = searchRes.data?.result || [];
      if (movies.length === 0) return reply('No movies found.');

      // Build search results message
      let searchMsg = '*Search results:*\n\n';
      movies.forEach((movie, i) => {
        searchMsg += `${i + 1}. ${movie.title}\n`;
      });
      searchMsg += '\nReply with the number to get movie details and download links.';

      await conn.sendMessage(m.from, { text: searchMsg }, { quoted: m });

      // Wait for user to reply with the movie number (timeout 30 sec)
      const filter = (msg) =>
        !msg.key.fromMe &&
        msg.key.remoteJid === m.from &&
        msg.message &&
        (msg.message.conversation || msg.message.extendedTextMessage?.text);

      const chosenIndex = await new Promise((resolve, reject) => {
        const handler = async ({ messages }) => {
          const msg = messages[0];
          if (filter(msg)) {
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
            const selected = parseInt(text);
            if (!isNaN(selected) && selected > 0 && selected <= movies.length) {
              resolve(selected - 1);
              conn.ev.off('messages.upsert', handler);
            } else {
              await conn.sendMessage(m.from, { text: 'Invalid number, please try again.' }, { quoted: msg });
            }
          }
        };

        conn.ev.on('messages.upsert', handler);
        setTimeout(() => {
          conn.ev.off('messages.upsert', handler);
          resolve(null);
        }, 30000);
      });

      if (chosenIndex === null) return reply('Timeout. Please try again.');

      const chosenMovie = movies[chosenIndex];

      // 2. Get movie details
      const infoRes = await axios.get('https://api.infinityapi.org/cine-minfo', {
        headers: { Authorization: `Bearer ${API_KEY}` },
        params: { url: chosenMovie.movieLink }
      });
      const movieInfo = infoRes.data;

      // 3. Get direct download links
      const dlRes = await axios.get('https://api.infinityapi.org/cine-direct-dl', {
        headers: { Authorization: `Bearer ${API_KEY}` },
        params: { url: movieInfo.downloadLink }
      });

      const dlData = dlRes.data;
      if (!dlData.result || dlData.result.length === 0) return reply('No download links found.');

      // Prepare download message
      let dlMsg = `*${chosenMovie.title}*\n\n${movieInfo.description || ''}\n\n*Download Links:*\n`;
      dlData.result.forEach((item, i) => {
        dlMsg += `${i + 1}. ${item.quality} - ${item.format}\n${item.link}\n\n`;
      });

      // Send video with poster thumbnail if available
      const posterUrl = chosenMovie.poster || movieInfo.poster || null;
      const firstLink = dlData.result[0].link;

      if (posterUrl) {
        const thumbResp = await axios.get(posterUrl, { responseType: 'arraybuffer' });
        const thumbnailBuffer = Buffer.from(thumbResp.data);

        await conn.sendMessage(m.from, {
          video: { url: firstLink },
          jpegThumbnail: thumbnailBuffer,
          caption: dlMsg,
          mimetype: 'video/mp4'
        }, { quoted: m });
      } else {
        await conn.sendMessage(m.from, { text: dlMsg }, { quoted: m });
      }
    } catch (error) {
      console.error(error);
      reply('Failed to fetch movie data. Please try again later.');
    }
  }
};
