const config = require('../config');
const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

let cineCache = {};

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
        if (q) {
            const apiUrl = config.CINE_API_URL || 'https://darksadas-yt-cinezub-search.vercel.app/';
            const res = await fetchJson(`${apiUrl}?query=${q}`); // No encoding

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
            return await conn.sendMessage(from, {
                image: { url: previewImage },
                caption: resultText
            }, { quoted: mek });
        }

        const numberReply = parseInt(m.text.trim());
        if (isNaN(numberReply)) return await reply('*Please enter a valid number or use .cine <name>*');

        const selectedIndex = numberReply - 1;
        if (!cineCache[sender] || !cineCache[sender][selectedIndex]) {
            return await reply('*Invalid selection or session expired. Search again using .cine <name>*');
        }

        const movie = cineCache[sender][selectedIndex];
        const detailUrl = movie.movieLink;
        if (!detailUrl) return await reply('*Movie link not found!*');

        const infoApi = `https://api.infinityapi.org/cine-minfo?url=${detailUrl}&api=Infinity-manoj-x-mizta`; // No encode
        const infoRes = await fetchJson(infoApi);

        if (!infoRes.status || !infoRes.data) return await reply('*Failed to get movie details!*');

        const data = infoRes.data;
        const title = data.title || 'No title';
        const desc = data.description || 'No description available.';
        const poster = data.poster || 'https://files.catbox.moe/4fsn8g.jpg';
        const links = data.download || [];

        let msg = `*🎬 𝙈𝙊𝙑𝙄𝙀:* ${title}\n\n📝 *𝘿𝙚𝙨𝙘:* ${desc}\n\n`;
        if (links.length > 0) {
            msg += `*📥 𝘿𝙊𝙒𝙉𝙇𝙊𝘼𝘿 𝙇𝙄𝙉𝙆𝙎:*\n`;
            links.forEach((link, i) => {
                msg += `*${i + 1}.* ${link.label || 'Quality'} - ${link.url}\n`;
            });
        } else {
            msg += '_No download links found._\n';
        }

        msg += `\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

        await conn.sendMessage(from, {
            image: { url: poster },
            caption: msg
        }, { quoted: mek });

    } catch (e) {
        console.error('cine plugin error:', e);
        await reply(`*Error:* ${e.message || 'Something went wrong!'}`);
    }
});
