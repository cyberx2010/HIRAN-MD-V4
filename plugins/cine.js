const { fetchJson, sleep } = require('../lib/functions');
const axios = require('axios');
const { cmd } = require('../command');
require('dotenv').config();

// Helper: Retry API Calls
const fetchWithRetry = async (url, retries = 3, backoff = 1000) => {
    try {
        const response = await axios.get(url, { timeout: 10000 });
        console.log(`API Response for ${url}:`, JSON.stringify(response.data, null, 2));
        return response;
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
    if (!size || typeof size !== 'string') return true;
    const match = size.match(/(\d*\.?\d+)\s*(GB|MB)/i);
    if (!match) return true;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const sizeMB = unit === 'GB' ? value * 1024 : value;
    return sizeMB <= 2000; // WhatsApp limit ~2GB
};

// Helper: Validate URL
const isValidUrl = (url) => {
    try {
        new URL(url);
        return (
            url.includes('drive.google.com') ||
            url.includes('mega.nz') ||
            url.includes('mediafire.com') ||
            url.includes('catbox.moe') ||
            url.includes('file.io')
        );
    } catch {
        return false;
    }
};

// CineSubz Command (Using Infinity API)
cmd({
    pattern: "cinesubz",
    alias: ["cine"],
    react: "🎬",
    category: "movie",
    desc: "Search and download movies using Infinity API",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isMe }) => {
    try {
        if (!q || !/^[a-zA-Z0-9\s]+$/.test(q)) {
            return await reply('*Please provide a valid movie name to search! (e.g., Good Bad Ugly)*');
        }

        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        // Search movies
        const searchUrl = `https://api.infinityapi.org/cine-movie-search?name=${encodeURIComponent(q)}&api=Infinity-FA240F-284CE-FC00-875A7`;
        const searchResponse = await fetchWithRetry(searchUrl);
        const searchData = searchResponse.data;

        if (!searchData.status || !searchData.result?.data?.length) {
            return await reply(`*No results found for:* "${q}"`);
        }

        const searchResults = searchData.result.data.slice(0, 10);
        const resultsMessage = `*𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 𝐌𝐎𝐕𝐈𝐄 𝐒𝐄𝐀𝐑𝐂𝐇*\n\n🎥 *Search Results for* "${q}":\n\n` +
            searchResults.map((r, i) => `*${i + 1}.* ${r.title} (${r.year || 'N/A'})\n🔗 Link: ${r.movie_link || 'N/A'}\n`).join('\n');

        await sleep(2000);
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
                const movieUrl = `https://api.infinityapi.org/cine-minfo?url=${encodeURIComponent(selectedMovie.movie_link)}&api=Infinity-FA240F-284CE-FC00-875A7`;
                const movieResponse = await fetchWithRetry(movieUrl);
                movieData = movieResponse.data;
                if (!movieData.status || !movieData.result?.data) throw new Error('Invalid movie data');
            } catch (error) {
                console.error('Error fetching movie details:', error.message);
                return await reply(`*Error fetching movie details: ${error.message || 'Please try again.'}*`);
            }

            const { title, imdbRate, image, date, country, duration, dl_links, subtitle_author: subtitle, category: genre } = movieData.result.data;

            // Send movie menu
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
                        sourceUrl: selectedMovie.movie_link,
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
                    if (!dl_links || !dl_links.length) {
                        return await reply('*No download links available for this movie.*');
                    }

                    // Validate links
                    const validLinks = dl_links.filter(link => validateFileSize(link.size) && isValidUrl(link.link));
                    if (!validLinks.length) {
                        return await reply('*No valid downloadable links under 2GB available.* Try another movie.\nInvalid links:\n' + dl_links.map(l => `${l.quality}: ${l.link}`).join('\n'));
                    }

                    // Send download links
                    const downloadMessage = `🎥 *${title}*\n\n` +
                        `*Available Download Links:*\n` +
                        validLinks.map((link, i) => `*${i + 1}.* ${link.quality} - ${link.size}\n🔗 ${link.link}\n`).join('\n');
                    const sentDownloadMsg = await conn.sendMessage(from, { text: downloadMessage }, { quoted: mek });

                    // Handle quality selection
                    conn.addReplyTracker(sentDownloadMsg.key.id, async (mek, downloadMessageType) => {
                        const selectedQuality = parseInt(downloadMessageType.trim());
                        if (isNaN(selectedQuality) || selectedQuality <= 0 || selectedQuality > validLinks.length) {
                            return await reply('Invalid selection. Please reply with a valid number.');
                        }

                        const selectedLink = validLinks[selectedQuality - 1];
                        let downloadUrl = selectedLink.link;
                        let isDirectLink = false;

                        // Fetch direct download link
                        try {
                            const directUrl = `https://api.infinityapi.org/cine-direct-dl?url=${encodeURIComponent(selectedLink.link)}&api=Infinity-FA240F-284CE-FC00-875A7`;
                            const movieLinkResponse = await fetchWithRetry(directUrl);
                            const movieLinkData = movieLinkResponse.data;
                            if (movieLinkData.status && movieLinkData.result?.direct && isValidUrl(movieLinkData.result.direct)) {
                                downloadUrl = movieLinkData.result.direct;
                                isDirectLink = true;
                            } else {
                                console.warn('No valid direct link, using raw link:', selectedLink.link);
                            }
                        } catch (error) {
                            console.error('Error fetching direct link:', error.message);
                            await conn.sendMessage(from, {
                                text: `*Warning: Could not fetch direct download link (${error.message}).* Using raw link instead.\n🔗 ${selectedLink.link}`,
                            }, { quoted: mek });
                        }

                        const sendto = isMe ? process.env.MOVIE_JID || from : from;
                        await conn.sendMessage(from, { react: { text: '⬇️', key: sentDownloadMsg.key } });

                        // Construct caption
                        const caption = `*☘️ 𝗧ɪᴛʟᴇ ➮* *${title}*\n\n` +
                            `*📅 𝗥ᴇʟᴇᴀꜱᴇᴅ ᴅᴀᴛᴇ ➮* ${date || 'N/A'}\n` +
                            `*🌎 𝗖ᴏᴜɴᴛʀʏ ➮* ${country || 'N/A'}\n` +
                            `*💃 𝗥ᴀᴛɪɴɢ ➮* ${imdbRate || 'N/A'}\n` +
                            `*⏰ 𝗥ᴜɴᴛɪᴍᴇ ➮* ${duration || 'N/A'}\n` +
                            `*💁‍♂️ 𝗦ᴜʙᴛɪᴛʟᴇ ʙʏ ➮* ${subtitle || 'N/A'}\n` +
                            `*🎭 𝗚ᴇɴᴀʀᴇꜱ ➮* ${genre || '.NEW, Action, Drama'}\n` +
                            `*🔗 �_L𝗶𝗻𝗸 ➮* ${downloadUrl}\n\n` +
                            `> ⚜️ ᴅᴇᴠᴇʟᴏᴘᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

                        // File host instructions
                        let hostInstructions = '';
                        if (downloadUrl.includes('drive.google.com')) {
                            hostInstructions = '*Note:* Google Drive link. Open in a browser, click "Download," and follow prompts (e.g., sign-in, CAPTCHA).';
                        } else if (downloadUrl.includes('mega.nz')) {
                            hostInstructions = '*Note:* Mega link. Open in a browser, click "Download," and wait (may require a free account).';
                        } else if (downloadUrl.includes('mediafire.com')) {
                            hostInstructions = '*Note:* MediaFire link. Open in a browser, click "Download," and bypass ads.';
                        } else {
                            hostInstructions = '*Note:* Open the link in a browser and follow the download instructions.';
                        }

                        try {
                            // Verify download URL
                            const verifyResponse = await axios.head(downloadUrl, { timeout: 10000 });
                            if (verifyResponse.status !== 200) {
                                throw new Error(`Download URL inaccessible (status: ${verifyResponse.status})`);
                            }

                            // Check file size
                            const contentLength = verifyResponse.headers['content-length'];
                            if (contentLength && parseInt(contentLength) / (1024 * 1024) > 2000) {
                                throw new Error('File size exceeds WhatsApp limit (2GB)');
                            }

                            await conn.sendMessage(sendto, {
                                document: { url: downloadUrl },
                                mimetype: 'video/mp4',
                                fileName: `${title} - ${selectedLink.quality}.mp4`,
                                caption: `${caption}\n${hostInstructions}`,
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
                                        sourceUrl: selectedMovie.movie_link,
                                        thumbnailUrl: posterUrl,
                                        renderLargerThumbnail: true,
                                        showAdAttribution: true
                                    }
                                }
                            }, { quoted: mek });
                            await conn.sendMessage(from, { react: { text: '✅', key: sentDownloadMsg.key } });
                        } catch (error) {
                            console.error('Error sending file:', error.message);
                            await conn.sendMessage(from, {
                                text: `*Error: Unable to send file (${error.message || 'File may be unavailable or too large.'}).*\nTry downloading manually:\n🔗 ${downloadUrl}\n\n${hostInstructions}`,
                            }, { quoted: mek });
                            await conn.sendMessage(from, { react: { text: '❌', key: sentDownloadMsg.key } });
                        }
                    });
                } else if (option === '2') {
                    const detailsMessage = `*🎥 Movie Details: ${title}*\n\n` +
                        `*📅 Released Date:* ${date || 'N/A'}\n` +
                        `*🌎 Country:* ${country || 'N/A'}\n` +
                        `*💃 IMDb Rating:* ${imdbRate || 'N/A'}\n` +
                        `*⏰ Runtime:* ${duration || 'N/A'}\n` +
                        `*💁‍♂️ Subtitle By:* ${subtitle || 'N/A'}\n` +
                        `*🎭 Genres:* ${genre || '.NEW, Action, Drama'}\n` +
                        `*🔗 Link:* ${selectedMovie.movie_link}\n\n` +
                        `> ⚜️ ᴅᴇᴠᴇʟᴏᴘᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;
                    await conn.sendMessage(from, { text: detailsMessage }, { quoted: mek });
                } else {
                    await reply('Invalid option. Please reply with 1 or 2.');
                }
            });
        });
    } catch (error) {
        console.error('Error during movie search:', error.message);
        await reply(`*Error: ${error.message || 'An unexpected error occurred.'}*`);
    }
});
