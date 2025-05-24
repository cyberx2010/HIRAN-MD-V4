const axios = require('axios');
const cheerio = require('cheerio');
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { File } = require('megajs');
const config = require('../config');
const { cmd, commands } = require('../command');
const { getBuffer, getRandom, isUrl, Json, jsonformat } = require('../lib/functions');

// Store context for numbered replies
const userContext = new Map(); // Map<userJid, { command: string, data: any, timestamp: number }>

// Utility function to validate JIDs
const isValidJid = (jid) => {
    if (!jid || typeof jid !== 'string') return false;
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

// Search for movies
cmd({
    pattern: "sinhalasub",
    react: '🔎',
    category: "search",
    desc: "Search for movies on sinhalasub.lk",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    if (!mek || !mek.key || !isValidJid(from)) {
        console.error('Invalid mek or from:', { mek, from });
        return reply('*Error: Invalid chat ID. Please try again in a valid chat.*');
    }
    if (!q) return reply('*Please provide a movie name!*');

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

        // Store context for movie selection
        userContext.set(from, {
            command: 'sinhalasub',
            data: data.map(item => ({ link: item.Link })),
            timestamp: Date.now()
        });

        let textw = `🔎 𝗧.𝗖 𝗠𝗢𝗩𝗜𝗘 𝗦𝗘𝗔�_R𝗖𝗛\n\n`;
        textw += `Reply with the number to select a movie:\n\n`;
        for (const item of data) {
            textw += `[${item.No}] *Title:* ${item.Title}\n*Type:* ${item.Type}\n*Rating:* ${item.Rating}\n*Date:* ${item.Year}\n*Link:* ${item.Link}\n\n--------------------------------------------\n\n`;
        }

        const opts = data[0].Img ? { image: { url: data[0].Img }, caption: textw } : { text: textw };
        return await conn.sendMessage(from, opts, { quoted: mek });
    } catch (e) {
        console.error('Search error:', e);
        reply(`*Error: ${e.message}*`);
    }
});

