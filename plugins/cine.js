const { fetchJson, sleep } = require('../lib/functions');
const axios = require('axios');
const { cmd } = require('../command');
const { sinhalaSub } = require('mrnima-moviedl');
require('dotenv').config();

// Helper: Retry API Calls
const fetchWithRetry = async (url, retries = 3, backoff = 1000) => {
    try {
        return await axios.get(url, { timeout: 10000 });
    } catch (error) {
        if (retries === 0 || (error.response && error.response.status !== 429)) {
            throw new Error(`Failed to fetch ${url}: ${error.message}`);
        }
        await sleep(backoff);
        return fetchWithRetry(url, retries - 1, backoff * 2);
    }
};

// Helper: Validate File Size
const validateFileSize = (size) => {
    if (!size || typeof size !== 'string') return true; // Assume valid if unknown
    const match = size.match(/(\d*\.?\d+)\s*(GB|MB)/i);
    if (!match) return true;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const sizeMB = unit === 'GB' ? value * 1024 : value;
    return sizeMB <= 2000; // WhatsApp limit ~2GB
};

// SinhalaSub Command
cmd({
    pattern: "sinhalasub",
    react: '📑',
    category: "movie",
    desc: "Search movies on SinhalaSub and get download links or details",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isMe }) => {
    try {
        // Validate search query
        if (!q || !/^[a-zA-Z0-9\s]+$/.test(q)) {
            return await reply('*Please provide a valid search query! (e.g., Deadpool)*');
        }

        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        // Search movies
        const movie = await sinhalaSub();
        const results = await movie.search(q);
        const searchResults = results.result?.slice(0, 10) || [];

        if (!searchResults.length) {
            return await reply(`No results found for: ${q}`);
        }

        // Send search results
        const resultsMessage = `📽️ *Search Results for* "${q}":\n\n` +
            searchResults.map((r, i) => `*${i + 1}.* ${r.title}\n🔗 Link: ${r.link}\n`).join('\n');
        const sentMsg = await conn.sendMessage(from, { text: resultsMessage }, { quoted: mek });

        // Handle movie selection
        conn.addReplyTracker(sentMsg.key.id, async (mek, messageType) => {
            const selectedNumber = parseInt(messageType.trim());
            if (isNaN(selectedNumber) || selectedNumber <= 0 || selectedNumber > searchResults.length) {
                return await reply('Invalid selection. Please reply with a valid number.');
            }

            const selectedMovie = searchResults[selectedNumber - 1];
            const apiUrl = `https://api-site-2.vercel.app/api/sinhalasub/movie?url=${encodeURIComponent(selectedMovie.link)}`;
            let movieData;
            try {
                const response = await fetchWithRetry(apiUrl);
                movieData = response.data.result;
                if (!movieData || !movieData.title) throw new Error('Invalid movie data');
            } catch (error) {
                console.error('Error fetching movie details:', error.message);
                return await reply(`*Error fetching movie details: ${error.message || 'Please try again.'}*`);
            }

            // Send movie menu with poster
            const year = movieData.date?.match(/\d{4}/)?.[0] || 'N/A';
            const posterUrl = movieData.image || 'https://files.catbox.moe/lacqi4.jpg';
            const menuMessage = `*🎥 ${movieData.title} (${year})*\n\n` +
                `🔢 *Reply with:*\n*1.* Download\n*2.* Details\n\n` +
                `> ⚜️ ᴅᴇᴠᴇʟᴏᴘᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;
            const menuMsg = await conn.sendMessage(from, {
                image: { url: posterUrl },
                caption: menuMessage,
                contextInfo: {
                    mentionedJid: [],
                    groupMentions: [],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363401446603948@newsletter',
                        newsletterName: '𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 💚',
                        serverMessageId: 999
                    },
                    externalAdReply: {
                        title: movieData.title,
                        body: 'ʜɪʀᴀɴ ᴍᴅ ᴍᴏᴠɪᴇ',
                        mediaType: 1,
                        sourceUrl: selectedMovie.link,
                        thumbnailUrl: posterUrl,
                        renderLargerThumbnail: true,
                        showAdAttribution: true
                    }
                }
            }, { quoted: mek });

            // Handle menu selection
            conn.addReplyTracker(menuMsg.key.id, async (mek, optionType) => {
                const option = optionType.trim();
                if (option === '1') {
                    // Download option
                    const pixelDrainLinks = movieData.dl_links || [];
                    if (!pixelDrainLinks.length) {
                        return await reply('No PixelDrain links found.');
                    }

                    // Validate file sizes
                    const validLinks = pixelDrainLinks.filter(link => validateFileSize(link.size));
                    if (!validLinks.length) {
                        return await reply('*No downloadable links under 2GB available.* Try another movie.');
                    }

                    // Send download links
                    const downloadMessage = `🎥 *${movieData.title}*\n\n` +
                        `*Available PixelDrain Download Links:*\n` +
                        validLinks.map((link, i) => `*${i + 1}.* ${link.quality} - ${link.size}\n`).join('\n');
                    const pixelDrainMsg = await conn.sendMessage(from, { text: downloadMessage }, { quoted: mek });

                    // Handle quality selection
                    conn.addReplyTracker(pixelDrainMsg.key.id, async (mek, pdMessageType) => {
                        const qualityNumber = parseInt(pdMessageType.trim());
                        if (isNaN(qualityNumber) || qualityNumber <= 0 || qualityNumber > validLinks.length) {
                            return await reply('Invalid selection. Please reply with a valid number.');
                        }

                        const selectedLink = validLinks[qualityNumber - 1];
                        const fileIdMatch = selectedLink.link.match(/\/u\/([^/]+)$/);
                        if (!fileIdMatch) {
                            return await reply('Invalid PixelDrain URL format.');
                        }
                        const fileId = fileIdMatch[1];
                        const directDownloadUrl = `https://pixeldrain.com/api/file/${fileId}`;
                        const sendto = isMe ? process.env.MOVIE_JID || from : from;

                        await conn.sendMessage(from, { react: { text: '⬇️', key: pixelDrainMsg.key } });

                        // Construct caption
                        const caption = `*☘️ 𝗧ɪᴛʟᴇ ➮* *${movieData.title}*\n\n` +
                            `*📅 𝗥ᴇʟᴇᴀꜱᴇᴅ ᴅᴀᴛᴇ ➮* ${movieData.date || 'N/A'}\n` +
                            `*🌎 𝗖ᴏᴜɴᴛʀʏ ➮* ${movieData.country || 'N/A'}\n` +
                            `*💃 𝗥ᴀᴛɪɴɢ ➮* ${movieData.imdb || 'N/A'}\n` +
                            `*⏰ �_Rᴜɴᴛɪᴍᴇ ➮* ${movieData.runtime || 'N/A'}\n` +
                            `*💁‍♂️ 𝗦ᴜʙᴛɪᴛʟᴇ ʙʏ ➮* ${movieData.subtitle || 'N/A'}\n` +
                            `*🎭 �_Gᴇɴᴀʀᴇꜱ ➮* ${movieData.genre || '.NEW, Action, Drama'}\n\n` +
                            `> ⚜️ ᴅᴇᴠᴇʟᴏᴘᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

                        try {
                            // Verify download URL
                            await fetchWithRetry(directDownloadUrl);
                            await conn.sendMessage(sendto, {
                                document: { url: directDownloadUrl },
                                mimetype: "video/mp4",
                                fileName: `${movieData.title} - ${selectedLink.quality}.mp4`,
                                caption,
                                contextInfo: {
                                    mentionedJid: [],
                                    groupMentions: [],
                                    forwardingScore: 999,
                                    isForwarded: true,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterJid: '120363401446603948@newsletter',
                                        newsletterName: '𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 💚',
                                        serverMessageId: 999
                                    },
                                    externalAdReply: {
                                        title: movieData.title,
                                        body: 'ʜɪʀᴀɴ ᴍᴅ ᴍᴏᴠɪᴇ',
                                        mediaType: 1,
                                        sourceUrl: selectedMovie.link,
                                        thumbnailUrl: posterUrl,
                                        renderLargerThumbnail: true,
                                        showAdAttribution: true
                                    }
                                }
                            }, { quoted: mek });
                            await conn.sendMessage(from, { react: { text: '✅', key: pixelDrainMsg.key } });
                        } catch (error) {
                            console.error('Error sending file:', error.message);
                            await reply(`*Error sending file: ${error.message || 'File may be too large or unavailable.'} Download here: ${directDownloadUrl}*`);
                        }
                    });
                } else if (option === '2') {
                    // Details option
                    const detailsMessage = `*🎥 Movie Details: ${movieData.title}*\n\n` +
                        `*📅 Released Date:* ${movieData.date || 'N/A'}\n` +
                        `*🌎 Country:* ${movieData.country || 'N/A'}\n` +
                        `*💃 IMDb Rating:* ${movieData.imdb || 'N/A'}\n` +
                        `*⏰ Runtime:* ${movieData.runtime || 'N/A'}\n` +
                        `*💁‍♂️ Subtitle By:* ${movieData.subtitle || 'N/A'}\n` +
                        `*🎭 Genres:* ${movieData.genre || '.NEW, Action, Drama'}\n` +
                        `*🔗 Link:* ${selectedMovie.link}\n\n` +
                        `> ⚜️ ᴅᴇᴠᴇʟᴏᴘᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;
                    await conn.sendMessage(from, { text: detailsMessage }, { quoted: mek });
                } else {
                    await reply('Invalid option. Please reply with 1 or 2.');
                }
            });
        });
    } catch (error) {
        console.error('Error during SinhalaSub search:', error.message);
        await reply(`*Error: ${error.message || 'An unexpected error occurred.'}*`);
    }
});

