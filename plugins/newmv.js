const config = require('../config');
const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const { writeFileSync, mkdirSync } = require('fs');
const path = require('path');

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

        // Create temp directory if it doesn't exist
        const tempDir = path.join(__dirname, '../temp');
        mkdirSync(tempDir, { recursive: true });

        // Fetch movie data from API
        const apiUrl = config.CINE_API_URL || 'https://darksadas-yt-cinezub-search.vercel.app/';
        const res = await fetchJson(`${apiUrl}?query=${encodeURIComponent(q)}`);

        // Validate API response
        if (!res.data || !Array.isArray(res.data) || res.data.length === 0) {
            return await reply('*No movies found for your query!*');
        }

        // Store search results temporarily
        const searchId = `${from}_${Date.now()}`;
        const tempFile = path.join(tempDir, `cine_${searchId}.json`);
        writeFileSync(tempFile, JSON.stringify({ searchId, data: res.data }));

        // Construct the result message
        let resultText = `*𝘾𝙄𝙉𝙀𝙎𝙐𝘽𝙕 𝙈𝙊𝙑𝙄𝙀 𝙍𝙀𝙎𝙐𝙇𝙏𝙎 𝙁𝙊𝙍:* ${q}\n\n*Reply Below Number 🔢*\n\n`;
        res.data.forEach((item, index) => {
            const title = item.title || 'Unknown Title';
            const year = item.year || 'N/A';
            resultText += `*${index + 1} ||* ${title} (${year}) Sinhala Subtitles | සිංහල උපසිරසි සමඟ\n`;
        });
        resultText += `\n*Search ID:* ${searchId}\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴ-ᴍᴅ 🔒🪄`;

        // Send the image with the caption
        const imageUrl = 'https://files.catbox.moe/4fsn8g.jpg';
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Failed to fetch image');
            await conn.sendMessage(from, {
                image: { url: imageUrl },
                caption: resultText
            }, { quoted: mek });
        } catch (imgError) {
            console.error('Image fetch error:', imgError);
            await reply(resultText); // Fallback to text-only
        }

    } catch (e) {
        console.error('Error in cine command:', e);
        await reply(`*Error: ${e.message || 'Something went wrong!'}*`);
    }
});

/*____________________________*/

cmd({
    pattern: "cineinfo",
    react: '🎬',
    category: "movie",
    alias: ["movieinfo"],
    desc: "Get detailed information about a movie with Sinhala subtitles",
    filename: __filename
},
async (conn, m, mek, { from, q, prefix, reply }) => {
    try {
        if (!q) return await reply('*Please provide a Search ID and number (e.g., "cine_1234567890 1")!*');

        // Parse input: expecting "searchId number"
        const [searchId, number] = q.split(' ').map(s => s.trim());
        if (!searchId || !number) return await reply('*Invalid format! Use: Search ID number (e.g., "cine_1234567890 1")*');

        // Load stored search results
        const tempFile = path.join(__dirname, `../temp/cine_${searchId}.json`);
        let searchData;
        try {
            searchData = JSON.parse(readFileSync(tempFile));
        } catch (e) {
            return await reply('*Invalid or expired Search ID!*');
        }

        // Get movie link from number
        const index = parseInt(number) - 1;
        if (index < 0 || index >= searchData.data.length) {
            return await reply('*Invalid number selected!*');
        }
        const movieLink = searchData.data[index].link;
        if (!movieLink) return await reply('*No link available for this movie!*');

        // Fetch movie details from API
        const apiUrl = config.CINE_INFO_API_URL || 'https://api.infinityapi.org/cine-minfo';
        const res = await fetchJson(`${apiUrl}?query=${encodeURIComponent(movieLink)}`, {
            headers: {
                Authorization: 'Bearer Infinity-FA240F-284CE-FC00-875A7'
            }
        });

        // Validate API response
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
            downloadLinks
        } = res.data;

        // Format fields with fallbacks
        const formattedTitle = title ? `${title} (${year || 'N/A'}) Sinhala Subtitles | සිංහල උපසිරසි සමඟ` : 'Unknown Title';
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
        resultText += `*📅 �_Rᴇʟᴇꜱᴇᴅ ᴅᴀᴛᴇ ➮* _${formattedReleaseDate}_\n`;
        resultText += `*🌎 𝗖ᴏᴜɴᴛʀʏ ➮* _${formattedCountry}_\n`;
        resultText += `*💃 𝗥ᴀᴛɪɴɢ ➮* _${formattedRating}_\n`;
        resultText += `*⏰ 𝗥ᴜɴᴛɪᴍᴇ ➮* _${formattedRuntime}_\n`;
        resultText += `*💁‍♂️ 𝗦ᴜʙᴛɪᴛʟᴇ ʙʏ ➮* _${formattedSubtitleBy}_\n`;
        resultText += `*🎭 𝗚ᴇɴᴀʀᴇꜱ ➮* _${formattedGenres}_\n\n`;
        resultText += `*📜 𝗗ᴇꜱᴄʀɪᴘᴛɪᴏɴ ➮* _${formattedDescription}_\n\n`;
        resultText += `*🔗 𝗗ᴏᴡɴʟᴏᴀᴅ 𝗟ɪɴᴋꜱ ➮*\n${formattedLinks}\n\n`;
        resultText += `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴ-ᴍᴅ 🔒🪄`;

        // Send the image with the caption
        const imageUrl = 'https://files.catbox.moe/4fsn8g.jpg';
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Failed to fetch image');
            await conn.sendMessage(from, {
                image: { url: imageUrl },
                caption: resultText
            }, { quoted: mek });
        } catch (imgError) {
            console.error('Image fetch error:', imgError);
            await reply(resultText); // Fallback to text-only
        }

    } catch (e) {
        console.error('Error in cineinfo command:', e);
        await reply(`*Error: ${e.message || 'Something went wrong!'}*`);
    }
});
