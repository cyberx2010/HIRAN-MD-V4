const config = require('../config');
const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const { setCineCache } = require('./cineinfo');
setCineCache(sender, res.data);

cmd({
pattern: "cine",
react: '🔎',
category: "movie",
alias: ["cinesubz,cinesub"],
desc: "Movie downloader with Sinhala subtitles",
filename: __filename
},
async (conn, m, mek, { from, q, prefix, reply }) => {
try {
if (!q) return await reply('Please provide a search query!');

// Fetch movie data from API  
    const apiUrl = config.CINE_API_URL || 'https://darksadas-yt-cinezub-search.vercel.app/';  
    const res = await fetchJson(`${apiUrl}?query=${encodeURIComponent(q)}`);  

    // Validate API response  
    if (!res.data || !Array.isArray(res.data) || res.data.length === 0) {  
        return await reply('*No movies found for your query!*');  
    }  

    // Construct the result message  
    let resultText =` *𝘾𝙄𝙉𝙀𝙎𝙐𝘽𝙕 𝙈𝙊𝙑𝙄𝙀 𝙍𝙀𝙎𝙇𝙐𝙏𝙎 𝙁𝙊𝙍:* ${q}\n\n*Reply Below Number 🔢*\n\n`;  
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


let cineCache = {}; // cache per user

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
        if (isNaN(numberReply)) return await reply('*Please provide a valid movie number from previous .cine search.*');

        const selectedIndex = numberReply - 1;
        if (!cineCache[sender] || !cineCache[sender][selectedIndex]) {
            return await reply('*No movie cached for your number. Please search again using .cine <movie>*');
        }

        const movie = cineCache[sender][selectedIndex];
        const detailUrl = movie.movieLink;
        if (!detailUrl) return await reply('*Movie link is missing!*');

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
        console.error('cineinfo plugin error:', e);
        await reply(`*Error:* ${e.message || 'Unexpected error occurred!'}`);
    }
});

// Needed in .cine plugin
module.exports.setCineCache = (sender, data) => {
    cineCache[sender] = data;
};
