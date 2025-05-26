const axios = require('axios');
const cheerio = require('cheerio');
const { cmd, commands } = require('../command');
const { getBuffer, getRandom, isUrl, fetchJson, jsonformat } = require('../lib/functions');

cmd({
    pattern: "sinhalasub",
    react: '🔎',
    category: "search",
    desc: "Search and download movies from sinhalasub.lk",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, quoted }) => {
    try {
        if (!q) return await reply('*Please provide a movie name!*');

        // Step 1: Search for movies
        const url = `https://sinhalasub.lk/?s=${encodeURIComponent(q)}`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const data = $(".search-page .result-item article")
            .map((index, element) => ({
                No: index + 1,
                Title: $(element).find(".details .title a").text().trim(),
                Desc: $(element).find('.details .contenido p').text().trim(),
                Img: $(element).find('.image img').attr("src"),
                Type: $(element).find('.image span').text().trim(),
                Link: $(element).find(".details .title a").attr("href"),
                Year: $(element).find('.details span .rating').text().trim(),
                Rating: $(element).find('.details span').text().trim(),
            })).get();

        if (data.length < 1) return await conn.sendMessage(from, { text: 'No results found!' }, { quoted: mek });

        // Step 2: Check if user replied with a number to select a movie
        if (quoted && quoted.text && /^\d+$/.test(quoted.text.trim())) {
            const selectedNo = parseInt(quoted.text.trim()) - 1;
            if (selectedNo < 0 || selectedNo >= data.length) return await reply('*Invalid selection!*');

            const selectedMovie = data[selectedNo];
            const movieResponse = await axios.get(selectedMovie.Link);
            const $x = cheerio.load(movieResponse.data);
            const newsArticle = $x(".sheader").first();
            const newsHeadline = newsArticle.find(".data .head h1").text().trim();
            const date = newsArticle.find(".extra .date").text().trim();
            const duration = newsArticle.find(".extra .runtime").text().trim();
            const infoMovie = $x("#info").first();
            const desc = infoMovie.find(".wp-content p").text().trim();
            const rat = infoMovie.find("#repimdb strong").text().trim();
            const img = newsArticle.find(".poster img").attr("src");

            let download_links = [];
            $x("#download > div > div > table > tbody > tr").each((c, d) => {
                download_links.push({
                    quality: $x(d).find("td > strong").text(),
                    size: $x(d).find("td").eq(2).text(),
                    link: $x(d).find("td > a").attr("href"),
                });
            });

            // Extract download URLs
            const qualities = ['FHD 1080P', 'HD 720P', 'SD 480P'];
            let downloadUrls = {};
            for (let i = 0; i < Math.min(download_links.length, 3); i++) {
                const shan = await axios.get(download_links[i].link);
                const $p = cheerio.load(shan.data);
                const link = $p("#link").attr("href");
                const dat = link.split("https://pixeldrain.com/u/")[1];
                downloadUrls[qualities[i]] = `https://pixeldrain.com/api/file/${dat}`;
            }

            // Prepare message with download options
            const msg = `📃 *T.C MOVIE DOWNLOADER*\n\n
📃 *Title:* ${newsHeadline}\n
🔗 *Link:* ${selectedMovie.Link}\n
📅 *Year:* ${date}\n
💫 *Rating:* ${rat}\n
⏳ *Duration:* ${duration}\n
📝 *Description:* ${desc}\n`;

            const rows = [];
            const rows1 = [];
            const rows2 = [];
            const rows3 = [];
            for (const quality of qualities) {
                if (downloadUrls[quality]) {
                    rows.push({
                        header: 'Select MP4 Type Movie',
                        title: quality,
                        description: '',
                        id: `.downloadmp4 ${downloadUrls[quality]}`
                    });
                    rows1.push({
                        header: 'Select MKV Type Movie',
                        title: quality,
                        description: '',
                        id: `.downloadmkv ${downloadUrls[quality]}`
                    });
                    rows2.push({
                        header: 'Select ZIP Type Movie',
                        title: quality,
                        description: '',
                        id: `.downloadzip ${downloadUrls[quality]}`
                    });
                    rows3.push({
                        header: 'Select RAR Type Movie',
                        title: quality,
                        description: '',
                        id: `.downloadrar ${downloadUrls[quality]}`
                    });
                }
            }

            let buttons = [
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
                        sections: [{ title: 'Please select a quality', highlight_label: 'MKV', rows1 }]
                    })
                },
                {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: 'DOWNLOAD ZIP TYPE',
                        sections: [{ title: 'Please select a quality', highlight_label: 'ZIP', rows2 }]
                    })
                },
                {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: 'DOWNLOAD RAR TYPE',
                        sections: [{ title: 'Please select a quality', highlight_label: 'RAR', rows3 }]
                    })
                }
            ];

            let opts = {
                image: img,
                header: '🎬━_*T.C SINHALASUB DL*_━🎬',
                footer: 'MOVIE DOWNLOADER BY TC',
                body: msg
            };

            return await conn.sendButtonMessage(from, buttons, m, opts, { quoted: mek });
        }

        // Step 3: Send search results (non-button for .sinhalasub, button for .sinhalasub1 equivalent)
        let textw = `🔎 *T.C MOVIE SEARCH*\n\n`;
        for (const item of data) {
            textw += `*⛓️ No:* ${item.No}\n`;
            textw += `*📃 Title:* ${item.Title}\n`;
            textw += `*📚 CatName:* ${item.Type}\n`;
            textw += `*💫 Rating:* ${item.Rating}\n`;
            textw += `*📅 Date:* ${item.Year}\n`;
            textw += `*📎 Link:* ${item.Link}\n\n--------------------------------------------\n\n`;
        }

        const rows = data.map(item => ({
            header: item.Title,
            title: item.Type,
            description: item.Year,
            id: `.sinhalasub ${q}` // Keep the command to allow selection
        }));

        let buttons = [{
            name: "single_select",
            buttonParamsJson: JSON.stringify({
                title: 'Select Movie 📥',
                sections: [{
                    title: 'Search By sinhalasub',
                    highlight_label: 'T.C MOVIE-DL',
                    rows
                }]
            })
        }];

        let opts = {
            image: data[0].Img,
            header: '🎬━_*T.C SINHALASUB DL*_━🎬',
            footer: 'MOVIE DOWNLOADER BY TC',
            body: `⏳ Search: ${q}\n📲 Top ${data.length} Results\n\n*Reply with the number of the movie to see details and download options.*`
        };

        // Send both non-button and button responses
        await conn.sendMessage(from, { text: textw }, { quoted: mek });
        await conn.sendButtonMessage(from, buttons, m, opts, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.log(e);
        await reply('*Error occurred!*');
    }
});

