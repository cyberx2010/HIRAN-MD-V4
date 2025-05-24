const axios = require('axios');
const cheerio = require('cheerio');
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { File } = require('megajs');
const config = require('../config');
const { cmd, commands } = require('../command');
const { getBuffer, getRandom, isUrl, Json, jsonformat } = require('../lib/functions');

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
async function searchSinhalaSub(conn, m, mek, { from, q, isDev, reply }, useButtons = true, isTVShow = false) {
    if (!isDev) return reply('⚠️ ⚠️ *Contact owner to activate your number as a Premium user*');
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
        const rows = data.map(item => ({
            header: item.Title,
            title: item.Type,
            description: item.Year,
            id: `${commandPrefix} ${item.Link}`
        }));

        if (useButtons) {
            const buttons = [{
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: `Download ${isTVShow ? 'TV Show' : 'Movie'} 📥`,
                    sections: [{
                        title: `Search By sinhalasub`,
                        highlight_label: 'T.C MOVIE-DL',
                        rows
                    }]
                })
            }];
            const opts = {
                image: data[0].Img,
                header: `🎬━_*T.C SINHALASUB DL*_━🎬`,
                footer: 'MOVIE DOWNLOADER BY TC',
                body: `⏳ Search: ${q}\n📲 Top ${data.length} Results\n${isTVShow ? 'TV Shows' : 'Movies'}`
            };
            return await conn.sendButtonMessage(from, buttons, m, opts);
        } else {
            let textw = `🔎 𝗧.𝗖 ${isTVShow ? 'TV SHOW' : 'MOVIE'} 𝗦𝗘𝗔𝗥𝗖𝗛\n\n`;
            for (const item of data) {
                textw += `*⛓️ No:* ${item.No}\n*📃 Title:* ${item.Title}\n*📚 CatName:* ${item.Type}\n*💫 Rating:* ${item.Rating}\n*📅 Date:* ${item.Year}\n*📎 Link:* ${item.Link}\n\n--------------------------------------------\n\n`;
            }
            return await conn.sendMessage(from, { image: { url: data[0].Img }, caption: textw }, { quoted: mek });
        }
    } catch (e) {
        console.error(e);
        reply(`*Error: ${e.message}*`);
    }
}

