const mime = require('mime-types'); // Make sure to install mime-types package
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { File } = require('megajs');
const config = require('../config');
const { sinhalaSub } = require("mrnima-moviedl");
const {
  cmd,
  commands
} = require('../command');

// Helper function to fetch final download link
async function get_dl_link(apilink) {
    try {
        const res = await axios.get(apilink);
        const $ = cheerio.load(res.data);
        const link = $("#link").attr("href");
        const dl_link = await generateMatchingLinks(link); // Assumed to be defined elsewhere
        return dl_link;
    } catch (error) {
        console.error("Error fetching download link:", error.message);
        return null;
    }
}

// Search movies on cinesubz.co
cmd({
    pattern: "cines",
    react: '🔎',
    category: "search",
    desc: "cinesubz movie downloader",
    filename: __filename
},
async (conn, m, mek, { from, q, l, reply }) => {
    try {
        if (!q) return await reply('*Please give me a search query!*');
        const link = `https://cinesubz.co/?s=${q}`;
        const response = await axios.get(link);
        const $ = cheerio.load(response.data);
        const result = [];

        $("div.module > div.content.rigth.csearch > div > div > article").each((a, b) => {
            result.push({
                title: $(b).find("a").text().replace(/\n/g, '').trim(),
                image: $(b).find("img").attr("src"),
                imdb: $(b).find("div.meta > span.rating").text().trim(),
                year: $(b).find("div.meta > span.year").text().trim(),
                link: $(b).find("div.title > a").attr("href"),
                short_desc: $(b).find("div.contenido > p").text().trim()
            });
        });

        if (result.length < 1) return await conn.sendMessage(from, { text: 'No results found!' }, { quoted: mek });

        let textw = `🔎 𝗧.𝗖 𝗖𝗜𝗡𝗘𝗦𝗨𝗕𝗭 𝗠𝗢𝗩𝗜𝗘 𝗦𝗘𝗔𝗥𝗖𝗛 \n\n`;
        for (let i = 0; i < result.length; i++) {
            textw += `*📌 Title:* ${result[i].title}\n`;
            textw += `*📚 IMDB:* ${result[i].imdb}\n`;
            textw += `*📅 Year:* ${result[i].year}\n`;
            textw += `*📎 Link:* ${result[i].link}\n`;
            textw += `*📃 Description:* ${result[i].short_desc}\n\n--------------------------------------------\n\n`;
        }

        await conn.sendMessage(from, { image: { url: result[0].image }, caption: textw }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: `✅`, key: mek.key } });
    } catch (e) {
        reply('*Error occurred!*');
        l(e);
    }
});

// Alternative search on cineru.lk
cmd({
    pattern: "ci",
    react: '🔎',
    category: "search",
    desc: "cineru movie downloader",
    filename: __filename
},
async (conn, m, mek, { from, q, l, reply }) => {
    try {
        if (!q) return await reply('*Please give me a search query!*');
        const url = `https://cineru.lk/?s=${q}`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        let zipLink = null;
        if (url.includes('cineru.lk/')) {
            zipLink = $('a#btn-download').attr('data-link');
        } else {
            zipLink = null;
        }

        const info = `⏳ Search A Movie Name: ${q}\n🔗 *Download Link:* ${zipLink || 'Not found'}\nCinesubz`;
        await conn.sendMessage(from, { text: info }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: `✅`, key: mek.key } });
    } catch (e) {
        reply('*Error occurred!*');
        l(e);
    }
});

// Search movies and list results
cmd({
    pattern: "cine",
    react: '📑',
    category: "search",
    desc: "cine movie downloader",
    filename: __filename
},
async (conn, m, mek, { from, q, l, reply }) => {
    try {
        if (!q) return await reply('*Please give me a search query!*');
        const link = `https://cinesubz.co/?s=${q}`;
        const response = await axios.get(link);
        const $ = cheerio.load(response.data);
        const result = [];

        $("div.module > div.content.rigth.csearch > div > div > article").each((_, element) => {
            result.push({
                title: $(element).find("a").text().replace(/\n/g, '').trim(),
                image: $(element).find("img").attr("src"),
                imdb: $(element).find("div.meta > span.rating").text().trim(),
                year: $(element).find("div.meta > span.year").text().trim(),
                link: $(element).find("div.title > a").attr("href"),
                short_desc: $(element).find("div.contenido > p").text().trim()
            });
        });

        if (result.length < 1) return await conn.sendMessage(from, { text: 'No results found!' }, { quoted: mek });

        let textw = `🔎 𝗧.𝗖 𝗖𝗜𝗡𝗘𝗦𝗨𝗕𝗭 �_M𝗢𝗩𝗜𝗘 𝗦𝗘𝗔𝗥𝗖𝗛 \n\n`;
        for (let i = 0; i < result.length; i++) {
            textw += `*📌 Title:* ${result[i].title}\n`;
            textw += `*📚 IMDB:* ${result[i].imdb}\n`;
            textw += `*📅 Year:* ${result[i].year}\n`;
            textw += `*📎 Link:* ${result[i].link}\n`;
            textw += `*📃 Description:* ${result[i].short_desc}\n\n--------------------------------------------\n\n`;
        }

        await conn.sendMessage(from, { text: textw }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: `✅`, key: mek.key } });
    } catch (e) {
        reply('*Error occurred!*');
        l(e);
    }
});