// Download commands
const downloadHandler = (type, ext) => async (conn, mek, m, { from, q, reply }) => {
    if (!q) return await reply('*Please provide a direct URL!*');

    try {
        const mediaUrl = q.trim();
        const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        const mediaBuffer = Buffer.from(response.data, 'binary');

        const vajiralod = [
            "《 █▒▒▒▒▒▒▒▒▒▒▒》10%",
            "《 ████▒▒▒▒▒▒▒▒》30%",
            "《 ███████▒▒▒▒▒》50%",
            "《 ██████████▒▒》80%",
            "《 ████████████》100%",
            "𝙸𝙽𝙸𝚃𝙸𝙰𝙻𝙸𝚉𝙴𝙳 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙴𝙳 🦄..."
        ];
        let { key } = await conn.sendMessage(from, { text: 'ᴜᴘʟᴏᴀᴅɪɴɢ ᴍᴏᴠɪᴇ...' });

        for (const progress of vajiralod) {
            await conn.sendMessage(from, { text: progress, edit: key });
        }

        const message = {
            document: mediaBuffer,
            caption: "*🎬 TC TEAM MOVIEDL 🎬*",
            mimetype: `TC MOVIE DL`,
            fileName: `TC MOVIEDL.${ext}`,
        };

        await conn.sendMessage(from, message, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (error) {
        console.error('Error fetching or sending', error);
        await conn.sendMessage(from, { text: '*Error fetching or sending file!*' }, { quoted: mek });
    }
};

cmd({
    pattern: "downloadmp4",
    react: "📥",
    dontAddCommandList: true,
    filename: __filename
}, downloadHandler('mp4', 'mp4'));

cmd({
    pattern: "downloadmkv",
    react: "📥",
    dontAddCommandList: true,
    filename: __filename
}, downloadHandler('mkv', 'mkv'));

cmd({
    pattern: "downloadzip",
    react: "📥",
    dontAddCommandList: true,
    filename: __filename
}, downloadHandler('zip', 'zip'));

cmd({
    pattern: "downloadrar",
    react: "📥",
    dontAddCommandList: true,
    filename: __filename
}, downloadHandler('rar', 'rar'));
