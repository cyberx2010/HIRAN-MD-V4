const axios = require('axios');
const cheerio = require('cheerio');
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { File } = require('megajs');
const config = require('../config');
const { cmd, commands } = require('../command');
const { getBuffer, getRandom, isUrl, Json, jsonformat } = require('../lib/functions');

// Target JID for sending downloaded files
const TARGET_JID = '120363331041057093@g.us';

// Utility function to validate JIDs
const isValidJid = (jid) => {
    if (!jid || typeof jid !== 'string') return false;
    // Basic JID validation: should contain @g.us for groups or @s.whatsapp.net for users
    return jid.includes('@g.us') || jid.includes('@s.whatsapp.net');
};

// Utility function to validate URLs
const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

// Utility function to parse PixelDrain URLs
const getPixelDrainApiUrl = (link) => {
    try {
        const parsedUrl = new URL(link);
        if (parsedUrl.hostname === 'pixeldrain.com') {
            const fileId = parsedUrl.pathname.split('/u/')[1];
            if (fileId) return `https://pixeldrain.com/api/file/${fileId}`;
        }
        throw new Error('Invalid PixelDrain URL');
    } catch (e) {
        throw new Error(`Failed to parse PixelDrain URL: ${e.message}`);
    }
};

// Generic search function for movies and TV shows
async function searchSinhalaSub(conn, m, mek, { from, q, reply }, isTVShow = false) {
    if (!isValidJid(from)) return reply('*Error: Invalid chat ID. Please try again in a valid chat.*');
    if (!q) return reply('*Please provide a search query!*');
    
    try {
        const url = `https://sinhalasub.lk/?s=${encodeURIComponent(q)}`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        
        const data = $(".search-page .result-item article").map((index, element) => ({
            No: index + 1,
            Title: $(element).find(".details .title a").text().trim(),
            Desc: $(element).find('.details .contenido p').text().trim(),
            Img: $(element).find('.image img').attr("src"),
            Type: $(element).find('.image span').text().trim(),
            Link: $(element).find(".details .title a").attr("href"),
            Year: $(element).find('.details span .rating').text().trim(),
            Rating: $(element).find('.details span').text().trim(),
        })).get();

        if (data.length < 1) return conn.sendMessage(from, { text: 'No results found!' }, { quoted: mek });

        const commandPrefix = isTVShow ? '.tvshow' : '.subin';
        let textw = `🔎 𝗧.𝗖 ${isTVShow ? 'TV SHOW' : 'MOVIE'} 𝗦𝗘𝗔𝗥𝗖𝗛\n\n`;
        for (const item of data) {
            textw += `*⛓️ No:* ${item.No}\n*📃 Title:* ${item.Title}\n*📚 CatName:* ${item.Type}\n*💫 Rating:* ${item.Rating}\n*📅 Date:* ${item.Year}\n*📎 Link:* ${item.Link}\n*📲 Command:* ${commandPrefix} ${item.Link}\n\n--------------------------------------------\n\n`;
        }

        const opts = data[0].Img ? { image: { url: data[0].Img }, caption: textw } : { text: textw };
        return await conn.sendMessage(from, opts, { quoted: mek });
    } catch (e) {
        console.error('Search error:', e);
        reply(`*Error: ${e.message}*`);
    }
}

