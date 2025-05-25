const config = require('../config');
const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

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

        // Construct the result message
        let resultText =` *𝘾𝙄𝙉𝙀𝙎𝙐𝘽𝙕 𝙈𝙊𝙑𝙄𝙀 𝙎𝙀𝘼𝙍𝘾𝙃 𝙍𝙀𝙎𝙐𝙇𝙏𝙎 𝙁𝙊𝙍:* ${q}\n\n*Reply Below Number 🔢*\n\n`;
        res.data.forEach((item, index) => {
            const title = item.title || 'Unknown Title';
            const year = item.year || 'N/A'; // Adjust based on API response
            resultText += `*${index + 1} ||* ${title} (${year}) Sinhala Subtitles | සිංහල උපසිරසි සමඟ\n`;
        });
        resultText += `\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴ-ᴍᴅ 🔒🪄`;

        // Send the image with the caption
        const imageUrl = 'https://files.catbox.moe/4fsn8g.jpg';
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: resultText
        }, { quoted: mek });

    } catch (e) {
        console.error('Error in cine command:', e);
        await reply(`*Error: ${e.message || 'Something went wrong!'}*`);
    }
});



//_______________________________________________INFO

cmd({
    pattern: "cinedl",
    dontAddCommandList: true,
    react: '🎥',
    desc: "movie downloader",
    filename: __filename
},
async (conn, m, mek, { from, q, isMe, prefix, reply }) => {
    try {
        if (!q) return await reply('*please give me url!..*');

        let res = await fetchJson(`https://cinesub-info.vercel.app/?url=${q}&apikey=dinithimegana`);

        let cap = `*☘️ Tιтle ➜* *${res.data.title}*\n\n` +
                  `*📆 Rᴇʟᴇᴀꜱᴇ ➜* _${res.data.date}_\n` +
                  `*⭐ Rᴀᴛɪɴɢ ➜* _${res.data.imdb}_\n` +
                  `*⏰ Rᴜɴᴛɪᴍᴇ ➜* _${res.data.runtime}_\n` +
                  `*🌎 Cᴏᴜɴᴛʀʏ ➜* _${res.data.country}_\n` +
                  `*💁‍♂️ Dɪʀᴇᴄᴛᴏʀ ➜* _${res.data.subtitle_author}_\n`;

        if (!res.data || !res.dl_links || res.dl_links.length === 0) {
            return await conn.sendMessage(from, { text: 'erro !' }, { quoted: mek });
        }

        const sections = [];

        if (Array.isArray(res.dl_links)) {
            const cinesubzRows = res.dl_links.map(item => ({
                title: `${item.quality} (${item.size})`,
                rowId: `${prefix}cinedl ${res.data.image}±${item.link}±${res.data.title}\n\n*\`${item.quality}\`*`
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
            buttonText: "*Reply Below Number 🔢",
            sections
        };
        return await conn.replyList(from, listMessage, mek);
    } catch (e) {
        console.log(e);
        await conn.sendMessage(from, { text: '🚩 *Error !!*' }, { quoted: mek });
    }
});