// Handle numbered replies for movie selection and download
cmd({
    pattern: "select",
    react: '🔢',
    category: "search",
    desc: "Select a movie or download option by number",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
    if (!mek || !mek.key || !isValidJid(from)) {
        console.error('Invalid mek or from:', { mek, from });
        return reply('*Error: Invalid chat ID. Please try again in a valid chat.*');
    }
    if (!q || isNaN(q)) return reply('*Please reply with a valid number!*');

    const number = parseInt(q) - 1;
    const context = userContext.get(from);
    if (!context || Date.now() - context.timestamp > 600000) { // 10-minute expiry
        userContext.delete(from);
        return reply('*Error: No active selection context or session expired. Please run .sinhalasub again.*');
    }

    try {
        const { command, data } = context;
        if (number < 0 || number >= data.length) return reply('*Error: Invalid number selected!*');

        if (command === 'sinhalasub') {
            // User selected a movie, fetch details
            const item = data[number];
            const response = await axios.get(item.link);
            const $ = cheerio.load(response.data);
            const newsArticle = $(".sheader").first();
            const movieData = {
                title: newsArticle.find(".data .head h1").text().trim(),
                date: newsArticle.find(".extra .date").text().trim(),
                country: 'N/A', // Not available
                imdb: $("#info").find("#repimdb strong").text().trim() || 'N/A',
                runtime: newsArticle.find(".extra .runtime").text().trim() || 'N/A',
                subtitle: 'SinhalaSub.lk',
                genre: $("#info").find(".wp-content p").text().trim().split(' ').slice(0, 3).join(', ') || '.NEW, Action, Drama',
                image: newsArticle.find(".poster img").attr("src")
            };

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

            // Store context for download options
            const downloadOptions = [];
            let index = 1;
            if (sd) {
                downloadOptions.push({ quality: 'SD 480P', format: 'MP4', url: sd, command: `${prefix}mp4 ${sd}` });
                downloadOptions.push({ quality: 'SD 480P', format: 'MKV', url: sd, command: `${prefix}mkv ${sd}` });
                downloadOptions.push({ quality: 'SD 480P', format: 'ZIP', url: sd, command: `${prefix}zip ${sd}` });
                downloadOptions.push({ quality: 'SD 480P', format: 'RAR', url: sd, command: `${prefix}fetchrar ${sd}` });
            }
            if (hd) {
                downloadOptions.push({ quality: 'HD 720P', format: 'MP4', url: hd, command: `${prefix}mp4 ${hd}` });
                downloadOptions.push({ quality: 'HD 720P', format: 'MKV', url: hd, command: `${prefix}mkv ${hd}` });
                downloadOptions.push({ quality: 'HD 720P', format: 'ZIP', url: hd, command: `${prefix}zip ${hd}` });
                downloadOptions.push({ quality: 'HD 720P', format: 'RAR', url: hd, command: `${prefix}fetchrar ${hd}` });
            }
            if (fhd) {
                downloadOptions.push({ quality: 'FHD 1080P', format: 'MP4', url: fhd, command: `${prefix}mp4 ${fhd}` });
                downloadOptions.push({ quality: 'FHD 1080P', format: 'MKV', url: fhd, command: `${prefix}mkv ${fhd}` });
                downloadOptions.push({ quality: 'FHD 1080P', format: 'ZIP', url: fhd, command: `${prefix}zip ${fhd}` });
                downloadOptions.push({ quality: 'FHD 1080P', format: 'RAR', url: fhd, command: `${prefix}fetchrar ${fhd}` });
            }
            userContext.set(from, {
                command: 'download',
                data: downloadOptions,
                timestamp: Date.now()
            });

            let downloadMessage = `
*☘️ 𝗧ɪᴛʟᴇ ➮* *_${movieData.title}_*

*📅 𝗥ᴇʟᴇꜱᴇᴅ ᴅᴀᴛᴇ ➮* _${movieData.date}_
*🌎 𝗖ᴏᴜɴᴛʀʏ ➮* _${movieData.country}_
*💃 𝗥ᴀᴛɪɴɢ ➮* _${movieData.imdb}_
*⏰ 𝗥ᴜɴᴛɪᴍᴇ ➮* _${movieData.runtime}_
*💁‍♂️ 𝗦ᴜʙᴛɪᴛʟᴇ ʙʏ ➮* _${movieData.subtitle}_
*🎭 𝗚ᴇɴᴀʀᴇꜱ ➮* _${movieData.genre}_

> ⚜️ 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐝  -  𝐇 𝐈 𝐑 𝐀 𝐍  𝐌 𝐃  𝐁 𝐘  𝐇 𝐈 𝐑 𝐀 𝐍 𝐘 𝐀  𝐒 𝐀 𝐓 𝐇 𝐒 𝐀 𝐑 𝐀  
`;
            downloadMessage += `\n*📥 Download Links (Reply with number):*\n`;
            index = 1;
            if (sd) {
                downloadMessage += `*SD 480P:*\n[${index++}] MP4: ${prefix}mp4 ${sd}\n[${index++}] MKV: ${prefix}mkv ${sd}\n[${index++}] ZIP: ${prefix}zip ${sd}\n[${index++}] RAR: ${prefix}fetchrar ${sd}\n`;
            }
            if (hd) {
                downloadMessage += `*HD 720P:*\n[${index++}] MP4: ${prefix}mp4 ${hd}\n[${index++}] MKV: ${prefix}mkv ${hd}\n[${index++}] ZIP: ${prefix}zip ${hd}\n[${index++}] RAR: ${prefix}fetchrar ${hd}\n`;
            }
            if (fhd) {
                downloadMessage += `*FHD 1080P:*\n[${index++}] MP4: ${prefix}mp4 ${fhd}\n[${index++}] MKV: ${prefix}mkv ${fhd}\n[${index++}] ZIP: ${prefix}zip ${fhd}\n[${index++}] RAR: ${prefix}fetchrar ${fhd}\n`;
            }

            const opts = movieData.image ? { image: { url: movieData.image }, caption: downloadMessage } : { text: downloadMessage };
            return await conn.sendMessage(from, opts, { quoted: mek });
        } else if (command === 'download') {
            // User selected a download option
            const item = data[number];
            const [cmd, url] = item.command.split(' ', 2);
            await conn.sendMessage(from, { text: `Downloading ${item.quality} ${item.format}...` }, { quoted: mek });
            return commands.find(c => c.pattern === cmd.replace('.', '')).handler(conn, mek, m, { reply, q: url, prefix: '.', from });
        } else {
            return reply('*Error: Unknown context!*');
        }
    } catch (e) {
        console.error('Select error:', e);
        reply(`*Error: ${e.message}*`);
    }
});

// Generic download function
async function downloadFile(conn, mek, m, { from, q, reply }, fileType) {
    if (!mek || !mek.key || !isValidJid(from)) {
        console.error('Invalid mek or from:', { mek, from });
        return reply('*Error: Invalid chat ID. Please try again in a valid chat.*');
    }
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
        await conn.sendMessage(from, message, { quoted: mek }); // Send to user
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (error) {
        console.error('Download error:', error);
        await conn.sendMessage(from, { text: `*Error: ${error.message}*` }, { quoted: mek });
    }
}

// Download commands
['mp4', 'mkv', 'zip', 'fetchrar'].forEach(fileType => {
    cmd({
        pattern: fileType,
        react: "📥",
        dontAddCommandList: true,
        filename: __filename
    }, async (conn, mek, m, params) => downloadFile(conn, mek, m, params, fileType === 'fetchrar' ? 'rar' : fileType));
});
