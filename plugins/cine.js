const { fetchJson } = require('../lib/functions');
const { cmd } = require('../command');
const { getBuffer, sleep } = require('../lib/functions');
const conf = require('../config.js');

cmd({
  pattern: "cines",
  alias: ["ci"],
  react: "🎬",
  desc: "Search and download movies from CineSubz",
  category: "movie",
  filename: __filename,
}, async (conn, m, mek, { from, q, mnu, isME, reply }) => {
  try {
    // Validate input query
    if (!q) {
      return await reply("*Please provide a movie name to search! (e.g., Avatar)*");
    }

    // Step 1: Search movies from CineSubz API
    const searchResponse = await fetchJson(
      `https://cinesubz-api-zazie.vercel.app/api/search?q=${encodeURIComponent(q)}`
    );
    const searchData = searchResponse;

    if (!searchData.status || !searchData.result?.data?.length) {
      return await reply(`*No results found for:* "${q}"`);
    }

    const searchResults = searchData.result.data;
    let resultsMessage = `✨ *QUEEN ANJU CINESUBZ DOWNLOADER* ✨\n\n🎥 *Search Results for* "${q}":\n\n`;

    searchResults.forEach((result, index) => {
      resultsMessage += `*${index + 1}.* ${result.title} (${result.year})\n🔗 Link: ${result.link}\n\n`;
    });

    await sleep(2000);
    const sentMsg = await conn.sendMessage(
      from,
      { text: resultsMessage },
      { quoted: mek }
    );
    const messageID = sentMsg.key.id;

    // Step 2: Wait for the user to select a movie
    conn.addReplyTracker(messageID, async (mek, messageType) => {
      if (!mek.message) return;
      const sender = mek.key.participant || mek.key.remoteJid;
      const selectedNumber = parseInt(messageType.trim());

      if (
        !isNaN(selectedNumber) &&
        selectedNumber > 0 &&
        selectedNumber <= searchResults.length
      ) {
        const selectedMovie = searchResults[selectedNumber - 1];

        // Step 3: Fetch download links for the selected movie
        const movieResponse = await fetchJson(
          `https://cinesubz-api-zazie.vercel.app/api/movie?url=${encodeURIComponent(
            selectedMovie.link
          )}`
        );
        const movieData = movieResponse;

        if (!movieData.status || !movieData.result?.data?.dl_links) {
          return await reply("*Error fetching download links for this movie.*");
        }

        const { title, imdbRate, image, date, country, duration, dl_links } = movieData.result.data;

        if (dl_links.length === 0) {
          return await reply("*No download links available for this movie.*");
        }

        let downloadMessage = `🎥 *${title}*\n\n*Available Download Links:*\n`;
        dl_links.forEach((link, index) => {
          downloadMessage += `*${index + 1}.* ${link.quality} - ${link.size}\n\n`;
        });

        const sentDownloadMsg = await conn.sendMessage(
          from,
          { text: downloadMessage },
          { quoted: mnu }
        );
        const downloadMessageID = sentDownloadMsg.key.id;

        // Step 4: Wait for the user to select a download quality
        conn.addReplyTracker(downloadMessageID, async (mek, downloadMessageType) => {
          if (!mek.message) return;
          const sender = mek.key.participant || mek.key.remoteJid;
          const selectedQuality = parseInt(downloadMessageType.trim());

          if (
            !isNaN(selectedQuality) &&
            selectedQuality > 0 &&
            selectedQuality <= dl_links.length
          ) {
            const selectedLink = dl_links[selectedQuality - 1];

            // Step 5: Fetch the direct download link
            const movieLinkResponse = await fetchJson(
              `https://cinesubz-api-zazie.vercel.app/api/links?url=${encodeURIComponent(
                selectedLink.link
              )}`
            );
            const movieLinkData = movieLinkResponse;

            // Check if direct link exists
            if (!movieLinkData?.result?.direct) {
              console.error('API response lacks direct link:', movieLinkData);
              return await reply("*Failed to retrieve direct download link. The link may be invalid or unavailable.*");
            }

            const downloadUrl = movieLinkData.result.direct;
            let sendto = isME ? conf.MOVIE_JID || from : from;

            let downloadMessag = `
🎬 *𝚀𝚄𝙴𝙴𝙽 𝙰𝙽𝙹𝚄 𝗫ᴾᴿᴼ 𝗖𝗜𝗡𝗘𝗠𝗔* 🎥  
╔══════════════════════════╗  
   𝙔𝙤𝙪𝙧 𝙂𝙖𝙩𝙚𝙬𝙖𝙮 𝙩𝙤  
    🎥 𝗘𝗻𝘁𝗲𝗿𝘁𝗮𝗶𝗻𝗺𝗲𝗻𝘁 🎥  
╚══════════════════════════╝  

✨ 🎥 **🎞 Movie:** *${title}*  

⭐ *𝗜𝗠𝗗𝗕 𝗥𝗮𝘁𝗶𝗻𝗴:* *${imdbRate}*  
📅 *�_R𝗲𝗹𝗲𝗮𝘀𝗲 𝗗𝗮𝘁𝗲:* *${date}*  
🌍 *𝗖𝗼𝘂𝗻𝘁𝗿𝘆:* *${country}*  
⏳ *𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻:* *${duration}*  

╔═════ஜ۩۞۩ஜ═════╗  
© 𝟸𝟶𝟸𝟻 *Queen Anju XPRO*  
🚀 *𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗚𝗮𝗺𝗶𝗻𝗴 𝗥𝗮𝘀𝗵*  
🔗 *GitHub:github.com/Mrrashmika/Queen_Anju-MD 
📡 _Stay Connected. Stay Entertained!_  
╚═════ஜ۩۞۩ஜ═════╝`;

            await conn.sendMessage(from, { react: { text: '⬆️', key: sentDownloadMsg.key } });

            await conn.sendMessage(
              sendto,
              {
                document: { url: downloadUrl },
                mimetype: "video/mp4",
                fileName: `${title} - ${selectedLink.quality}.mp4`,
                caption: downloadMessag,
                contextInfo: {
                  mentionedJid: [],
                  groupMentions: [],
                  forwardingScore: 999,
                  isForwarded: true,
                  forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363299978149557@newsletter',
                    newsletterName: "© 𝚀𝚄𝙴𝙴𝙽 𝙰𝙽𝙹𝚄 𝗑ᴾᴿᴼ 💚",
                    serverMessageId: 999
                  },
                  externalAdReply: {
                    title: title,
                    body: '🎬 *𝚀𝚄𝙴𝙴𝙽 𝙰𝙽𝙹𝚄 𝗫ᴾᴿᴼ 𝗖𝗜𝗡𝗘𝗠𝗔* 🎥',
                    mediaType: 1,
                    sourceUrl: selectedMovie.link,
                    thumbnailUrl: image,
                    renderLargerThumbnail: true,
                    showAdAttribution: true
                  }
                }
              },
              { quoted: mnu }
            );

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
    console.error("Error during CineSubz command execution:", e);
    reply("*An error occurred while processing your request.*");
  }
});