// Generic download function for different file types
async function downloadFile(conn, mek, m, { from, q, reply }, fileType) {
    if (!isValidJid(from)) return reply('*Error: Invalid chat ID. Please try again in a valid chat.*');
    if (!isValidJid(TARGET_JID)) return reply('*Error: Invalid target chat ID. Please contact the bot owner.*');
    if (!q || !isValidUrl(q)) return reply('*Please provide a valid direct URL!*');

    try {
        const mediaUrl = q.trim();
        const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        const mediaBuffer = Buffer.from(response.data, 'binary');

        const progressMessages = [
            "《 █▒▒▒▒▒▒▒▒▒▒▒》10%",
            "《 ████▒▒▒▒▒▒▒▒》30%",
            "《 ███████▒▒▒▒▒》50%",
            "《 ██████████▒▒》80%",
            "《 ████████████》100%",
            "𝙸𝙽𝙸𝚃𝙸𝙰𝙻𝙸𝚉𝙴𝙳 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙴𝙳 🦄..."
        ];
        let { key } = await conn.sendMessage(from, { text: 'ᴜᴘʟᴏᴀᴅɪɴɢ ᴍᴏᴠɪᴇ...' });
        for (const msg of progressMessages) {
            await conn.sendMessage(from, { text: msg, edit: key });
        }

        const message = {
            document: mediaBuffer,
            caption: "*🎬 TC TEAM MOVIEDL 🎬*",
            mimetype: `application/${fileType}`,
            fileName: `TC_MOVIEDL.${fileType}`
        };
        await conn.sendMessage(TARGET_JID, message, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (error) {
        console.error('Download error:', error);
        await conn.sendMessage(from, { text: `*Error: ${error.message}*` }, { quoted: mek });
    }
}

// Search for movies
cmd({
    pattern: "sinhalasub",
    react: '🔎',
    category: "search",
    desc: "Search for movies on sinhalasub.lk",
    filename: __filename
}, async (conn, m, mek, params) => searchSinhalaSub(conn, m, mek, params, false));

// Search for TV shows
cmd({
    pattern: "sinhalatvshow",
    react: '📑',
    category: "search",
    desc: "Search for TV shows on sinhalasub.lk",
    filename: __filename
}, async (conn, m, mek, params) => searchSinhalaSub(conn, m, mek, params, true));

// Fetch movie details and download links
cmd({
    pattern: "subin",
    react: '📑',
    category: "search",
    desc: "Fetch movie details and download links",
    filename: __filename
}, async (conn, mek, m, { reply, q, prefix, from }) => {
    if (!isValidJid(from)) return reply('*Error: Invalid chat ID. Please try again in a valid chat.*');
    if (!q || !isValidUrl(q)) return reply('*Please provide a valid URL!*');

    try {
        const response = await axios.get(q);
        const $ = cheerio.load(response.data);
        const newsArticle = $(".sheader").first();
        const newsHeadline = newsArticle.find(".data .head h1").text().trim();
        const newsDate = newsArticle.find(".extra .date").text().trim();
        const newsTime = newsArticle.find(".poster img").attr("src");
        const duration = newsArticle.find(".extra .runtime").text().trim();
        const infoMovie = $("#info").first();
        const desc = infoMovie.find(".wp-content p").text().trim();
        const rat = infoMovie.find("#repimdb strong").text().trim();

        let download_links = [];
        $("#download > div > div > table > tbody > tr").each((c, d) => {
            download_links.push({
                quality: $(d).find("td > strong").text(),
                size: $(d).find("td").eq(2).text(),
                link: $(d).find("td > a").attr("href"),
            });
        });

        if (download_links.length < 1) return reply('No download links found!');

        const downloadUrls = await Promise.all(
            download_links.slice(0, 3).map(async link => {
                try {
                    const response = await axios.get(link.link);
                    const $ = cheerio.load(response.data);
                    const href = $("#link").attr("href");
                    return href ? getPixelDrainApiUrl(href) : null;
                } catch (e) {
                    console.error(`Error fetching link ${link.link}:`, e);
                    return null;
                }
            })
        );
        const [fhd, hd, sd] = downloadUrls.filter(url => url !== null);

        let textw = `📃 𝗧.𝗖 𝗠𝗢𝗩𝗜𝗘 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥\n\n`;
        textw += `*📃 Title:* ${newsHeadline}\n`;
        textw += `*🔗 Link:* ${q}\n`;
        textw += `*📅 Year:* ${newsDate}\n`;
        textw += `*💫 Rating:* ${rat}\n`;
        textw += `*⏳ Duration:* ${duration}\n`;
        textw += `*📝 Description:* ${desc}\n\n`;
        textw += `*📥 Download Links:*\n`;
        if (sd) textw += `*SD 480P:*\n- MP4: ${prefix}mp4 ${sd}\n- MKV: ${prefix}mkv ${sd}\n- ZIP: ${prefix}zip ${sd}\n- RAR: ${prefix}fetchrar ${sd}\n`;
        if (hd) textw += `*HD 720P:*\n- MP4: ${prefix}mp4 ${hd}\n- MKV: ${prefix}mkv ${hd}\n- ZIP: ${prefix}zip ${hd}\n- RAR: ${prefix}fetchrar ${hd}\n`;
        if (fhd) textw += `*FHD 1080P:*\n- MP4: ${prefix}mp4 ${fhd}\n- MKV: ${prefix}mkv ${fhd}\n- ZIP: ${prefix}zip ${fhd}\n- RAR: ${prefix}fetchrar ${fhd}\n`;

        const opts = newsTime ? { image: { url: newsTime }, caption: textw } : { text: textw };
        return await conn.sendMessage(from, opts, { quoted: mek });
    } catch (e) {
        console.error('Movie details error:', e);
        reply(`*Error: ${e.message}*`);
    }
});

// Fetch TV show episodes
cmd({
    pattern: "tvshow",
    react: '📑',
    category: "search",
    desc: "Fetch TV show episodes from sinhalasub.lk",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    if (!isValidJid(from)) return reply('*Error: Invalid chat ID. Please try again in a valid chat.*');
    if (!q || !isValidUrl(q)) return reply('*Please provide a valid URL!*');

    try {
        const response = await axios.get(q);
        const $ = cheerio.load(response.data);
        const tcteam = $("#info.sbox");
        const image = tcteam.find("div > div img").attr("src");
        const title = tcteam.find('h1').text().trim();
        const desc = tcteam.find('div.wp-content p').text().trim();

        let download_links = [];
        $("#seasons > div > div > ul > li").each((c, d) => {
            download_links.push({
                name: $(d).find("div.episodiotitle > a").text().trim(),
                number: $(d).find("div.numerando").text().trim(),
                date: $(d).find("div.episodiotitle > span").text().trim(),
                image: $(d).find("div.imagen > img").attr("src"),
                link: $(d).find("div.episodiotitle > a").attr("href"),
            });
        });

        if (download_links.length < 1) return conn.sendMessage(from, { text: 'No episodes found!' }, { quoted: mek });

        let textw = `📃 𝗧.𝗖 𝗧𝗩 𝗦𝗛𝗢𝗪 𝗘𝗣𝗜𝗦𝗢𝗗𝗘𝗦\n\n`;
        textw += `*📌 Link:* ${q}\n`;
        textw += `*📑 Title:* ${title}\n`;
        textw += `*📝 Description:* ${desc}\n\n`;
        textw += `*📑 Episodes:*\n`;
        for (const item of download_links) {
            textw += `*⛓️ Episode:* ${item.number} - ${item.name}\n*📅 Date:* ${item.date}\n*📎 Link:* ${item.link}\n*📲 Command:* .subin2 ${item.link}\n\n--------------------------------------------\n\n`;
        }

        const opts = image ? { image: { url: image }, caption: textw } : { text: textw };
        return await conn.sendMessage(from, opts, { quoted: mek });
    } catch (e) {
        console.error('TV show error:', e);
        reply(`*Error: ${e.message}*`);
    }
});

// Fetch episode download links
cmd({
    pattern: "subin2",
    react: '📑',
    category: "search",
    desc: "Fetch episode download links from sinhalasub.lk",
    filename: __filename
}, async (conn, mek, m, { reply, q, prefix, from }) => {
    if (!isValidJid(from)) return reply('*Error: Invalid chat ID. Please try again in a valid chat.*');
    if (!q || !isValidUrl(q)) return reply('*Please provide a valid URL!*');

    try {
        const response = await axios.get(q);
        const $ = cheerio.load(response.data);
        const tcteam = $("#info.sbox");
        const image = tcteam.find("div > div img").attr("src");
        const title = tcteam.find("h1.epih1").text().trim();
        const desc = tcteam.find('div.wp-content p').text().trim();
        const date = tcteam.find('#info > span').text().trim();

        let download_links = [];
        $("#download > div > div > table > tbody > tr").each((c, d) => {
            download_links.push({
                quality: $(d).find("strong").text(),
                size: $(d).find("td").eq(2).text(),
                link: $(d).find("td > a").attr("href"),
            });
        });

        if (download_links.length < 1) return reply('No download links found!');

        const downloadUrls = await Promise.all(
            download_links.slice(0, 3).map(async link => {
                try {
                    const response = await axios.get(link.link);
                    const $ = cheerio.load(response.data);
                    const href = $("#link").attr("href");
                    return href ? getPixelDrainApiUrl(href) : null;
                } catch (e) {
                    console.error(`Error fetching link ${link.link}:`, e);
                    return null;
                }
            })
        );
        const [fhd, hd, sd] = downloadUrls.filter(url => url !== null);

        let textw = `📃 𝗧.𝗖 𝗘𝗣𝗜𝗦𝗢𝗗𝗘 �_D𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥\n\n`;
        textw += `*📌 Title:* ${title}\n`;
        textw += `*🔗 Link:* ${q}\n`;
        textw += `*📅 Date:* ${date}\n`;
        textw += `*📝 Description:* ${desc}\n\n`;
        textw += `*📥 Download Links:*\n`;
        if (sd) textw += `*SD 480P:*\n- MP4: ${prefix}mp4 ${sd}\n- MKV: ${prefix}mkv ${sd}\n- ZIP: ${prefix}zip ${sd}\n- RAR: ${prefix}fetchrar ${sd}\n`;
        if (hd) textw += `*HD 720P:*\n- MP4: ${prefix}mp4 ${hd}\n- MKV: ${prefix}mkv ${hd}\n- ZIP: ${prefix}zip ${hd}\n- RAR: ${prefix}fetchrar ${hd}\n`;
        if (fhd) textw += `*FHD 1080P:*\n- MP4: ${prefix}mp4 ${fhd}\n- MKV: ${prefix}mkv ${fhd}\n- ZIP: ${prefix}zip ${fhd}\n- RAR: ${prefix}fetchrar ${fhd}\n`;

        const opts = image ? { image: { url: image }, caption: textw } : { text: textw };
        return await conn.sendMessage(from, opts, { quoted: mek });
    } catch (e) {
        console.error('Episode details error:', e);
        reply(`*Error: ${e.message}*`);
    }
});

// Download commands for different file types
['mp4', 'mkv', 'zip', 'fetchrar'].forEach(fileType => {
    cmd({
        pattern: fileType,
        react: "📥",
        dontAddCommandList: true,
        filename: __filename
    }, async (conn, mek, m, params) => downloadFile(conn, mek, m, params, fileType === 'fetchrar' ? 'rar' : fileType));
});
