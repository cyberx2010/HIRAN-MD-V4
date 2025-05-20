const { cmd, commands } = require('../command');
const yts = require('yt-search');
const ddownr = require('denethdev-ytmp3'); // Importing the denethdev-ytmp3 package for downloading

cmd({
  pattern: "song",
  desc: "Download songs.",
  category: "download",
  react: '🎧',
  filename: __filename
}, async (messageHandler, context, quotedMessage, { from, reply, q }) => {
  try {
    if (!q) return reply("*Please Provide A Song Name or Url 🙄*");
    
    // Search for the song using yt-search
    const searchResults = await yts(q);
    if (!searchResults || searchResults.videos.length === 0) {
      return reply("*No Song Found Matching Your Query 🧐*");
    }

    const songData = searchResults.videos[0];
    const songUrl = songData.url;

    // Using denethdev-ytmp3 to fetch the download link
    const result = await ddownr.download(songUrl, 'mp3'); // Download in mp3 format
    const downloadLink = result.downloadUrl; // Get the download URL

    let songDetailsMessage = `*🍃 ＳＯＮＧ ＤＯＷＮＬＯＡＤＥＲ 🎶*\n\n`;
    songDetailsMessage += `*☘️ Title:* ${songData.title}\n`;
    songDetailsMessage += `*➥ Views:* ${songData.views}\n`;
    songDetailsMessage += `*➥ Duration:* ${songData.timestamp}\n`;
    songDetailsMessage += `*➥ Uploaded:* ${songData.ago}\n`;
    songDetailsMessage += `*➥ Channel:* ${songData.author.name}\n`;
    songDetailsMessage += `*➥ URL:* ${songData.url}\n\n`;
    songDetailsMessage += `*Choose Your Download Format:*\n\n`;
    songDetailsMessage += `1 || Audio File 🎶\n`;
    songDetailsMessage += `2 || Document File 📂\n\n`;
    songDetailsMessage += `> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

    // Send the video thumbnail with song details
    const sentMessage = await messageHandler.sendMessage(from, {
      image: { url: songData.thumbnail },
      caption: songDetailsMessage,
    }, { quoted: quotedMessage });

    // Listen for the user's reply to select the download format
    messageHandler.ev.on("messages.upsert", async (update) => {
      const message = update.messages[0];
      if (!message.message || !message.message.extendedTextMessage) return;

      const userReply = message.message.extendedTextMessage.text.trim();

      // Handle the download format choice
      if (message.message.extendedTextMessage.contextInfo.stanzaId === sentMessage.key.id) {
        switch (userReply) {
          case '1': // Audio File
            await messageHandler.sendMessage(from, {
              audio: { url: downloadLink },
              mimetype: "audio/mpeg"
            }, { quoted: quotedMessage });
            break;
          case '2': // Document File
            await messageHandler.sendMessage(from, {
              document: { url: downloadLink },
              mimetype: 'audio/mpeg',
              fileName: `${songData.title}.mp3`,
              caption: `ʜɪʀᴀɴᴍᴅ ꜱᴏɴɢ ${songData.title}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
            }, { quoted: quotedMessage });
            break;
          default:
            reply("*Invalid Option. Please Select A Valid Option 🙄*");
            break;
        }
      }
    });
  } catch (error) {
    console.error(error);
    reply("*An Error Occurred While Processing Your Request 😔*");
  }
});

///=======================VIDEO DL==================///

cmd({
  pattern: "video",
  desc: "Download YouTube videos.",
  category: "download",
  react: '🎥',
  filename: __filename
}, async (messageHandler, context, quotedMessage, { from, reply, q }) => {
  try {
    if (!q) return reply("*Please Provide A Video Name Or URL 🙄*");

    // Search YouTube
    const searchResults = await yts(q);
    if (!searchResults || searchResults.videos.length === 0) {
      return reply("*No Video Found Matching Your Query 🧐*");
    }

    const videoData = searchResults.videos[0];
    const videoUrl = videoData.url;

    // Download video link using denethdev-ytmp3
    const videoResult = await ddownr.download(videoUrl, 'mp4');
    const videoDownloadLink = videoResult.downloadUrl;

    // Compose message with emojis and credits like your song plugin
    let videoDetailsMessage = `*🎥 ＶＩＤＥＯ ＤＯＷＮＬＯＡＤＥＲ 🎬*\n\n`;
    videoDetailsMessage += `*🌿 Title:* ${videoData.title}\n`;
    videoDetailsMessage += `*️➥ Views:* ${videoData.views}\n`;
    videoDetailsMessage += `*➥ Duration:* ${videoData.timestamp}\n`;
    videoDetailsMessage += `*➥ Uploaded:* ${videoData.ago}\n`;
    videoDetailsMessage += `*➥ Channel:* ${videoData.author.name}\n`;
    videoDetailsMessage += `*➥ URL:* ${videoUrl}\n\n`;
    videoDetailsMessage += `*Choose Your Download Format:*\n\n`;
    videoDetailsMessage += `1 || Video File 🎬\n`;
    videoDetailsMessage += `2 || Document File 📁\n\n`;
    videoDetailsMessage += `> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

    // Send thumbnail + details
    const sentMessage = await messageHandler.sendMessage(from, {
      image: { url: videoData.thumbnail },
      caption: videoDetailsMessage,
    }, { quoted: quotedMessage });

    // Listen for user's reply to choose download format
    messageHandler.ev.on("messages.upsert", async (update) => {
      const message = update.messages[0];
      if (!message.message || !message.message.extendedTextMessage) return;

      const userReply = message.message.extendedTextMessage.text.trim();

      // Only respond if reply is to this sent message
      if (message.message.extendedTextMessage.contextInfo?.stanzaId === sentMessage.key.id) {
        switch (userReply) {
          case '1': // Video as video
            await messageHandler.sendMessage(from, {
              video: { url: videoDownloadLink },
              mimetype: "video/mp4",
              caption: `🎬 ${videoData.title}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
            }, { quoted: quotedMessage });
            break;
          case '2': // Video as document
            await messageHandler.sendMessage(from, {
              document: { url: videoDownloadLink },
              mimetype: "video/mp4",
              fileName: `${videoData.title}.mp4`,
              caption: `🎬 ${videoData.title}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
            }, { quoted: quotedMessage });
            break;
          default:
            reply("*Invalid Option. Please Select 1 or 2 🙄*");
        }
      }
    });

  } catch (error) {
    console.error(error);
    reply("*An Error Occurred While Processing Your Request 😔*");
  }
});
