const axios = require('axios');
const { cmd } = require('../command');
require('dotenv').config();

const API_KEY = process.env.INFINITY_API_KEY || 'Infinity-FA240F-284CE-FC00-875A7';

cmd({
    pattern: 'cinesubz',
    alias: ['cine'],
    react: '🎬',
    category: 'movie',
    desc: 'Search and download movies using Infinity API',
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isMe }) => {
    try {
        if (!q || !/^[a-zA-Z0-9\s]+$/.test(q)) {
            return await reply('*Please provide a valid movie name to search! (e.g., Avatar)*');
        }

        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });

        // Search movies
        const searchResponse = await axios.get('[invalid url, do not cite] {
            headers: { Authorization: `Bearer ${API_KEY}` },
            params: { name: q },
            timeout: 10000
        });
        const searchData = searchResponse.data;

        if (!searchData.status || !searchData.results?.length) {
            return await reply(`*No results found for:* "${q}"`);
        }

        const searchResults = searchData.results.slice(0, 20); // Show 20 results for interactivity
        const numberEmojis = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
        const resultsMessage = `*𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 𝐂𝐈𝐍𝐄𝐒𝐔𝐁𝐙 𝐒𝐄𝐀𝐑𝐂𝐇*\n\n🎥 *Search Results for* "${q}":\n\n` +
            searchResults.map((r, i) => {
                const emojiIndex = (i + 1).toString().split("").map(num => numberEmojis[num]).join("");
                return `${emojiIndex} *${r.title} (${r.year || 'N/A'})*\n🔗 Link: ${r.link || 'N/A'}\n\n`;
            }).join('');

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
                const movieResponse = await axios.get('[invalid url, do not cite] {
                    headers: { Authorization: `Bearer ${API_KEY}` },
                    params: { url: selectedMovie.link },
                    timeout: 10000
                });
                movieData = movieResponse.data;
                if (!movieData.status || !movieData.data) throw new Error('Invalid movie data');
            } catch (error) {
                console.error('Error fetching movie details:', error.message);
                return await reply(`*Error fetching movie details: ${error.message || 'Please try again.'}*`);
            }

            const { title, year, image, description, rating, genres, dl_links } = movieData.data;

            // Send movie menu with poster for interactivity
            const posterUrl = image || process.env.ALIVE_IMG || '[invalid url, do not cite]
            const menuMessage = `*🎥 ${title} (${year || 'N/A'})*\n\n` +
                `🔢 *Reply with:*\n*1.* Download\n*2.* Details\n\n` +
                `> ⚜️ ᴅᴇᴠᴇʟᴏᴘᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱ𝙰ʀ𝙰`;
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
                        sourceUrl: selectedMovie.link || '[invalid url, do not cite]
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
                    if (!dl_links || !dl_links.length) {
                        return await reply('*No download links available for this movie.*');
                    }

                    // Validate file sizes
                    const validLinks = dl_links.filter(link => validateFileSize(link.size));
                    if (!validLinks.length) {
                        return await reply('*No downloadable links under 2GB available.* Try another movie.');
                    }

                    // Send download links with interactive format
                    const downloadMessage = `🎥 *${title}*\n\n` +
                        `*Available Download Links:*\n` +
                        validLinks.map((link, i) => {
                            const emojiIndex = (i + 1).toString().split("").map(num => numberEmojis[num]).join("");
                            return `${emojiIndex} *${link.quality} - ${link.size}*\n`;
                        }).join('\n');
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
                            const movieLinkResponse = await axios.get('[invalid url, do not cite] {
                                headers: { Authorization: `Bearer ${API_KEY}` },
                                params: { url: selectedLink.link },
                                timeout: 10000
                            });
                            movieLinkData = movieLinkResponse.data;
                            if (!movieLinkData.status || !movieLinkData.link) {
                                console.error('Invalid link response:', movieLinkData);
                                return await reply(`*No direct download link available.* Try another quality or movie. Raw link: ${selectedLink.link}`);
                            }
                        } catch (error) {
                            console.error('Error fetching download link:', error.message);
                            return await reply(`*Error fetching download link: ${error.message || 'Please try again.'}* Raw link: ${selectedLink.link}`);
                        }

                        const downloadUrl = movieLinkData.link;
                        const sendto = isMe ? process.env.MOVIE_JID || from : from;

                        await conn.sendMessage(from, { react: { text: '⬇️', key: sentDownloadMsg.key } });

                        // Construct caption with movie details and image context
                        const caption = `*☘️ 𝗧ɪᴛʟᴇ ➮* *${title}*\n\n` +
                            `*📅 𝗥ᴇʟᴇᴀꜱᴇᴅ ᴅᴀᴛᴇ ➮* ${date || 'N/A'}\n` +
                            `*🌎 𝗖ᴏᴜɴᴛʀʏ ➮* ${country || 'N/A'}\n` +
                            `*💃 𝗥ᴀᴛɪɴɢ ➮* ${rating || 'N/A'}\n` +
                            `*⏰ 𝗥ᴜɴᴛɪᴍᴇ ➮* ${duration || 'N/A'}\n` +
                            `*💁‍♂️ 𝗦ᴜʙᴛɪᴛʟᴇ ʙʏ ➮* ${subtitle || 'N/A'}\n` +
                            `*🎭 𝗚ᴇɴᴀʀᴇꜱ ➮* ${genres?.join(', ') || '.NEW, Action, Drama'}\n\n` +
                            `⚠️ *Warning*: Ensure you have permission to download this content.\n` +
                            `> ⚜️ ᴅᴇᴠᴇʟᴏᴘᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱ𝙰ʀ𝙰`;

                        try {
                            // Verify download URL
                            await fetchWithRetry(downloadUrl, {});
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
                                        sourceUrl: selectedMovie.link || '[invalid url, do not cite]
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
                        `*💃 IMDb Rating:* ${rating || 'N/A'}\n` +
                        `*⏰ Runtime:* ${duration || 'N/A'}\n` +
                        `*💁‍♂️ Subtitle By:* ${subtitle || 'N/A'}\n` +
                        `*🎭 Genres:* ${genres?.join(', ') || '.NEW, Action, Drama'}\n` +
                        `*🔗 Link:* ${selectedMovie.link || 'N/A'}\n\n` +
                        `> ⚜️ ᴅᴇᴠᴇʟᴏᴘᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱ𝙰ʀ𝙰`;
                    await conn.sendMessage(from, {
                        image: { url: posterUrl },
                        caption: detailsMessage,
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
                                sourceUrl: selectedMovie.link || '[invalid url, do not cite]
                                thumbnailUrl: posterUrl,
                                renderLargerThumbnail: true,
                                showAdAttribution: true
                            }
                        }
                    }, { quoted: mek });
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
