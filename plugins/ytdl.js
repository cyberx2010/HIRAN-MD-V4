const { cmd } = require('../command');
const yts = require('yt-search');
const ddownr = require('denethdev-ytmp3');

cmd({
  pattern: "yt",
  desc: "Download YouTube songs or videos.",
  category: "download",
  react: '✓',
  filename: __filename
}, async (messageHandler, context, quotedMessage, { from, reply, q }) => {
  try {
    if (!q) return reply("*Please Provide A Song Or Video Name Or URL 🙄*");

    // Search YouTube
    const searchResults = await yts(q);
    if (!searchResults || searchResults.videos.length === 0) {
      return reply("*No Video Or Song Found Matching Your Query 🧐*");
    }

    const videoData = searchResults.videos[0];
    const videoUrl = videoData.url;

    // Download audio and video URLs using denethdev-ytmp3
    const audioResult = await ddownr.download(videoUrl, 'mp3');
    const videoResult = await ddownr.download(videoUrl, 'mp4');

    const audioDownloadLink = audioResult.downloadUrl;
    const videoDownloadLink = videoResult.downloadUrl;

    // Compose details message with emoji style and credits like song plugin
    let detailsMessage = `*🎶 ＹＯＵＴＵＢＥ ＤＯＷＮＬＯＡＤＥＲ 🎥*\n\n`;
    detailsMessage += `*🌿 Title:* ${videoData.title}\n`;
    detailsMessage += `*️➥ Views:* ${videoData.views}\n`;
    detailsMessage += `*➥ Duration:* ${videoData.timestamp}\n`;
    detailsMessage += `*➥ Uploaded:* ${videoData.ago}\n`;
    detailsMessage += `*➥ Channel:* ${videoData.author.name}\n`;
    detailsMessage += `*➥ URL:* ${videoUrl}\n\n`;
    detailsMessage += `*Choose Your Download Format:*\n\n`;
    detailsMessage += `1 || Audio File 🎵\n`;
    detailsMessage += `2 || Video File 🎬\n`;
    detailsMessage += `3 || Audio Document 📂\n`;
    detailsMessage += `4 || Video Document 📁\n\n`;
    detailsMessage += `> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

    // Send thumbnail with details
    const sentMessage = await messageHandler.sendMessage(from, {
      image: { url: videoData.thumbnail },
      caption: detailsMessage,
    }, { quoted: quotedMessage });

    // Listen for user reply to choose format (like your song plugin)
    messageHandler.ev.on("messages.upsert", async (update) => {
      const message = update.messages[0];
      if (!message.message || !message.message.extendedTextMessage) return;

      const userReply = message.message.extendedTextMessage.text.trim();

      // Only respond if reply is to this sent message
      if (message.message.extendedTextMessage.contextInfo?.stanzaId === sentMessage.key.id) {
        switch (userReply) {
          case '1': // Audio as audio
            await messageHandler.sendMessage(from, {
              audio: { url: audioDownloadLink },
              mimetype: "audio/mpeg"
            }, { quoted: quotedMessage });
            break;
          case '2': // Video as video
            await messageHandler.sendMessage(from, {
              video: { url: videoDownloadLink },
              mimetype: "video/mp4",
              caption: `🎬 ${videoData.title}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
            }, { quoted: quotedMessage });
            break;
          case '3': // Audio as document
            await messageHandler.sendMessage(from, {
              document: { url: audioDownloadLink },
              mimetype: "audio/mpeg",
              fileName: `${videoData.title}.mp3`,
              caption: `🎵 ${videoData.title}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
            }, { quoted: quotedMessage });
            break;
          case '4': // Video as document
            await messageHandler.sendMessage(from, {
              document: { url: videoDownloadLink },
              mimetype: "video/mp4",
              fileName: `${videoData.title}.mp4`,
              caption: `🎬 ${videoData.title}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
            }, { quoted: quotedMessage });
            break;
          default:
            reply("*Invalid Option. Please Select 1, 2, 3, or 4 🙄*");
        }
      }
    });

  } catch (error) {
    console.error(error);
    reply("*An Error Occurred While Processing Your Request 😔*");
  }
});