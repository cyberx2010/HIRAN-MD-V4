const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const axios = require('axios');

cmd({
  pattern: "sinhalasub",
  alias: ["movie", "tvshow"],
  react: '📑',
  category: "download",
  desc: "Search movies or TV shows on SinhalaSub and get download links",
  filename: __filename
}, async (client, message, msgInfo, { from, q, reply }) => {
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

    // Send search results with the provided image
    const sentMessage = await client.sendMessage(from, {
      text: responseText,
      contextInfo: {
        mentionedJid: [],
        externalAdReply: {
          title: `SinhalaSub Search: ${q}`,
          body: "Powered by SinhalaSub",
          mediaType: 1,
          thumbnailUrl: 'https://files.catbox.moe/4fsn8g.jpg', // Add image to search results
          sourceUrl: 'https://sinhalasub.lk'
        }
      }
    }, { quoted: msgInfo });
    const sentMessageId = sentMessage.key.id;

    // Handle user selection
    client.ev.on("messages.upsert", async event => {
      const newMessage = event.messages[0];
      if (!newMessage.message) return;

      const userMessage = newMessage.message.conversation || newMessage.message.extendedTextMessage?.text;
      const isReplyToSearch = newMessage.message.extendedTextMessage && newMessage.message.extendedTextMessage.contextInfo.stanzaId === sentMessageId;

      if (isReplyToSearch) {
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

            const downloadMessage = await client.sendMessage(from, {
              text: downloadText,
              contextInfo: {
                mentionedJid: [],
                externalAdReply: {
                  title: movieDetails.title,
                  body: "Download powered by SinhalaSub",
                  mediaType: 1,
                  thumbnailUrl: movieDetails.image || 'https://files.catbox.moe/4fsn8g.jpg', // Fallback to provided image
                  sourceUrl: selectedItem.link
                }
              }
            }, { quoted: newMessage });
            const downloadMessageId = downloadMessage.key.id;

            // Handle download selection
            client.ev.on('messages.upsert', async event => {
              const downloadReply = event.messages[0];
              if (!downloadReply.message) return;

              const downloadReplyText = downloadReply.message.conversation || downloadReply.message.extendedTextMessage?.text;
              const isReplyToDownload = downloadReply.message.extendedTextMessage && downloadReply.message.extendedTextMessage.contextInfo.stanzaId === downloadMessageId;

              if (isReplyToDownload) {
                const downloadNumber = parseInt(downloadReplyText.trim());
                if (isNaN(downloadNumber) || downloadNumber < 1 || downloadNumber > downloadLinks.length) {
                  return await reply("Invalid selection. Please reply with a valid number.");
                }

                const selectedLink = downloadLinks[downloadNumber - 1];
                const fileId = selectedLink.link.split('/').pop();
                const fileUrl = `https://pixeldrain.com/api/file/${fileId}`;

                await client.sendMessage(from, { react: { text: '⬇️', key: msgInfo.key } });
                await client.sendMessage(from, {
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
                      thumbnailUrl: movieDetails.image || 'https://files.catbox.moe/4fsn8g.jpg', // Fallback to provided image
                      sourceUrl: selectedItem.link
                    }
                  }
                }, { quoted: downloadReply });

                await client.sendMessage(from, { react: { text: '✅', key: msgInfo.key } });
              }
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

            const episodeMessage = await client.sendMessage(from, {
              text: episodeText,
              contextInfo: {
                mentionedJid: [],
                externalAdReply: {
                  title: tvShowDetails.title,
                  body: "Powered by SinhalaSub",
                  mediaType: 1,
                  thumbnailUrl: tvShowDetails.image || 'https://files.catbox.moe/4fsn8g.jpg', // Fallback to provided image
                  sourceUrl: selectedItem.link
                }
              }
            }, { quoted: newMessage });
            const episodeMessageId = episodeMessage.key.id;

            // Handle episode selection
            client.ev.on('messages.upsert', async event => {
              const episodeReply = event.messages[0];
              if (!episodeReply.message) return;

              const episodeReplyText = episodeReply.message.conversation || episodeReply.message.extendedTextMessage?.text;
              const isReplyToEpisodes = episodeReply.message.extendedTextMessage && episodeReply.message.extendedTextMessage.contextInfo.stanzaId === episodeMessageId;

              if (isReplyToEpisodes) {
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

                  const downloadMessage = await client.sendMessage(from, {
                    text: downloadText,
                    contextInfo: {
                      mentionedJid: [],
                      externalAdReply: {
                        title: episodeDetails.title,
                        body: "Download powered by SinhalaSub",
                        mediaType: 1,
                        thumbnailUrl: episodeDetails.image || 'https://files.catbox.moe/4fsn8g.jpg', // Fallback to provided image
                        sourceUrl: selectedEpisode.link
                      }
                    }
                  }, { quoted: episodeReply });
                  const downloadMessageId = downloadMessage.key.id;

                  // Handle episode download selection
                  client.ev.on('messages.upsert', async event => {
                    const downloadReply = event.messages[0];
                    if (!downloadReply.message) return;

                    const downloadReplyText = downloadReply.message.conversation || downloadReply.message.extendedTextMessage?.text;
                    const isReplyToDownload = downloadReply.message.extendedTextMessage && downloadReply.message.extendedTextMessage.contextInfo.stanzaId === downloadMessageId;

                    if (isReplyToDownload) {
                      const downloadNumber = parseInt(downloadReplyText.trim());
                      if (isNaN(downloadNumber) || downloadNumber < 1 || downloadNumber > downloadLinks.length) {
                        return await reply("Invalid selection. Please reply with a valid number.");
                      }

                      const selectedLink = downloadLinks[downloadNumber - 1];
                      const fileId = selectedLink.link.split('/').pop();
                      const fileUrl = `https://pixeldrain.com/api/file/${fileId}`;

                      await client.sendMessage(from, { react: { text: '⬇️', key: msgInfo.key } });
                      await client.sendMessage(from, {
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
                            thumbnailUrl: episodeDetails.image || 'https://files.catbox.moe/4fsn8g.jpg', // Fallback to provided image
                            sourceUrl: selectedEpisode.link
                          }
                        }
                      }, { quoted: downloadReply });

                      await client.sendMessage(from, { react: { text: '✅', key: msgInfo.key } });
                    }
                  });
                } catch (error) {
                  console.error("Error fetching episode details:", error);
                  await reply("An error occurred while fetching episode details. Please try again.");
                }
              }
            });
          } catch (error) {
            console.error("Error fetching TV show details:", error);
            await reply("An error occurred while fetching TV show details. Please try again.");
          }
        }
      }
    });
  } catch (error) {
    console.error("Error during search:", error);
    await reply("*An error occurred while searching!*");
  }
});
.firemovie Spider-Man

