const config = require('../config');
const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const axios = require('axios');

let cineCache = {}; // Global cache for search results

// Search command (non-button)
cmd({
    pattern: "cine",
    react: '🔎',
    category: "movie",
    alias: ["cinesubz", "cinesub"],
    desc: "Search for movies with Sinhala subtitles",
    filename: __filename
},
async (conn, m, mek, { from, q, reply, sender }) => {
    try {
        if (!q) return await reply('*Please provide a movie name!*');

        const apiUrl = config.CINE_API_URL || 'https://darksadas-yt-cinezub-search.vercel.app/';
        const res = await fetchJson(`${apiUrl}?query=${q}`);

        if (!res.data || !Array.isArray(res.data) || res.data.length === 0) {
            return await reply('*No movies found for your query!*');
        }

        cineCache[sender] = res.data;
        setTimeout(() => delete cineCache[sender], 10 * 60 * 1000); // Clear cache after 10 minutes

        let text = `*🔎 𝙎𝙀𝘼𝙍𝘾𝙃 𝙍𝙀𝙎𝙐𝙇𝙏𝙎 𝙁𝙊𝙍:* ${q}\n\n*Use .cineinfo <url> with the URL below to get details and download links.*\n\n`;
        res.data.forEach((item, index) => {
            const title = item.title || 'Unknown Title';
            const year = item.year || 'N/A';
            const url = item.movieLink || 'No URL';
            text += `*${index + 1}.* ${title} (${year})\n*URL:* ${url}\n\n`;
        });
        text += `\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

        const previewImage = 'https://files.catbox.moe/4fsn8g.jpg';
        await conn.sendMessage(from, {
            image: { url: previewImage },
            caption: text
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (e) {
        console.error('Error in .cine command:', e);
        await reply(`*Error:* ${e.message || 'Something went wrong!'}`);
    }
});

// Movie details command (non-button)
cmd({
    pattern: "cineinfo",
    react: '🎬',
    category: "movie",
    desc: "Get movie details and direct download links from URL",
    filename: __filename
},
async (conn, m, mek, { from, q, reply, sender }) => {
    try {
        if (!q) return await reply('*Please provide a movie URL from .cine results!*');

        const detailUrl = q.trim();
        if (!detailUrl.startsWith('http')) return await reply('*Invalid URL format! Please provide a valid URL.*');

        // Fetch movie details
        const apiKey = config.API_KEY || 'Infinity-manoj-x-mizta';
        const infoApi = `https://api.infinityapi.org/cine-minfo?url=${detailUrl}&api=${apiKey}`;
        const info = await fetchJson(infoApi);

        if (!info.status || !info.data) return await reply('*Failed to fetch movie details!*');

        const data = info.data;
        const title = data.title || 'No Title';
        const desc = data.description || 'No description available.';
        const poster = data.poster || 'https://files.catbox.moe/4fsn8g.jpg';
        const links = data.download || [];

        let message = `*🎬 𝙈𝙊𝙑𝙄𝙀:* ${title}\n\n📝 *𝘿𝙚𝙨𝙘:* ${desc}\n\n*📥 𝘿𝙊𝙒𝙉𝙇𝙊𝘼𝘿 𝙇𝙄𝙉𝙆𝙎:*\n*Use .mp4, .mkv, .zip, or .fetchrar with the URL below to download.*\n\n`;

        if (links.length === 0) {
            message += '_No download links found._\n';
        } else {
            // Fetch direct download URLs using cine-direct-dl API
            for (let i = 0; i < links.length; i++) {
                const dlApi = `https://api.infinityapi.org/cine-direct-dl?url=${links[i].url}&api=${apiKey}`;
                const dlRes = await fetchJson(dlApi);

                if (dlRes.status && dlRes.data?.url) {
                    message += `*${i + 1}.* ${links[i].label || 'Quality'} - ${dlRes.data.url}\n`;
                } else {
                    message += `*${i + 1}.* ${links[i].label || 'Quality'} - Failed to fetch direct link\n`;
                }
            }
        }

        message += `\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

        await conn.sendMessage(from, {
            image: { url: poster },
            caption: message
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (e) {
        console.error('Error in .cineinfo command:', e);
        await reply(`*Error:* ${e.message || 'Something went wrong!'}`);
    }
});

// Download commands
cmd({
    pattern: "mp4",
    react: "📥",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply('*Please provide a direct URL from .cineinfo!*');

        const mediaUrl = q.trim();
        if (!mediaUrl.startsWith('http')) return await reply('*Invalid URL format!*');

        const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        const mediaBuffer = Buffer.from(response.data, 'binary');

        const progress = [
            "《 █▒▒▒▒▒▒▒▒▒▒▒》10%",
            "《 ████▒▒▒▒▒▒▒▒》30%",
            "《 ███████▒▒▒▒▒》50%",
            "《 ██████████▒▒》80%",
            "《 ████████████》100%",
            "𝙸𝙽𝙸𝚃𝙸𝙰𝙻𝙸𝚉𝙴𝙳 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙴𝙳 🦄..."
        ];
        let { key } = await conn.sendMessage(from, { text: 'ᴜᴘʟᴏᴀᴅɪɴɢ ᴍᴏᴠɪᴇ...' });
        for (let i = 0; i < progress.length; i++) {
            await conn.sendMessage(from, { text: progress[i], edit: key });
        }

        const message = {
            document: mediaBuffer,
            caption: "*🎬 CINESUBZ MOVIE DL 🎬*",
            mimetype: "application/mp4",
            fileName: "CineSubz_DL.mp4"
        };

        await conn.sendMessage(from, message, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (e) {
        console.error('Error in .mp4 command:', e);
        await reply(`*Error:* ${e.message || 'Failed to download or send file!'}`);
    }
});

cmd({
    pattern: "mkv",
    react: "📥",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply('*Please provide a direct URL from .cineinfo!*');

        const mediaUrl = q.trim();
        if (!mediaUrl.startsWith('http')) return await reply('*Invalid URL format!*');

        const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        const mediaBuffer = Buffer.from(response.data, 'binary');

        const progress = [
            "《 █▒▒▒▒▒▒▒▒▒▒▒》10%",
            "《 ████▒▒▒▒▒▒▒▒》30%",
            "《 ███████▒▒▒▒▒》50%",
            "《 ██████████▒▒》80%",
            "《 ████████████》100%",
            "𝙸𝙽𝙸𝚃𝙸𝙰𝙻𝙸𝚉𝙴𝙳 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙴𝙳 🦄..."
        ];
        let { key } = await conn.sendMessage(from, { text: 'ᴜᴘʟᴏᴀᴅɪɴɢ ᴍᴏᴠɪᴇ...' });
        for (let i = 0; i < progress.length; i++) {
            await conn.sendMessage(from, { text: progress[i], edit: key });
        }

        const message = {
            document: mediaBuffer,
            caption: "*🎬 CINESUBZ MOVIE DL 🎬*",
            mimetype: "application/x-matroska",
            fileName: "CineSubz_DL.mkv"
        };

        await conn.sendMessage(from, message, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (e) {
        console.error('Error in .mkv command:', e);
        await reply(`*Error:* ${e.message || 'Failed to download or send file!'}`);
    }
});

cmd({
    pattern: "zip",
    react: "📥",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply('*Please provide a direct URL from .cineinfo!*');

        const mediaUrl = q.trim();
        if (!mediaUrl.startsWith('http')) return await reply('*Invalid URL format!*');

        const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        const mediaBuffer = Buffer.from(response.data, 'binary');

        const progress = [
            "《 █▒▒▒▒◎◎◎◎◎◎◎◎◎◎》10%",
            "《 ████◎◎◎◎◎◎◎◎》30%",
            "《 ███████◎◎◎◎◎》50%",
            "《 ██████████◎◎》80%",
            "《 ████████████》100%",
            "𝙸𝙽𝙸𝚃𝙸𝙰𝙻𝙸𝚉𝙴𝙳 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙴𝙳 🦄..."
        ];
        let { key } = await conn.sendMessage(from, { text: 'ᴜᴘʟᴏᴀᴅɪɴɢ ᴍᴏᴠɪᴇ...' });
        for (let i = 0; i < progress.length; i++) {
            await conn.sendMessage(from, { text: progress[i], edit: key });
        }

        const message = {
            document: mediaBuffer,
            caption: "*🎬 CINESUBZ MOVIE DL 🎬*",
            mimetype: "application/zip",
            fileName: "CineSubz_DL.zip"
        };

        await conn.sendMessage(from, message, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (e) {
        console.error('Error in .zip command:', e);
        await reply(`*Error:* ${e.message || 'Failed to download or send file!'}`);
    }
});

cmd({
    pattern: "fetchrar",
    react: "📥",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply('*Please provide a direct URL from .cineinfo!*');

        const mediaUrl = q.trim();
        if (!mediaUrl.startsWith('http')) return await reply('*Invalid URL format!*');

        const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        const mediaBuffer = Buffer.from(response.data, 'binary');

        const progress = [
            "《 █▒▒▒▒◎◎◎◎◎◎◎◎◎◎》10%",
            "《 ████◎◎◎◎◎◎◎◎》30%",
            "《 ███████◎◎◎◎◎》50%",
            "《 ██████████◎◎》80%",
            "《 ████████████》100%",
            "𝙸𝙽𝙸𝚃𝙸𝙰𝙻𝙸𝚉𝙴𝙳 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙴𝙳 🦄..."
        ];
        let { key } = await conn.sendMessage(from, { text: 'ᴜᴘʟᴏᴀᴅɪɴɢ ᴍᴏᴠɪᴇ...' });
        for (let i = 0; i < progress.length; i++) {
            await conn.sendMessage(from, { text: progress[i], edit: key });
        }

        const message = {
            document: mediaBuffer,
            caption: "*🎬 CINESUBZ MOVIE DL 🎬*",
            mimetype: "application/rar",
            fileName: "CineSubz_DL.rar"
        };

        await conn.sendMessage(from, message, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (e) {
        console.error('Error in .fetchrar command:', e);
        await reply(`*Error:* ${e.message || 'Failed to download or send file!'}`);
    }
});
