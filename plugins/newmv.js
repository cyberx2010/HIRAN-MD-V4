const config = require('../config');
const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

cmd({
    pattern: "cine",
    react: '🔎',
    category: "movie",
    alias: ["cinesubz", "cinesub"],
    desc: "Movie downloader with Sinhala subtitles",
    filename: __filename
},
async (conn, m, mek, { from, q, prefix, reply }) => {
    try {
        if (!q) return await reply('*Please provide a search query!*');

        // Fetch movie data from search API
        const searchApiUrl = config.CINE_API_URL || 'https://darksadas-yt-cinezub-search.vercel.app/';
        const searchRes = await fetchJson(`${searchApiUrl}?query=${encodeURIComponent(q)}`);

        // Validate search API response
        if (!searchRes.data || !Array.isArray(searchRes.data) || searchRes.data.length === 0) {
            return await reply('*No movies found for your query!*');
        }

        // Limit to top 5 results
        const top = searchRes.data.slice(0, 5);
        let list = `*𝘾𝙄𝙉𝙀𝙎𝙐𝘽𝙕 𝙈𝙊�V𝙄𝙀 𝙍𝙀𝙎𝙐𝙇𝙏𝙎 𝙁𝙊𝙍:* ${q}\n\n*Reply Below Number 🔢*\n\n`;
        top.forEach((item, i) => {
            const title = item.title || 'Unknown Title';
            const year = item.year || 'N/A';
            list += `*${i + 1} ||* ${title} (${year}) Sinhala Subtitles | සිංහල උපසිරැසි සමඟ\n`;
        });
        list += `\n_Reply with 1-5 to select a movie._\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴ-ᴍᴅ 🔒🪄`;

        // Send search results with static image
        const defaultImage = 'https://files.catbox.moe/4fsn8g.jpg';
        const sent = await conn.sendMessage(from, {
            image: { url: defaultImage },
            caption: list
        }, { quoted: mek });

        // Listen for user reply
        const pick = (m.ev.once ? m.ev.once : m.ev.on);
        pick.call(m.ev, "messages.upsert", async (update) => {
            const msg = update.messages[0];
            if (!msg.message?.extendedTextMessage) return;
            if (msg.message.extendedTextMessage.contextInfo?.stanzaId !== sent.key.id) return;
            if (msg.key.participant !== m.key.participant) return; // Filter by user

            const choice = parseInt(msg.message.extendedTextMessage.text.trim());
            if (isNaN(choice) || choice < 1 || choice > top.length) {
                return await reply('*Invalid option. Choose 1–5*');
            }

            // Get movie details
            const movieData = top[choice - 1];
            const movieLink = movieData.link;
            if (!movieLink) return await reply('*No link available for this movie!*');

            // Fetch movie details from cine-minfo API
            const detailsApiUrl = config.CINE_INFO_API_URL || 'https://api.infinityapi.org/cine-minfo';
            const res = await fetchJson(`${detailsApiUrl}?url=${encodeURIComponent(movieLink)}&api=Infinity-manoj-x-mizta`, {
                headers: {
                    Authorization: 'Bearer Infinity-FA240F-284CE-FC00-875A7'
                }
            });

            // Validate details API response
            if (!res.data || !res.data.title) {
                return await reply('*No details found for this movie!*');
            }

            // Extract movie details
            const {
                title,
                year,
                release_date,
                country,
                rating,
                runtime,
                subtitle_by,
                genres,
                description,
                poster_url, // Assumed field for movie image
                downloadLinks
            } = res.data;

            // Format fields with fallbacks
            const formattedTitle = title ? `${title} (${year || 'N/A'}) Sinhala Subtitles | සිංහල උපසිරැසි සමඟ` : 'Unknown Title';
            const formattedReleaseDate = release_date || 'N/A';
            const formattedCountry = country || 'N/A';
            const formattedRating = rating || 'N/A';
            const formattedRuntime = runtime ? `${runtime} Min.` : 'N/A';
            const formattedSubtitleBy = subtitle_by || 'N/A';
            const formattedGenres = genres ? (Array.isArray(genres) ? genres.join(', ') : genres) : 'N/A';
            const formattedDescription = description || 'No description available';
            const formattedLinks = Array.isArray(downloadLinks) && downloadLinks.length > 0
                ? downloadLinks.map((link, i) => `*Link ${i + 1}:* ${link.url || link} (${link.quality || 'N/A'})`).join('\n')
                : '*No download links available*';

            // Construct the result message
            let resultText = `*𝘾𝙄𝙉𝙀𝙎𝙐𝘽𝙕 𝙈𝙊𝙑𝙄𝙀 𝘿𝙀𝙏𝘼𝙄𝙇𝙎 🎥*\n\n`;
            resultText += `*☘️ 𝗧ɪᴛʟᴇ ➮* _${formattedTitle}_\n`;
            resultText += `*📅 𝗥ᴇʟᴇꜱᴇᴅ ᴅᴀᴛᴇ ➮* _${formattedReleaseDate}_\n`;
            resultText += `*🌎 𝗖ᴏᴜɴᴛʀʏ ➮* _${formattedCountry}_\n`;
            resultText += `*💃 𝗥ᴀᴛɪɴɢ ➮* _${formattedRating}_\n`;
            resultText += `*⏰ 𝗥ᴜɴᴛɪᴍᴇ ➮* _${formattedRuntime}_\n`;
            resultText += `*💁‍♂️ 𝗦ᴜʙᴛɪᴛʟᴇ ʙʏ ➮* _${formattedSubtitleBy}_\n`;
            resultText += `*🎭 𝗚ᴇɴᴀʀᴇꜱ ➮* _${formattedGenres}_\n\n`;
            resultText += `*📜 �_Dᴇꜱᴄʀɪᴘᴛɪᴏɴ ➮* _${formattedDescription}_\n\n`;
            resultText += `*🔗 𝗗_ᴏᴡɴʟᴏᴀᴅ 𝗟ɪɴᴋꜱ ➮*\n${formattedLinks}\n\n`;
            resultText += `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴ-ᴍᴅ 🔒🪄`;

            // Use movie-specific image or fallback
            const imageUrl = poster_url || 'https://files.catbox.moe/4fsn8g.jpg';
            try {
                const response = await fetch(imageUrl);
                if (!response.ok) throw new Error('Failed to fetch image');
                await conn.sendMessage(from, {
                    image: { url: imageUrl },
                    caption: resultText
                }, { quoted: msg });
            } catch (imgError) {
                console.error('Image fetch error:', imgError);
                await reply(resultText); // Fallback to text-only
            }
        });

    } catch (e) {
        console.error('Error in cine command:', e);
        await reply(`*Error: ${e.message || 'Something went wrong!'}*`);
    }
});
