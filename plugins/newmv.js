const { cmd } = require('../command');8
const axios = require('axios');

// Function to get current date and time in +0530 timezone
function getCurrentDateTime() {
    const now = new Date();
    const offset = 5.5 * 60 * 60 * 1000; // +0530 offset in milliseconds
    const localTime = new Date(now.getTime() + offset);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = days[localTime.getUTCDay()];
    const date = localTime.toISOString().split('T')[0];
    const time = localTime.toISOString().split('T')[1].split('.')[0];
    return `${day}, ${date}, ${time} +0530`;
}

// Function to search movies using CineSubz API
async function searchMovies(query) {
    const api = {
        url: `https://cinesubz-api-zazie.vercel.app/api/search?q=${encodeURIComponent(query)}`,
        name: "CineSubz",
        parseResults: (data) => {
            if (!data || !data.status || !data.result || !data.result.data || !Array.isArray(data.result.data)) {
                throw new Error("Invalid response structure");
            }
            return data.result.data.map(item => ({
                title: item.title || "Unknown Title",
                link: item.link || "",
                year: item.year || "N/A",
            }));
        },
    };

    let results = [];
    let errorMessages = [];

    try {
        const response = await axios.get(api.url, { timeout: 10000 });
        results = api.parseResults(response.data);
        if (results.length === 0) {
            errorMessages.push(`${api.name}: No results found`);
        }
    } catch (err) {
        errorMessages.push(`${api.name}: ${err.message}`);
    }

    return { results: results.slice(0, 10), errors: errorMessages };
}

// Function to fetch movie details and download links
async function getMovieDetails(movieUrl) {
    const apiUrl = `https://cinesubz-api-zazie.vercel.app/api/movie?url=${encodeURIComponent(movieUrl)}`;
    try {
        const response = await axios.get(apiUrl, { timeout: 10000 });
        const movieData = response.data.result.data;
        if (!movieData) {
            throw new Error("No movie data returned");
        }
        if (!movieData.dl_links || movieData.dl_links.length === 0) {
            throw new Error("No download links found");
        }
        return {
            title: movieData.title || "Unknown Title",
            imdb: movieData.imdbRate || "N/A",
            date: movieData.date || "N/A",
            country: movieData.country || "N/A",
            runtime: movieData.duration || "N/A",
            image: movieData.image || "",
            dl_links: movieData.dl_links.map(link => ({
                quality: link.quality || "Unknown Quality",
                size: link.size || "Unknown Size",
                link: link.link || "",
            })),
        };
    } catch (err) {
        throw new Error(`Failed to fetch movie details: ${err.message}`);
    }
}

// Function to get direct download link
async function getDirectDownloadLink(downloadLink) {
    const apiUrl = `https://cinesubz-api-zazie.vercel.app/api/links?url=${encodeURIComponent(downloadLink)}`;
    try {
        const response = await axios.get(apiUrl, { timeout: 10000 });
        const linkData = response.data.result;
        if (!linkData || !linkData.direct) {
            throw new Error("No direct download link found");
        }
        return linkData.direct;
    } catch (err) {
        throw new Error(`Failed to fetch direct download link: ${err.message}`);
    }
}

