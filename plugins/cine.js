const axios = require('axios');

module.exports = {
  pattern: 'movie',  // command name: .movie <search term>
  fromMe: false,
  desc: 'Search movie, get details and download link with poster thumbnail',
  type: 'download',
  async function(conn, mek, m, { q, reply }) {
    if (!q) return reply('Please provide a movie name to search.');

    const API_KEY = process.env.INFINITY_API_KEY || 'YOUR_API_KEY_HERE';

    try {
      // 1. Search movies
      let searchRes = await axios.get('https://api.infinityapi.org/cine-movie-search', {
        headers: { Authorization: `Bearer ${API_KEY}` },
        params: { name: q }
      });

      const movies = searchRes.data?.result || [];
      if (movies.length === 0) return reply('No movies found.');

      // Build search result message
      let msg = '*Search results:*\n\n';
      movies.forEach((movie, i) => {
        msg += `${i + 1}. ${movie.title}\n`;
      });
      msg += '\nReply with the number to get details and download links.';

      // Send the search list and wait for reply
      await conn.sendMessage(m.from, { text: msg }, { quoted: m });

      // Wait for next message from the same user to pick movie
      const filter = (msg) => {
        return msg.key.fromMe === false && msg.key.remoteJid === m.from;
      };

      // Simple reply listener with timeout
      const pickedMovieIndex = await new Promise((resolve, reject) => {
        const collector = conn.ev.on('messages.upsert', async ({ messages }) => {
          const msg = messages[0];
          if (filter(msg)) {
            const selected = parseInt(msg.message.conversation || msg.message.extendedTextMessage?.text);
            if (!isNaN(selected) && selected >= 1 && selected <= movies.length) {
              resolve(selected - 1);
              collector.off();
            } else {
              await conn.sendMessage(m.from, { text: 'Invalid number, try again.' }, { quoted: msg });
            }
          }
        });
        setTimeout(() => {
          reject(new Error('Timeout waiting for movie selection.'));
          collector.off();
        }, 30000);
      }).catch(e => { return null; });

      if (pickedMovieIndex === null) return reply('Timed out. Please try again.');

      const chosenMovie = movies[pickedMovieIndex];

      // 2. Get movie info by movie link
      let infoRes = await axios.get('https://api.infinityapi.org/cine-minfo', {
        headers: { Authorization: `Bearer ${API_KEY}` },
        params: { url: chosenMovie.movieLink }
      });

      const movieInfo = infoRes.data;

      // 3. Get direct download links
      let dlRes = await axios.get('https://api.infinityapi.org/cine-direct-dl', {
        headers: { Authorization: `Bearer ${API_KEY}` },
        params: { url: movieInfo.downloadLink }  // use downloadLink from movie info
      });

      const dlData = dlRes.data;

      if (!dlData.result || dlData.result.length === 0) return reply('No download links found.');

      // Prepare download links message
      let dlMsg = `*${chosenMovie.title}*\n\n${movieInfo.description || ''}\n\n*Download Links:*\n`;
      dlData.result.forEach((item, idx) => {
        dlMsg += `${idx + 1}. ${item.quality} - ${item.format}\n${item.link}\n\n`;
      });

      // 4. Send video with thumbnail (poster)
      const posterUrl = chosenMovie.poster || movieInfo.poster || null;
      const firstLink = dlData.result[0].link;

      if (posterUrl) {
        // Download poster buffer
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