// Fetch movie details and download links
cmd({
    pattern: "dl",
    react: '📑',
    category: "search",
    desc: "sinhalasub movie downloader",
    filename: __filename
},
async (conn, m, mek, { from, q, l, reply }) => {
    try {
        if (!q) return await reply("Please provide a movie link!");
        const link = `${q}`;
        const response = await axios.get(link);
        const $ = cheerio.load(response.data);
        const result = {};

        result.title = $("div.content.right > div.sheader > div.data > h1").text().trim();
        result.image = $("div.content.right > div.sheader > div.poster > img").attr("src");
        result.genres = [];
        $("div.content.right > div.sheader > div.data > div.sgeneros > a").each((_, element) => {
            result.genres.push($(element).text());
        });
        result.date = $("div.content.right > div.sheader > div.data > div.extra > span.date").text();
        result.country = $("div.content.right > div.sheader > div.data > div.extra > span.country").text();
        result.subtitle_author = $("div:nth-child(4) > center > span").text();
        result.imdb = $("#repimdb > strong").text();

        const download_links = [];
        $("#directdownloadlinks > div > div > table > tbody > tr").each((_, element) => {
            download_links.push({
                quality: $(element).find("td > a > strong").text(),
                size: $(element).find("td").eq(1).text(),
                link: $(element).find("td > a").attr("href"),
            });
        });

        const finalDownloadLinks = await Promise.all(download_links.map(async (i) => ({
            quality: i.quality,
            size: i.size,
            download_link: await get_dl_link(i.link)
        })));

        let msg = `📃 𝗧.𝗖 𝗖𝗜𝗡𝗘𝗦𝗨𝗕𝗭 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘�_R\n\n
📃 *Title:* ${result.title}\n
🎭 *Genres:* ${result.genres.join(', ')}\n
📅 *Date:* ${result.date}\n
🌍 *Country:* ${result.country}\n
✍️ *Subtitle Author:* ${result.subtitle_author}\n
⭐ *IMDB:* ${result.imdb}\n
🖼️ *Image:* ${result.image}\n
🔗 *Movie Page:* ${q}\n
\n*Download Links:*\n`;
        finalDownloadLinks.forEach((link) => {
            msg += `*Quality:* ${link.quality} | *Size:* ${link.size} | *Link:* ${link.download_link || 'Not available'}\n`;
        });

        await conn.sendMessage(from, { text: msg }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: `✅`, key: mek.key } });
    } catch (error) {
        reply('*Error fetching movie details!*');
        l(error);
    }
});

// Test command for scraping movies
cmd({
    pattern: "test",
    react: '🔎',
    category: "search",
    desc: "cinesubz movie downloader",
    filename: __filename
},
async (conn, m, mek, { from, q, l, reply }) => {
    try {
        if (!q) return await reply('*Please give me a search query!*');
        const url = `https://cinesubz.co/?s=${q}`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const movies = [];

        // Note: These selectors may need adjustment based on cinesubz.co's actual structure
        $('.movie-container').each((index, element) => {
            const title = $(element).find('.movie-title').text().trim();
            const rating = $(element).find('.movie-rating').text().trim();
            const runtimeText = $(element).find('.movie-runtime').text().trim();
            const runtimeInMinutes = parseInt(runtimeText.match(/\d+/)?.[0]) || 0;
            const runtime = formatRuntime(runtimeInMinutes);

            const qualities = [];
            $(element).find('.download-quality a').each((i, el) => {
                const quality = $(el).text().trim();
                const downloadLink = $(el).attr('href');
                qualities.push({ quality, downloadLink });
            });

            movies.push({
                title,
                rating,
                runtime,
                downloadQualities: qualities,
            });
        });

        if (movies.length < 1) return await conn.sendMessage(from, { text: 'No results found!' }, { quoted: mek });

        let textw = `🔎 𝗧.𝗖 𝗖𝗜𝗡𝗘𝗦𝗨𝗕𝗭 𝗠𝗢𝗩𝗜𝗘 𝗦𝗘𝗔�_R𝗖𝗛 \n\n`;
        for (let i = 0; i < movies.length; i++) {
            textw += `*📌 Title:* ${movies[i].title}\n`;
            textw += `*📚 Rating:* ${movies[i].rating}\n`;
            textw += `*📅 Runtime:* ${movies[i].runtime}\n`;
            textw += `*📎 Download Qualities:* ${movies[i].downloadQualities.map(q => `${q.quality}: ${q.downloadLink}`).join(', ')}\n\n--------------------------------------------\n\n`;
        }

        await conn.sendMessage(from, { text: textw }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: `✅`, key: mek.key } });
    } catch (e) {
        reply('*Error occurred!*');
        l(e);
    }
});

// Helper function for formatting runtime (used in test command)
function formatRuntime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
}