// Command for movies
cmd({
    pattern: "sub",
    alias: ["subfilm"],
    react: "🎬",
    desc: "Search and download movies from CineSubz",
    category: "movie",
    filename: __filename,
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        // Step 1: Validate input query
        if (!q) {
            return await reply("*Please provide a movie name to search! (e.g., Deadpool)*");
        }

        // Step 2: Search movies
        const { results, errors } = await searchMovies(q);
        if (results.length === 0) {
            return await reply(`*No movies found for:* "${q}"\n${errors.join('\n')}\n*Please try a different search term.*`);
        }

        // Step 3: Send search results to user
        let resultsMessage = `✨ *SOLO-LEVELING MOVIE DOWNLOADER* ✨\n\n🎥 *Search Results for* "${q}" (Date: ${getCurrentDateTime()}):\n\n`;
        results.forEach((result, index) => {
            resultsMessage += `*${index + 1}.* ${result.title} (${result.year}) [CineSubz]\n🔗 Link: ${result.link}\n\n`;
        });
        resultsMessage += `\n📩 *Please reply with the number of the movie you want to download.*`;

        const sentMsg = await conn.sendMessage(from, { text: resultsMessage }, { quoted: mek });
        const messageID = sentMsg.key.id;

        // Step 4: Wait for user to select a movie
        conn.addReplyTracker(messageID, async (mek, messageType) => {
            if (!mek.message) return;
            const from = mek.key.remoteJid;
            const selectedNumber = parseInt(messageType.trim());
            if (!isNaN(selectedNumber) && selectedNumber > 0 && selectedNumber <= results.length) {
                const selectedMovie = results[selectedNumber - 1];

                // Step 5: Fetch movie details
                let movieData;
                try {
                    movieData = await getMovieDetails(selectedMovie.link);
                } catch (err) {
                    return await reply(`*Error fetching movie details:* ${err.message}\n*Try another movie or check the URL.*`);
                }

                // Step 6: Send available download links
                let downloadMessage = `🎥 *${movieData.title}*\n\n*Available Download Links:*\n`;
                movieData.dl_links.forEach((link, index) => {
                    downloadMessage += `*${index + 1}.* ${link.quality} - ${link.size}\n\n`;
                });
                downloadMessage += `\n📩 *Please reply with the number of the quality you want to download.*`;

                const sentDownloadMsg = await conn.sendMessage(from, { text: downloadMessage }, { quoted: mek });
                const downloadMessageID = sentDownloadMsg.key.id;

                // Step 7: Wait for user to select a quality
                conn.addReplyTracker(downloadMessageID, async (mek, downloadMessageType) => {
                    if (!mek.message) return;
                    const from = mek.key.remoteJid;
                    const selectedQuality = parseInt(downloadMessageType.trim());
                    if (!isNaN(selectedQuality) && selectedQuality > 0 && selectedQuality <= movieData.dl_links.length) {
                        const selectedLink = movieData.dl_links[selectedQuality - 1];

                        // Step 8: Fetch direct download link
                        let directDownloadUrl;
                        try {
                            directDownloadUrl = await getDirectDownloadLink(selectedLink.link);
                        } catch (err) {
                            return await reply(`*Error fetching direct download link:* ${err.message}\n*Please try another quality or movie.*`);
                        }

                        // Step 9: Send the movie as a document
                        await conn.sendMessage(from, { react: { text: '⬇️', key: sentDownloadMsg.key } });

                        let downloadMessag = `
🎬 *SOLO-LEVELING CINEMA* 🎥  
╔══════════════════════════╗  
   Your Gateway to  
    🎥 Entertainment 🎥  
╚══════════════════════════╝  

✨ 🎥 **🎞 Movie:** *${movieData.title}*  

⭐ *IMDB Rating:* *${movieData.imdb}*  
📅 *Release Date:* *${movieData.date}*  
🌍 *Country:* *${movieData.country}*  
⏳ *Duration:* *${movieData.runtime}*  

╔═════ஜ۩۞۩ஜ═════╗  
© 2025 *SOLO-LEVELING*  
🚀 *POWERED BY RUKSHAN*  
📡 _Stay Connected. Stay Entertained!_  
╚═════ஜ۩۞۩ஜ═════╝`;

                        await conn.sendMessage(from, { react: { text: '⬆️', key: sentDownloadMsg.key } });

                        await conn.sendMessage(from, {
                            document: { url: directDownloadUrl },
                            mimetype: "video/mp4",
                            fileName: `${movieData.title} - ${selectedLink.quality}.mp4`,
                            caption: downloadMessag,
                            contextInfo: {
                                mentionedJid: [],
                                groupMentions: [],
                                forwardingScore: 999,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: '120363401755639074@newsletter',
                                    newsletterName: "© SOLO-LEVELING 💚",
                                    serverMessageId: 999,
                                },
                                externalAdReply: {
                                    title: movieData.title,
                                    body: '🎬 *SOLO-LEVELING CINEMA* 🎥',
                                    mediaType: 1,
                                    sourceUrl: selectedMovie.link,
                                    thumbnailUrl: movieData.image,
                                    renderLargerThumbnail: true,
                                    showAdAttribution: true,
                                },
                            },
                        }, { quoted: mek });

                        await conn.sendMessage(from, { react: { text: '✅', key: sentDownloadMsg.key } });
                    } else {
                        await reply("Invalid selection. Please reply with a valid number.");
                    }
                });
            } else {
                await reply("Invalid selection. Please reply with a valid number.");
            }
        });
    } catch (e) {
        console.error("Error during movie download:", e.message, e.stack);
        reply(`*An error occurred while processing your request:* ${e.message}\n*Please try again later or use a different search term.*`);
    }
});