// Generic download function for different file types
async function downloadFile(conn, mek, m, { from, q, isDev, reply }, fileType) {
    if (!isDev) return reply('⚠️ ⚠️ *Contact owner to activate your number as a Premium user*');
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
        await conn.sendMessage(config.JID, message, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (error) {
        console.error('Error fetching or sending:', error);
        await conn.sendMessage(from, { text: `*Error: ${error.message}*` }, { quoted: mek });
    }
}

// Search for movies (button format)
cmd({
    pattern: "sinhalasub",
    react: '📑',
    category: "search",
    desc: "Search for movies on sinhalasub.lk",
    filename: __filename
}, async (conn, m, mek, params) => searchSinhalaSub(conn, m, mek, params, true, false));

// Search for movies (text format)
cmd({
    pattern: "sinhalasub1",
    react: '🔎',
    category: "search",
    desc: "Search for movies on sinhalasub.lk (text format)",
    filename: __filename
}, async (conn, m, mek, params) => searchSinhalaSub(conn, m, mek, params, false, false));

// Search for TV shows
cmd({
    pattern: "sinhalatvshow",
    react: '📑',
    category: "search",
    desc: "Search for TV shows on sinhalasub.lk",
    filename: __filename
}, async (conn, m, mek, params) => searchSinhalaSub(conn, m, mek, params, true, true));

// Fetch movie details and download links
cmd({
    pattern: "subin",
    react: '📑',
    category: "search",
    desc: "Fetch movie details and download links",
    filename: __filename
}, async (conn, mek, m, { reply, q, isDev, prefix, from }) => {
    if (!isDev) return reply('⚠️ ⚠️ *Contact owner to activate your number as a Premium user*');
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

        const msg = `📃 𝗧.𝗖 𝗠𝗢𝗩𝗜𝗘 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥\n\n
📃 *Title:* ${newsHeadline}\n
🔗 *Link:* ${q}\n
📅 *Year:* ${newsDate}\n
💫 *Rating:* ${rat}\n
⏳ *Duration:* ${duration}\n
📝 *Description:* ${desc}\n`;

        const rows = [
            { header: 'Select Mp4 Type Movie', title: `SD 480P`, description: '', id: `${prefix}mp4 ${sd || ''}` },
            { header: '', title: `HD 720P`, description: '', id: `${prefix}mp4 ${hd || ''}` },
            { header: '', title: `FHD 1080P`, description: '', id: `${prefix}mp4 ${fhd || ''}` }
        ];
        const rows1 = [
            { header: 'Select Mkv Type Movie', title: `SD 480P`, description: '', id: `${prefix}mkv ${sd || ''}` },
            { header: '', title: `HD 720P`, description: '', id: `${prefix}mkv ${hd || ''}` },
            { header: '', title: `FHD 1080P`, description: '', id: `${prefix}mkv ${fhd || ''}` }
        ];
        const rows2 = [
            { header: 'Select Zip Type Movie', title: `SD 480P`, description: '', id: `${prefix}zip ${sd || ''}` },
            { header: '', title: `HD 720P`, description: '', id: `${prefix}zip ${hd || ''}` },
            { header: '', title: `FHD 1080P`, description: '', id: `${prefix}zip ${fhd || ''}` }
        ];
        const rows3 = [
            { header: 'Select Rar Type Movie', title: `SD 480P`, description: '', id: `${prefix}fetchrar ${sd || ''}` },
            { header: '', title: `HD 720P`, description: '', id: `${prefix}fetchrar ${hd || ''}` },
            { header: '', title: `FHD 1080P`, description: '', id: `${prefix}fetchrar ${fhd || ''}` }
        ];

        const buttons = [
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: 'DOWNLOAD MP4 TYPE',
                    sections: [{ title: 'Please select a quality', highlight_label: 'MP4', rows }]
                })
            },
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: 'DOWNLOAD MKV TYPE',
                    sections: [{ title: 'Please select a quality', highlight_label: 'MKV', rows: rows1 }]
                })
            },
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: 'DOWNLOAD ZIP TYPE',
                    sections: [{ title: 'Please select a quality', highlight_label: 'ZIP', rows: rows2 }]
                })
            },
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: 'DOWNLOAD RAR TYPE',
                    sections: [{ title: 'Please select a quality', highlight_label: 'RAR', rows: rows3 }]
                })
            }
        ];

        const opts = {
            image: newsTime,
            header: '🎬━_*T.C SINHALASUB DL*_━🎬',
            footer: config.FOOTER,
            body: msg
        };
        return await conn.sendButtonMessage(from, buttons, m, opts, { quoted: mek });
    } catch (e) {
        console.error(e);
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
}, async (conn, m, mek, { from, q, isDev, reply }) => {
    if (!isDev) return reply('⚠️ ⚠️ *Contact owner to activate your number as a Premium user*');
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

        const rows = download_links.map(item => ({
            header: item.number,
            title: item.name,
            description: item.date,
            id: `.subin2 ${item.link}`
        }));

        const buttons = [{
            name: "single_select",
            buttonParamsJson: JSON.stringify({
                title: 'Select episode 📥',
                sections: [{
                    title: 'Search By sinhalasub',
                    highlight_label: 'T.C MOVIE-DL',
                    rows
                }]
            })
        }];

        const info = `📌 *Link:* ${q}\n📑 *Title:* ${title}\n📝 *Description:* ${desc}`;
        const opts = {
            image: image || 'https://github.com/kushansewmina1234/DARKSHAN-DATA/blob/main/media/image/IMG-20240907-WA0006.jpg?raw=true',
            header: '🎬━_*T.C SINHALASUB DL*_━🎬',
            footer: 'MOVIE DOWNLOADER BY TC',
            body: info
        };
        return await conn.sendButtonMessage(from, buttons, m, opts);
    } catch (e) {
        console.error(e);
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
}, async (conn, mek, m, { reply, q, isDev, prefix, from }) => {
    if (!isDev) return reply('⚠️ ⚠️ *Contact owner to activate your number as a Premium user*');
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

        const msg = `📃 𝗧.𝗖 𝗠𝗢𝗩𝗜𝗘 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥\n\n
📌 *Title:* ${title}\n
🔗 *Link:* ${q}\n
📅 *Date:* ${date}\n
📝 *Description:* ${desc}\n`;

        const rows = [
            { header: 'Select Mp4 Type Episode', title: `SD 480P`, description: '', id: `${prefix}mp4 ${sd || ''}` },
            { header: '', title: `HD 720P`, description: '', id: `${prefix}mp4 ${hd || ''}` },
            { header: '', title: `FHD 1080P`, description: '', id: `${prefix}mp4 ${fhd || ''}` }
        ];
        const rows1 = [
            { header: 'Select Mkv Type Episode', title: `SD 480P`, description: '', id: `${prefix}mkv ${sd || ''}` },
            { header: '', title: `HD 720P`, description: '', id: `${prefix}mkv ${hd || ''}` },
            { header: '', title: `FHD 1080P`, description: '', id: `${prefix}mkv ${fhd || ''}` }
        ];
        const rows2 = [
            { header: 'Select Zip Type Episode', title: `SD 480P`, description: '', id: `${prefix}zip ${sd || ''}` },
            { header: '', title: `HD 720P`, description: '', id: `${prefix}zip ${hd || ''}` },
            { header: '', title: `FHD 1080P`, description: '', id: `${prefix}zip ${fhd || ''}` }
        ];
        const rows3 = [
            { header: 'Select Rar Type Episode', title: `SD 480P`, description: '', id: `${prefix}fetchrar ${sd || ''}` },
            { header: '', title: `HD 720P`, description: '', id: `${prefix}fetchrar ${hd || ''}` },
            { header: '', title: `FHD 1080P`, description: '', id: `${prefix}fetchrar ${fhd || ''}` }
        ];

        const buttons = [
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: 'DOWNLOAD MP4 TYPE',
                    sections: [{ title: 'Please select a quality', highlight_label: 'MP4', rows }]
                })
            },
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: 'DOWNLOAD MKV TYPE',
                    sections: [{ title: 'Please select a quality', highlight_label: 'MKV', rows: rows1 }]
                })
            },
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: 'DOWNLOAD ZIP TYPE',
                    sections: [{ title: 'Please select a quality', highlight_label: 'ZIP', rows: rows2 }]
                })
            },
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: 'DOWNLOAD RAR TYPE',
                    sections: [{ title: 'Please select a quality', highlight_label: 'RAR', rows: rows3 }]
                })
            }
        ];

        const opts = {
            image: image || 'https://github.com/kushansewmina1234/DARKSHAN-DATA/blob/main/media/image/IMG-20240907-WA0006.jpg?raw=true',
            header: '🎬━_*T.C SINHALASUB DL*_━🎬',
            footer: 'MOVIE DOWNLOADER BY TC',
            body: msg
        };
        return await conn.sendButtonMessage(from, buttons, m, opts);
    } catch (e) {
        console.error(e);
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
