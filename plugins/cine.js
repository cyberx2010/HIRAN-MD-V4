const axios = require('axios');

module.exports = {
  pattern: 'cinesubz',
  alias: ['cine'],
  desc: 'Interact with CineSubz via InfinityAPI (search, direct download, or movie info)',
  category: 'utility',
  react: '🎬',
  use: '.cinesubz <search|dl|info> <query/URL>',
  function: async (conn, mek, m, { from, args, reply }) => {
    try {
      if (!args[0]) return reply('Please specify a subcommand: search, dl, or info. Usage: .cinesubz search <movie name> | .cinesubz dl <CineSubz URL> | .cinesubz info <movie name>');

      const subcommand = args[0].toLowerCase();
      args.shift(); // Remove subcommand from args
      const query = args.join(' ');

      if (subcommand === 'search') {
        if (!query) return reply('Please provide a movie name. Usage: .cinesubz search <movie name>');
        const searchUrl = `https://api.infinityapi.org/cine-movie-search?name=${encodeURIComponent(query)}&api=Infinity-manoj-x-mizta`;
        const response = await axios.get(searchUrl);
        const data = response.data;

        if (!data || !data.results || data.results.length === 0) {
          return reply('No movies found for your query.');
        }

        let replyText = '🎥 Search Results:\n\n';
        data.results.slice(0, 5).forEach((movie, index) => {
          replyText += `${index + 1}. ${movie.title}\nLink: ${movie.url}\n\n`;
        });
        await reply(replyText);
      } else if (subcommand === 'dl') {
        if (!query) return reply('Please provide a CineSubz URL. Usage: .cinesubz dl <CineSubz URL>');
        if (!query.includes('cinesubz.co')) return reply('Invalid URL. Please provide a valid CineSubz URL.');

        const dlUrl = `https://api.infinityapi.org/cine-direct-dl?url=${query}&api=Infinity-FA240F-284CE-FC00-875A7`;
        const response = await axios.get(dlUrl);
        const data = response.data;

        if (!data || !data.directLink) {
          return reply('Could not retrieve direct download link.');
        }

        await reply(`Direct Download Link: ${data.directLink}`);
      } else if (subcommand === 'info') {
        if (!query) return reply('Please provide a movie name. Usage: .cinesubz info <movie name>');
        const infoUrl = `https://api.infinityapi.org/cine-minfo?query=${encodeURIComponent(query)}`;
        const response = await axios.get(infoUrl, {
          headers: {
            Authorization: 'Bearer Infinity-FA240F-284CE-FC00-875A7'
          }
        });
        const data = response.data;

        if (!data || !data.title) {
          return reply('No movie information found for your query.');
        }

        const infoText = `🎬 Movie Info:\n\nTitle: ${data.title}\nYear: ${data.year || 'N/A'}\nDescription: ${data.description || 'N/A'}\nRating: ${data.rating || 'N/A'}\nGenres: ${data.genres?.join(', ') || 'N/A'}\n`;
        await reply(infoText);
      } else {
        return reply('Invalid subcommand. Use: search, dl, or info.');
      }
    } catch (e) {
      console.error('[CINESUBZ PLUGIN ERROR]', e.message);
      await reply(`Error: ${e.message}. Please check your input or try again later.`);
    }
  }
};
