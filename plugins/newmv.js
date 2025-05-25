const config = require('../config');
const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

let cineCache = {}; // Global cache used by both commands

// .cine command
cmd({
    pattern: "cine",
    react: '🔎',
    category: "movie",
    alias: ["cinesubz", "cinesub"],
    desc: "Movie downloader with Sinhala subtitles",
    filename: __filename
},
async (conn, m, mek, { from, q, prefix, reply, sender }) => {
    try {
        if (!q) return await reply('*Please provide a search query!*');

        const apiUrl = config.CINE_API_URL || 'https://darksadas-yt-cinezub-search.vercel.app/';
        const res = await fetchJson(`${apiUrl}?query=${q}`); // raw query (no encode)

        if (!res.data || !Array.isArray(res.data) || res.data.length === 0) {
            return await reply('*No movies found for your query!*');
        }

        cineCache[sender] = res.data;

        let resultText = `*🔎 𝙎𝙀𝘼𝙍𝘾𝙃 𝙍𝙀𝙎𝙐𝙇𝙏𝙎 𝙁𝙊𝙍:* ${q}\n\n*Reply with a number to get movie details and download links.*\n\n`;
        res.data.forEach((item, index) => {
            const title = item.title || 'Unknown Title';
            const year = item.year || 'N/A';
            resultText += `*${index + 1}.* ${title} (${year}) Sinhala Sub | සිංහල උපසිරැසි\n`;
        });
        resultText += `\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

        const previewImage = 'https://files.catbox.moe/4fsn8g.jpg';
        await conn.sendMessage(from, {
            image: { url: previewImage },
            caption: resultText
        }, { quoted: mek });

    } catch (e) {
        console.error('Error in .cine command:', e);
        await reply(`*Error: ${e.message || 'Something went wrong!'}*`);
    }
});


// .cineinfo command
cmd({
    pattern: "cineinfo",
    react: '🎬',
    alias: ["cinfo"],
    category: "movie",
    desc: "Get CineSubz movie info from previous search",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, sender }) => {
    try {
        const numberReply = parseInt(q || m.text.trim());
        if (isNaN(numberReply)) return await reply('*Please reply with a valid movie number from search result.*');

        const selectedIndex = numberReply - 1;
        if (!cineCache[sender] || !cineCache[sender][selectedIndex]) {
            return await reply('*Movie not found in memory. Please search again using .cine <name>*');
        }

        const movie = cineCache[sender][selectedIndex];
        const detailUrl = movie.movieLink;
        if (!detailUrl) return await reply('*Movie link not found!*');

        const apiUrl = `https://api.infinityapi.org/cine-minfo?url=${detailUrl}&api=Infinity-manoj-x-mizta`;
        const info = await fetchJson(apiUrl);

        if (!info.status || !info.data) return await reply('*Failed to fetch movie details!*');

        const data = info.data;
        const title = data.title || 'No Title';
        const desc = data.description || 'No description available.';
        const poster = data.poster || 'https://files.catbox.moe/4fsn8g.jpg';
        const links = data.download || [];

        let message = `*🎬 𝙈𝙊𝙑𝙄𝙀:* ${title}\n\n📝 *𝘿𝙚𝙨𝙘:* ${desc}\n\n`;
        if (links.length > 0) {
            message += '*📥 𝘿𝙊𝙒𝙉𝙇𝙊𝘼𝘿 𝙇𝙄𝙉𝙆𝙎:*\n';
            links.forEach((link, i) => {
                message += `*${i + 1}.* ${link.label || 'Quality'} - ${link.url}\n`;
            });
        } else {
            message += '_No download links found._\n';
        }

        message += `\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

        await conn.sendMessage(from, {
            image: { url: poster },
            caption: message
        }, { quoted: mek });

    } catch (e) {
        console.error('Error in .cineinfo command:', e);
        await reply(`*Error:* ${e.message || 'Something went wrong!'}`);
    }
});