*Tips:*
- Be specific with movie name
- Use full movie titles`);
        }

        // React to show processing
        await m.react("🔍");

        // Encode query for URL
        const encodedQuery = encodeURIComponent(q);

        // API Request for movie search
        const searchResponse = await axios.get(`https://www.dark-yasiya-api.site/movie/firemovie/search?text=${encodedQuery}`);

        // Validate search response
        if (!searchResponse.data || !searchResponse.data.status) {
            return await reply("❌ No movies found or API error.");
        }

        // Extract movies
        const movies = searchResponse.data.result.data;

        // Check if movies exist
        if (movies.length === 0) {
            return await reply(`❌ No movies found for "${q}".`);
        }

        // Prepare movie list message
        let desc = `*🔢 Please reply with the number you want to Select*
┏━━━━━━━━━━━━━━━━━━━━━━━━━━

${movies.map((movie, index) => `*${index + 1}. ${movie.title} (${movie.year})*
   📄 Type: ${movie.type}
   🔗 Link: ${movie.link}
`).join('\n')}

┗━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌───────────────────────────────────
*乂 𝐑𝐄𝐏𝐋𝐘 𝐓𝐇𝐄 𝐁𝐄𝐋𝐎𝐖 𝐍𝐔𝐌𝐁𝐄𝐑 𝐓𝐎 𝐆𝐄𝐓 𝐃𝐄𝐓𝐀𝐈𝐋𝐒乂* 
└───────────────────────────────────

> *ᴄʀᴇᴀᴛᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ*`;

        // Send the movie list with context
        const sentMsg = await conn.sendMessage(
            from,
            {
                text: desc,
                contextInfo: {
                    externalAdReply: {
                        title: `𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 𝐌𝐎𝐕𝐈𝐄 𝐒𝐄𝐀𝐑𝐂𝐇`,
                        body: `Search results for: ${q}`,
                        thumbnailUrl: movies[0].image,
                        sourceUrl: movies[0].link,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    },
                },
            },
            { quoted: mek }
        );

        const messageID = sentMsg.key.id;

        // Listen for user's response
        conn.ev.on("messages.upsert", async (messageUpdate) => {
            const mek = messageUpdate.messages[0];
            if (!mek.message) return;
            
            const messageType = 
                mek.message.conversation || 
                mek.message.extendedTextMessage?.text;
            
            const isReplyToSentMsg =
                mek.message.extendedTextMessage &&
                mek.message.extendedTextMessage.contextInfo.stanzaId === messageID;

            if (isReplyToSentMsg) {
                // Check if the reply is a valid number
                const selectedIndex = parseInt(messageType) - 1;
                
                if (selectedIndex >= 0 && selectedIndex < movies.length) {
                    const selectedMovie = movies[selectedIndex];

                    try {
                        // Fetch detailed movie information
                        const detailResponse = await axios.get(`https://www.dark-yasiya-api.site/movie/firemovie/movie?url=${encodeURIComponent(selectedMovie.link)}`);

                        if (!detailResponse.data || !detailResponse.data.status) {
                            return await reply("❌ Failed to fetch movie details.");
                        }

                        const movieDetails = detailResponse.data.result.data;

                        // React to the selection
                        await conn.sendMessage(from, {
                            react: { text: "🎬", key: mek.key }
                        });

                        // Prepare detailed movie message
                        const detailMessage = `
*🎬 〽️𝐨𝐯𝐢𝐞 𝐃𝐞𝐭𝐚𝐢𝐥𝐬 🎬*

☘️ *ᴛɪᴛʟᴇ*: ${movieDetails.title}\n
➥ *ʀᴇʟᴇᴀꜱᴇ ᴅᴀᴛᴇ*: ${movieDetails.date}\n
➥ *ᴅᴜʀᴀᴛɪᴏɴ*: ${movieDetails.duration}\n
➥ *ᴄᴀᴛᴇɢᴏʀʏ*: ${movieDetails.category.join(", ")}
➥ *ᴅɪʀᴇᴄᴛᴏʀ*: ${movieDetails.director}\n
➥ *ɪᴍᴅʙ ʀᴀᴛɪɴɢ*: ${movieDetails.tmdbRate}
➥ *ᴄᴀꜱᴛ*:
${movieDetails.cast.slice(0, 5).map(actor => `• ${actor.name}`).join('\n')}

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

                        // Send movie details with main image
                        const mediaMessage = await conn.sendMessage(from, {
                            image: { url: movieDetails.mainImage },
                            caption: detailMessage
                        }, { quoted: mek });

                        // Store movie details globally for download option
                        global.movieDownloadDetails = {
                            links: movieDetails.dl_links,
                            title: movieDetails.title
                        };

                        // Send download instruction message
                        await conn.sendMessage(from, {
                            text: `
*🔽 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 𝐎𝐏𝐓𝐈𝐎𝐍𝐒*

Reply with the number corresponding to the download quality:
${movieDetails.dl_links.map((link, index) => 
    `*${index + 1}.* ${link.quality} (${link.size})`
).join('\n')}

> ᴄʜᴏᴏꜱᴇ ʏᴏᴜʀ ᴘʀᴇꜰᴇʀʀᴇᴅ ᴅᴏᴡɴʟᴏᴀᴅ ᴏᴘᴛɪᴏɴ`,
                            contextInfo: {
                                externalAdReply: {
                                    title: "Movie Download",
                                    body: `Download ${movieDetails.title}`,
                                    mediaType: 1
                                }
                            }
                        }, { quoted: mediaMessage });

                    } catch (detailError) {
                        console.error("Movie Detail Fetch Error:", detailError);
                        await reply("❌ Failed to fetch movie details.");
                    }
                } else {
                    // Invalid number selected
                    await conn.sendMessage(from, {
                        react: { text: "❓", key: mek.key }
                    });
                    reply("Please enter a valid movie number!");
                }
            } else if (global.movieDownloadDetails) {
                // Handle download option selection
                const selectedDownloadIndex = parseInt(messageType) - 1;
                
                if (selectedDownloadIndex >= 0 && 
                    selectedDownloadIndex < global.movieDownloadDetails.links.length) {
                    
                    const selectedDownload = global.movieDownloadDetails.links[selectedDownloadIndex];
                    
                    // Send download link and file
                    await conn.sendMessage(from, {
                        react: { text: "📥", key: mek.key }
                    });

                    // Show processing message
                    const processingMsg = await reply(`*Downloading your movie... 📥*
*Wait few minutes...*

> *© ᴄʀᴇᴀᴛᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ*`);

                    try {
                        // Download the file
                        const downloadResponse = await axios({
                            method: 'get',
                            url: selectedDownload.link,
                            responseType: 'arraybuffer',
                            maxContentLength: Infinity,
                            maxBodyLength: Infinity,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                            }
                        });

                     
                    // Generate a random filename
                    const sanitizedTitle = global.movieDownloadDetails.title
                            .replace(/[^a-zA-Z0-9]/g, '_')
                            .replace(/__+/g, '_')
                            .substring(0, 50);
                      
                        const filename = `🎬𝐇𝐈𝐑𝐀𝐍-𝐌𝐃 𝐌𝐎𝐕𝐈𝐄 𝐃𝐋🎬${sanitizedTitle}${selectedDownload.quality}.mp4`;
                        const tempFilePath = path.join(__dirname, 'temp', filename);

                        // Ensure temp directory exists
                        await fs.mkdir(path.join(__dirname, 'temp'), { recursive: true });

                        // Write the file temporarily
                        await fs.writeFile(tempFilePath, downloadResponse.data);

                        
                        // Send the file
                        const fileMessage = await conn.sendMessage(from, {
                            document: { 
                                url: tempFilePath },
                            mimetype: 'video/mp4',
                            fileName: filename,
                            caption: `
*ᴛɪᴛʟᴇ*: ${global.movieDownloadDetails.title}
*Qᴜᴀʟɪᴛʏ*: ${selectedDownload.quality}
*ꜱɪᴢᴇ*: ${selectedDownload.size}
*ᴄʀᴇᴀᴛᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ*`
                        }, { quoted: mek });

                        // Clean up temporary file after a delay
                        setTimeout(async () => {
                            try {
                                await fs.unlink(tempFilePath);
                            } catch (cleanupError) {
                                console.log("Temp file cleanup error:", cleanupError);
                            }
                        }, 5 * 60 * 1000); // 5 minutes dela𝚢

                    } catch (downloadError) {
                        console.error("Movie Download Error:", downloadError);

                        // Detailed error handling
                        let errorMessage = "❌ Download failed. ";
                        if (downloadError.response) 
                        {
                            switch (downloadError.response.status) {
                                case 404:
                                    errorMessage += "Download link is no longer valid.";
                                    break;
                                case 403:
                                    errorMessage += "Access to the file is restricted.";
                                    break;
                                case 500:
                                    errorMessage += "Server error occurred.";
                                    break;
                                default:
                                    errorMessage += `HTTP Error: ${downloadError.response.status}`;
                            }
                        } else if (downloadError.code) {
                            switch (downloadError.code) {
                                case 'ECONNABORTED':
                                    errorMessage += "Download timed out.";
                                    break;
                                case 'ENOTFOUND':
                                    errorMessage += "Unable to connect to download server.";
                                    break;
                                default:
                                    errorMessage += `Network Error: ${downloadError.code}`;
                            }
                        } else {
                            errorMessage += "An unexpected error occurred.";
                        }

                        // Send error message
                        await reply(errorMessage);

                        // React to error
                        await conn.sendMessage(from, {
                            react: { text: "❌", key: mek.key }
                        });
                    }

                    // Clean up global store
                    delete global.movieDownloadDetails;
                }
            }
        });
    } catch (error) {
        console.error("Movie Search Error:", error);
        await reply("❌ An error occurred during the movie search.");
    }
});
