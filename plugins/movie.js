const axios = require('axios');
const {cmd} = require('../command');

cmd({
  pattern: "sinhalasub",
  alias: ["movie", "tvshow"],
  react: '📑',
  category: "download",
  desc: "Search movies or TV shows on SinhalaSub and get download links",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, replyMap }) => {
  try {
    if (!q) {
      return await reply("*Please provide a search query! (e.g., Deadpool or Game of Thrones)*");
    }

    // Search for movies or TV shows
    const searchUrl = `https://suhas-bro-api.vercel.app/movie/sinhalasub/search?text=${encodeURIComponent(q)}`;
    const searchResponse = await axios.get(searchUrl);
    const searchResults = searchResponse.data.result || [];
    const limitedResults = searchResults.slice(0, 10);

    if (!limitedResults.length) {
      return await reply(`No results found for: ${q}`);
    }

    // Construct search results message with image
    let responseText = `📽️ *Search Results for* "${q}":\n\n`;
    limitedResults.forEach((result, index) => {
      responseText += `*${index + 1}.* ${result.title} (${result.type === 'movie' ? 'Movie' : 'TV Show'})\n🔗 Link: ${result.link}\n\n`;
    });

    // Send search results with image
    const sentMessage = await conn.sendMessage(from, {
      text: responseText,
      contextInfo: {
        mentionedJid: [],
        externalAdReply: {
          title: `SinhalaSub Search: ${q}`,
          body: "Powered by SinhalaSub",
          mediaType: 1,
          thumbnailUrl: 'https://files.catbox.moe/4fsn8g.jpg',
          sourceUrl: 'https://sinhalasub.lk'
        }
      }
    }, { quoted: mek });
    const sentMessageId = sentMessage.key.id;

    // Add reply tracker for search results
    conn.addReplyTracker(sentMessageId, async (m, userMessage) => {
      const selectedNumber = parseInt(userMessage.trim());
      if (isNaN(selectedNumber) || selectedNumber < 1 || selectedNumber > limitedResults.length) {
        return await reply("Invalid selection. Please reply with a valid number.");
      }

      const selectedItem = limitedResults[selectedNumber - 1];
      const isMovie = selectedItem.type === 'movie';

      if (isMovie) {
        // Fetch movie details
        const movieUrl = `https://suhas-bro-api.vercel.app/movie/sinhalasub/movie?url=${encodeURIComponent(selectedItem.link)}`;
        try {
          const movieResponse = await axios.get(movieUrl);
          const movieDetails = movieResponse.data.result;
          const downloadLinks = movieDetails.dl_links || [];

          if (!downloadLinks.length) {
            return await reply("No PixelDrain links found for this movie.");
          }

          let downloadText = `🎥 *${movieDetails.title}*\n\n*Available PixelDrain Download Links:*\n`;
          downloadLinks.forEach((link, index) => {
            downloadText += `*${index + 1}.* ${link.quality} - ${link.size}\n🔗 Link: ${link.link}\n\n`;
          });

          const downloadMessage = await conn.sendMessage(from, {
            text: downloadText,
            contextInfo: {
              mentionedJid: [],
              externalAdReply: {
                title: movieDetails.title,
                body: "Download powered by SinhalaSub",
                mediaType: 1,
                thumbnailUrl: movieDetails.image || 'https://files.catbox.moe/4fsn8g.jpg',
                sourceUrl: selectedItem.link
              }
            }
          }, { quoted: m });
          const downloadMessageId = downloadMessage.key.id;

          // Add reply tracker for movie download links
          conn.addReplyTracker(downloadMessageId, async (m, downloadReplyText) => {
            const downloadNumber = parseInt(downloadReplyText.trim());
            if (isNaN(downloadNumber) || downloadNumber < 1 || downloadNumber > downloadLinks.length) {
              return await reply("Invalid selection. Please reply with a valid number.");
            }

            const selectedLink = downloadLinks[downloadNumber - 1];
            const fileId = selectedLink.link.split('/').pop();
            const fileUrl = `https://pixeldrain.com/api/file/${fileId}`;

            await conn.sendMessage(from, { react: { text: '⬇️', key: m.key } });
            await conn.sendMessage(from, {
              document: { url: fileUrl },
              mimetype: "video/mp4",
              fileName: `${movieDetails.title} - ${selectedLink.quality}.mp4`,
              caption: `${movieDetails.title}\nQuality: ${selectedLink.quality}\nPowered by SinhalaSub`,
              contextInfo: {
                mentionedJid: [],
                externalAdReply: {
                  title: movieDetails.title,
                  body: "Download powered by SinhalaSub",
                  mediaType: 1,
                  thumbnailUrl: movieDetails.image || 'https://files.catbox.moe/4fsn8g.jpg',
                  sourceUrl: selectedItem.link
                }
              }
            }, { quoted: m });

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
          });
        } catch (error) {
          console.error("Error fetching movie details:", error);
          await reply("An error occurred while fetching movie details. Please try again.");
        }
      } else {
        // Fetch TV show details
        const tvShowUrl = `https://suhas-bro-api.vercel.app/movie/sinhalasub/tvshow?url=${encodeURIComponent(selectedItem.link)}`;
        try {
          const tvShowResponse = await axios.get(tvShowUrl);
          const tvShowDetails = tvShowResponse.data.result;
          const episodes = tvShowDetails.episodes || [];

          if (!episodes.length) {
            return await reply("No episodes found for this TV show.");
          }

          let episodeText = `📺 *${tvShowDetails.title}*\n\n*Available Episodes:*\n`;
          episodes.forEach((episode, index) => {
            episodeText += `*${index + 1}.* ${episode.title}\n🔗 Link: ${episode.link}\n\n`;
          });

          const episodeMessage = await conn.sendMessage(from, {
            text: episodeText,
            contextInfo: {
              mentionedJid: [],
              externalAdReply: {
                title: tvShowDetails.title,
                body: "Powered by SinhalaSub",
                mediaType: 1,
                thumbnailUrl: tvShowDetails.image || 'https://files.catbox.moe/4fsn8g.jpg',
                sourceUrl: selectedItem.link
              }
            }
          }, { quoted: m });
          const episodeMessageId = episodeMessage.key.id;

          // Add reply tracker for episode selection
          conn.addReplyTracker(episodeMessageId, async (m, episodeReplyText) => {
            const episodeNumber = parseInt(episodeReplyText.trim());
            if (isNaN(episodeNumber) || episodeNumber < 1 || episodeNumber > episodes.length) {
              return await reply("Invalid episode selection. Please reply with a valid number.");
            }

            const selectedEpisode = episodes[episodeNumber - 1];
            const episodeUrl = `https://suhas-bro-api.vercel.app/movie/sinhalasub/episode?url=${encodeURIComponent(selectedEpisode.link)}`;

            try {
              const episodeResponse = await axios.get(episodeUrl);
              const episodeDetails = episodeResponse.data.result;
              const downloadLinks = episodeDetails.dl_links || [];

              if (!downloadLinks.length) {
                return await reply("No PixelDrain links found for this episode.");
              }

              let downloadText = `🎬 *${episodeDetails.title}*\n\n*Available PixelDrain Download Links:*\n`;
              downloadLinks.forEach((link, index) => {
                downloadText += `*${index + 1}.* ${link.quality} - ${link.size}\n🔗 Link: ${link.link}\n\n`;
              });

              const downloadMessage = await conn.sendMessage(from, {
                text: downloadText,
                contextInfo: {
                  mentionedJid: [],
                  externalAdReply: {
                    title: episodeDetails.title,
                    body: "Download powered by SinhalaSub",
                    mediaType: 1,
                    thumbnailUrl: episodeDetails.image || 'https://files.catbox.moe/4fsn8g.jpg',
                    sourceUrl: selectedEpisode.link
                  }
                }
              }, { quoted: m });
              const downloadMessageId = downloadMessage.key.id;

              // Add reply tracker for episode download links
              conn.addReplyTracker(downloadMessageId, async (m, downloadReplyText) => {
                const downloadNumber = parseInt(downloadReplyText.trim());
                if (isNaN(downloadNumber) || downloadNumber < 1 || downloadNumber > downloadLinks.length) {
                  return await reply("Invalid selection. Please reply with a valid number.");
                }

                const selectedLink = downloadLinks[downloadNumber - 1];
                const fileId = selectedLink.link.split('/').pop();
                const fileUrl = `https://pixeldrain.com/api/file/${fileId}`;

                await conn.sendMessage(from, { react: { text: '⬇️', key: m.key } });
                await conn.sendMessage(from, {
                  document: { url: fileUrl },
                  mimetype: "video/mp4",
                  fileName: `${episodeDetails.title} - ${selectedLink.quality}.mp4`,
                  caption: `${episodeDetails.title}\nQuality: ${selectedLink.quality}\nPowered by SinhalaSub`,
                  contextInfo: {
                    mentionedJid: [],
                    externalAdReply: {
                      title: episodeDetails.title,
                      body: "Download powered by SinhalaSub",
                      mediaType: 1,
                      thumbnailUrl: episodeDetails.image || 'https://files.catbox.moe/4fsn8g.jpg',
                      sourceUrl: selectedEpisode.link
                    }
                  }
                }, { quoted: m });

                await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
              });
            } catch (error) {
              console.error("Error fetching episode details:", error);
              await reply("An error occurred while fetching episode details. Please try again.");
            }
          });
        } catch (error) {
          console.error("Error fetching TV show details:", error);
          await reply("An error occurred while fetching TV show details. Please try again.");
        }
      }
    });
  } catch (error) {
    console.error("Error during search:", error);
    await reply("*An error occurred while searching!*");
  }
});
