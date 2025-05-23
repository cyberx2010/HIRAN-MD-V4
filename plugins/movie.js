const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

const SEARCH_API = "https://api.infinityapi.org/sinhala-search";
const DETAILS_API = "https://api.infinityapi.org/sinhalasub-info";
const DOWNLOAD_API = "https://api.infinityapi.org/sinhalasubs-download";
const API_KEY = "Infinity-FA240F-284CE-FC00-875A7";

cmd({
    pattern: "movie",
    alias: ["moviedl", "films"],
    react: '🎬',
    category: "download",
    desc: "Search and download Sinhala movies",
    filename: __filename
}, async (robin, m, mek, { from, q, reply, text }) => {
    try {
        if (!q || q.trim() === '') return await reply('❌ Please provide a movie name! (e.g., Deadpool)');

        // 1. Search movies
        const searchUrl = `${SEARCH_API}?text=${encodeURIComponent(q)}&apikey=${API_KEY}`;
        let searchRes = await fetchJson(searchUrl);

        if (!searchRes || !searchRes.data || searchRes.data.length === 0)
            return await reply(`❌ No results found for: *${q}*`);

        // Prepare numbered list for user to reply
        let listMsg = `🎬 Search results for *${q}*:\n\n`;
        searchRes.data.forEach((movie, i) => {
            listMsg += `${i + 1}. ${movie.title}\n`;
        });
        listMsg += `\nReply with the number of the movie to see details and download links.`;

        // Save search results in session for reply selection
        robin.movieSearchResults = searchRes.data;

        await robin.sendMessage(from, { text: listMsg, quoted: mek });

    } catch (e) {
        console.error(e);
        await reply('❌ Error searching movies. Try again later.');
    }
});

cmd({
    pattern: /^(movie|moviedl|films)$/i,
    fromMe: true,
    desc: "Select movie number from search results",
    filename: __filename
}, async (robin, m, mek, { from, text, reply }) => {
    try {
        // Check if user has search results saved
        if (!robin.movieSearchResults) return;

        const sel = parseInt(text);
        if (!sel || sel < 1 || sel > robin.movieSearchResults.length)
            return await reply(`❌ Invalid selection! Reply with a number between 1 and ${robin.movieSearchResults.length}`);

        const movie = robin.movieSearchResults[sel - 1];

        // Fetch movie details
        const detailsUrl = `${DETAILS_API}?url=${encodeURIComponent(movie.url)}&apikey=${API_KEY}`;
        let detailsRes = await fetchJson(detailsUrl);

        if (!detailsRes || !detailsRes.data)
            return await reply('❌ Failed to get movie details.');

        const details = detailsRes.data;

        // Send movie details with poster image
        await robin.sendMessage(from, {
            image: { url: details.poster },
            caption: `🎬 *${details.title}*\n\n${details.description}\n\nAvailable qualities:\n${details.qualities.map((q,i) => `${i+1}. ${q}`).join('\n')}\n\nReply with the quality number to download.`,
            quoted: mek
        });

        // Save movie details for quality selection
        robin.selectedMovie = details;

    } catch (e) {
        console.error(e);
        await reply('❌ Error fetching movie details.');
    }
});

cmd({
    pattern: /^(movie|moviedl|films)$/i,
    fromMe: true,
    desc: "Select quality number to download",
    filename: __filename
}, async (robin, m, mek, { from, text, reply }) => {
    try {
        if (!robin.selectedMovie) return;

        const qualIndex = parseInt(text);
        if (!qualIndex || qualIndex < 1 || qualIndex > robin.selectedMovie.qualities.length)
            return await reply(`❌ Invalid quality selection! Reply with a number between 1 and ${robin.selectedMovie.qualities.length}`);
const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

const API_URL = "https://api.skymansion.site/movies-dl/search";
const DOWNLOAD_URL = "https://api.skymansion.site/movies-dl/download";
const API_KEY = config.MOVIE_API_KEY;

cmd({
    pattern: "movie",
    alias: ["moviedl", "films"],
    react: '🎬',
    category: "download",
    desc: "Search and download movies from PixelDrain",
    filename: __filename
}, async (robin, m, mek, { from, q, reply }) => {
    try {
        if (!q || q.trim() === '') return await reply('❌ Please provide a movie name! (e.g., Deadpool)');

        // Fetch movie search results
        const searchUrl = `${API_URL}?q=${encodeURIComponent(q)}&api_key=${API_KEY}`;
        let response = await fetchJson(searchUrl);

        if (!response || !response.SearchResult || !response.SearchResult.result.length) {
            return await reply(`❌ No results found for: *${q}*`);
        }

        const selectedMovie = response.SearchResult.result[0]; // Select first result
        const detailsUrl = `${DOWNLOAD_URL}/?id=${selectedMovie.id}&api_key=${API_KEY}`;
        let detailsResponse = await fetchJson(detailsUrl);

        if (!detailsResponse || !detailsResponse.downloadLinks || !detailsResponse.downloadLinks.result.links.driveLinks.length) {
            return await reply('❌ No PixelDrain download links found.');
        }

        // Select the 720p PixelDrain link
        const pixelDrainLinks = detailsResponse.downloadLinks.result.links.driveLinks;
        const selectedDownload = pixelDrainLinks.find(link => link.quality === "SD 480p");
        
        if (!selectedDownload || !selectedDownload.link.startsWith('http')) {
            return await reply('❌ No valid 480p PixelDrain link available.');
        }

        // Convert to direct download link
        const fileId = selectedDownload.link.split('/').pop();
        const directDownloadLink = `https://pixeldrain.com/api/file/${fileId}?download`;
        
        
        // Download movie
        const filePath = path.join(__dirname, `${selectedMovie.title}-480p.mp4`);
        const writer = fs.createWriteStream(filePath);
        
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
                fileName: `${selectedMovie.title}-480p.mp4`,
                caption: `🎬 *${selectedMovie.title}*\n📌 Quality: 480p\n✅ *Download Complete!*`,
                quoted: mek 
            });
            fs.unlinkSync(filePath);
        });

        writer.on('error', async (err) => {
            console.error('Download Error:', err);
            await reply('❌ Failed to download movie. Please try again.');
        });
    } catch (error) {
        console.error('Error in movie command:', error);
        await reply('❌ Sorry, something went wrong. Please try again later.');
    }
});

////////===================Firemovie

cmd({
    pattern: "firemovie",
    alias: ["moviefire", "moviesearch"],
    react: "🎬",
    desc: "Search Movies on Fire Movies Hub",
    category: "movie",
    use: ".firemovie <movie name>",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, q }) => {
    try {
        // Check if query is provided
        if (!q) {
            return await reply(`
*🎬 𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 𝐌𝐎𝐕𝐈𝐄 𝐒𝐄𝐀𝐑𝐂𝐇*

Usage: .firemovie <movie name>

Examples:
.firemovie Iron Man
.firemovie Avengers
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