// CineSubz Command
cmd({
    pattern: "cinesubz",
    alias: ["cine"],
    react: "🎬",
    category: "movie",
    desc: "Search and download movies from CineSubz",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isMe }) => {
    try {
        // Validate input query
        if (!q || !/^[a-zA-Z0-9\s]+$/.test(q)) {
            return await reply('*Please provide a valid movie name to search! (e.g., Avatar)*');
        }

        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        // Search movies from CineSubz API
        const searchResponse = await fetchWithRetry(
            `https://cinesubz-api-zazie.vercel.app/api/search?q=${encodeURIComponent(q)}`
        );
        const searchData = searchResponse.data;

        if (!searchData.status || !searchData.result?.data?.length) {
            return await reply(`*No results found for:* "${q}"`);
        }

        const searchResults = searchData.result.data.slice(0, 10);
        const resultsMessage = `*𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 𝐂𝐈𝐍𝐄𝐒𝐔𝐁𝐙 𝐒𝐄𝐀𝐑𝐂𝐇*\n\n🎥 *Search Results for* "${q}":\n\n` +
            searchResults.map((r, i) => `*${i + 1}.* ${r.title} (${r.year})\n🔗 Link: ${r.link}\n`).join('\n');

        await sleep(2000); // Delay for better UX
        const sentMsg = await conn.sendMessage(from, { text: resultsMessage }, { quoted: mek });

        // Handle movie selection
        conn.addReplyTracker(sentMsg.key.id, async (mek, messageType) => {
            const selectedNumber = parseInt(messageType.trim());
            if (isNaN(selectedNumber) || selectedNumber <= 0 || selectedNumber > searchResults.length) {
                return await reply('Invalid selection. Please reply with a valid number.');
            }

            const selectedMovie = searchResults[selectedNumber - 1];
            let movieData;
            try {
                const movieResponse = await fetchWithRetry(
                    `https://cinesubz-api-zazie.vercel.app/api/movie?url=${encodeURIComponent(selectedMovie.link)}`
                );
                movieData = movieResponse.data;
                if (!movieData.status || !movieData.result.data) throw new Error('Invalid movie data');
            } catch (error) {
                console.error('Error fetching movie details:', error.message);
                return await reply(`*Error fetching movie details: ${error.message || 'Please try again.'}*`);
            }

            const { title, imdbRate, image, date, country, duration, dl_links } = movieData.result.data;

            // Send movie menu with poster
            const year = date?.match(/\d{4}/)?.[0] || 'N/A';
            const posterUrl = image || 'https://files.catbox.moe/lacqi4.jpg';
            const menuMessage = `*🎥 ${title} (${year})*\n\n` +
                `🔢 *Reply with:*\n*1.* Download\n*2.* Details\n\n` +
                `> ⚜️ ᴅᴇᴠᴇʟᴏᴘᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;
            const menuMsg = await conn.sendMessage(from, {
                image: { url: posterUrl },
                caption: menuMessage,
                contextInfo: {
                    mentionedJid: [],
                    groupMentions: [],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363401446603948@newsletter',
                        newsletterName: '𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 💚',
                        serverMessageId: 999
                    },
                    externalAdReply: {
                        title,
                        body: 'ʜɪʀᴀɴ ᴍᴅ ᴍᴏᴠɪᴇ',
                        mediaType: 1,
                        sourceUrl: selectedMovie.link,
                        thumbnailUrl: posterUrl,
                        renderLargerThumbnail: true,
                        showAdAttribution: true
                    }
                }
            }, { quoted: mek });

            // Handle menu selection
            conn.addReplyTracker(menuMsg.key.id, async (mek, optionType) => {
                const option = optionType.trim();
                if (option === '1') {
                    // Download option
                    if (!dl_links.length) {
                        return await reply('*No download links available for this movie.*');
                    }

                    // Validate file sizes
                    const validLinks = dl_links.filter(link => validateFileSize(link.size));
                    if (!validLinks.length) {
                        return await reply('*No downloadable links under 2GB available.* Try another movie.');
                    }

                    // Send download links
                    const downloadMessage = `🎥 *${title}*\n\n` +
                        `*Available Download Links:*\n` +
                        validLinks.map((link, i) => `*${i + 1}.* ${link.quality} - ${link.size}\n`).join('\n');
                    const sentDownloadMsg = await conn.sendMessage(from, { text: downloadMessage }, { quoted: mek });

                    // Handle quality selection
                    conn.addReplyTracker(sentDownloadMsg.key.id, async (mek, downloadMessageType) => {
                        const selectedQuality = parseInt(downloadMessageType.trim());
                        if (isNaN(selectedQuality) || selectedQuality <= 0 || selectedQuality > validLinks.length) {
                            return await reply('Invalid selection. Please reply with a valid number.');
                        }

                        const selectedLink = validLinks[selectedQuality - 1];
                        let movieLinkData;
                        try {
                            const movieLinkResponse = await fetchWithRetry(
                                `https://cinesubz-api-zazie.vercel.app/api/links?url=${encodeURIComponent(selectedLink.link)}`
                            );
                            movieLinkData = movieLinkResponse.data;
                            if (!movieLinkData.result.direct) throw new Error('No direct download link');
                        } catch (error) {
                            console.error('Error fetching download link:', error.message);
                            return await reply(`*Error fetching download link: ${error.message || 'Please try again.'}*`);
                        }

                        const downloadUrl = movieLinkData.result.direct;
                        const sendto = isMe ? process.env.MOVIE_JID || from : from;

                        await conn.sendMessage(from, { react: { text: '⬇️', key: sentDownloadMsg.key } });

                        // Construct caption
                        const caption = `*☘️ 𝗧ɪᴛʟᴇ ➮* *${title}*\n\n` +
                            `*📅 𝗥ᴇʟᴇᴀꜱᴇᴅ ᴅᴀᴛᴇ ➮* ${date || 'N/A'}\n` +
                            `*🌎 𝗖ᴏᴜɴᴛʀʏ ➮* ${country || 'N/A'}\n` +
                            `*💃 𝗥ᴀᴛɪɴɢ ➮* ${imdbRate || 'N/A'}\n` +
                            `*⏰ 𝗥ᴜɴᴛɪᴍᴇ ➮* ${duration || 'N/A'}\n` +
                            `*💁‍♂️ 𝗦ᴜʙᴛɪᴛʟᴇ ʙʏ ➮* ${movieData.result.data.subtitle || 'N/A'}\n` +
                            `*🎭 �_Gᴇɴᴀʀᴇꜱ ➮* ${movieData.result.data.genre || '.NEW, Action, Drama'}\n\n` +
                            `> ⚜️ ᴅᴇᴠᴇʟᴏᴘᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

                        try {
                            // Verify download URL
                            await fetchWithRetry(downloadUrl);
                            await conn.sendMessage(sendto, {
                                document: { url: downloadUrl },
                                mimetype: "video/mp4",
                                fileName: `${title} - ${selectedLink.quality}.mp4`,
                                caption,
                                contextInfo: {
                                    mentionedJid: [],
                                    groupMentions: [],
                                    forwardingScore: 999,
                                    isForwarded: true,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterJid: '120363401446603948@newsletter',
                                        newsletterName: '𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 💚',
                                        serverMessageId: 999
                                    },
                                    externalAdReply: {
                                        title,
                                        body: 'ʜɪʀᴀɴ ᴍᴅ ᴍᴏᴠɪᴇ',
                                        mediaType: 1,
                                        sourceUrl: selectedMovie.link,
                                        thumbnailUrl: posterUrl,
                                        renderLargerThumbnail: true,
                                        showAdAttribution: true
                                    }
                                }
                            }, { quoted: mek });
                            await conn.sendMessage(from, { react: { text: '✅', key: sentDownloadMsg.key } });
                        } catch (error) {
                            console.error('Error sending file:', error.message);
                            await reply(`*Error sending file: ${error.message || 'File may be too large or unavailable.'} Download here: ${downloadUrl}*`);
                        }
                    });
                } else if (option === '2') {
                    // Details option
                    const detailsMessage = `*🎥 Movie Details: ${title}*\n\n` +
                        `*📅 Released Date:* ${date || 'N/A'}\n` +
                        `*🌎 Country:* ${country || 'N/A'}\n` +
                        `*💃 IMDb Rating:* ${imdbRate || 'N/A'}\n` +
                        `*⏰ Runtime:* ${duration || 'N/A'}\n` +
                        `*💁‍♂️ Subtitle By:* ${movieData.result.data.subtitle || 'N/A'}\n` +
                        `*🎭 Genres:* ${movieData.result.data.genre || '.NEW, Action, Drama'}\n` +
                        `*🔗 Link:* ${selectedMovie.link}\n\n` +
                        `> ⚜️ ᴅᴇᴠᴇʟᴏᴘᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;
                    await conn.sendMessage(from, { text: detailsMessage }, { quoted: mek });
                } else {
                    await reply('Invalid option. Please reply with 1 or 2.');
                }
            });
        });
    } catch (error) {
        console.error('Error during CineSubz search:', error.message);
        await reply(`*Error: ${error.message || 'An unexpected error occurred.'}*`);
    }
});
