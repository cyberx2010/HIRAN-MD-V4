const config = require('../config');
const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

// In-memory store for cine search results
const cineSearchStore = new Map();

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

        // Construct the list message
        let resultText = `*𝘾𝙄𝙉𝙀𝙎𝙐𝘽𝙕 𝙈𝙊𝙑𝙄𝙀 𝙎𝙀𝘼𝙍𝘾𝙃 𝙍𝙀𝙎𝙐𝙇𝙏𝙎 𝙁𝙊𝙍:* ${q}\n\n*Reply Below Number 🔢*\n\n`;
        const sections = [{
            title: "🎬 Movie Results",
            rows: res.data.map((item, index) => {
                const title = item.title || 'Unknown Title';
                const year = item.year || 'N/A';
                return {
                    title: `${title} (${year})`,
                    rowId: `${index + 1}`, // Store index as rowId
                };
            })
        }];

        resultText += sections[0].rows.map((row, index) => `*${index + 1} ||* ${row.title} Sinhala Subtitles | සිංහල උපසිරසි සමඟ`).join('\n');
        resultText += `\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴ-ᴍᴅ 🔒🪄`;

        // Store search results
        cineSearchStore.set(mek.key.id, res.data);

        // Send the list message with callback
        const listMessage = {
            image: { url: 'https://files.catbox.moe/4fsn8g.jpg' },
            text: resultText,
            footer: `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴ-ᴍᴅ 🔒🪄`,
            title: "📽️ Movie Search Results",
            buttonText: "*Reply Below Number 🔢*",
            sections,
            callback: async (m, responseText, { reply }) => {
                const selectedIndex = parseInt(responseText) - 1;
                const searchResults = cineSearchStore.get(mek.key.id);

                if (!searchResults || isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= searchResults.length) {
                    await reply('🚩 *Invalid selection!*');
                    return;
                }

                const selectedMovie = searchResults[selectedIndex];
                const movieUrl = selectedMovie.url; // Adjust based on API response structure

                if (!movieUrl) {
                    await reply('🚩 *No URL found for the selected movie!*');
                    return;
                }

                // Trigger cinedl command
                await reply(`🔍 *Fetching details for ${selectedMovie.title}...*`);
                await conn.sendMessage(from, {
                    text: `${prefix}cinedl ${movieUrl}`,
                }, { quoted: m });
            }
        };

        await conn.replyList(from, listMessage, mek);

        // Clean up store after 5 minutes
        setTimeout(() => {
            cineSearchStore.delete(mek.key.id);
        }, 5 * 60 * 1000);

    } catch (e) {
        console.error('Error in cine command:', e);
        await reply(`*Error: ${e.message || 'Something went wrong!'}*`);
    }
});

cmd({
    pattern: "cinedl",
    dontAddCommandList: true,
    react: '🎥',
    desc: "Movie downloader",
    filename: __filename
},
async (conn, m, mek, { from, q, isMe, prefix, reply }) => {
    try {
        if (!q) return await reply('*Please provide a URL!*');

        let res = await fetchJson(`https://cinesub-info.vercel.app/?url=${q}&apikey=${config.CINE_API_KEY || 'dinithimegana'}`);

        let cap = `*☘️ Tιтle ➜* *${res.data.title}*\n\n` +
                  `*📆 Rᴇʟᴇᴀꜱᴇ ➜* _${res.data.date}_\n` +
                  `*⭐ Rᴀᴛɪɴɢ ➜* _${res.data.imdb}_\n` +
                  `*⏰ Rᴜɴᴛɪᴍᴇ ➜* _${res.data.runtime}_\n` +
                  `*🌎 Cᴏᴜɴᴛʀʏ ➜* _${res.data.country}_\n` +
                  `*💁‍♂️ Dɪʀᴇᴄᴛᴏʀ ➜* _${res.data.subtitle_author}_\n`;

        if (!res.data || !res.dl_links || res.dl_links.length === 0) {
            return await conn.sendMessage(from, { text: '🚩 *No download links found!*' }, { quoted: mek });
        }

        const sections = [];
        if (Array.isArray(res.dl_links)) {
            const cinesubzRows = res.dl_links.map(item => ({
                title: `${item.quality} (${item.size})`,
                rowId: `${prefix}cinedl ${res.data.image}±${item.link}±${res.data.title}±${item.quality}`
            }));
            sections.push({
                title: "🎬 Cinesubz",
                rows: cinesubzRows
            });
        }

        const listMessage = {
            image: { url: res.data.image.replace("fit=", "") },
            text: cap,
            footer: `\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴ-ᴍᴅ 🔒🪄`,
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
        await conn.sendMessage(from, { text: '🚖 *Error!*' }, { quoted: mek });
    }
});
