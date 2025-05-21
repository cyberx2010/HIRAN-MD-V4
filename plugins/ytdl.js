const { cmd } = require('../command'); const yts = require('yt-search'); const ddownr = require('denethdev-ytmp3');

cmd({ pattern: "yt", desc: "Download YouTube songs or videos.", category: "download", react: '✓', filename: __filename }, async (messageHandler, context, quotedMessage, { from, reply, q }) => { try { if (!q) return reply("Please Provide A Song Or Video Name Or URL 🙄");

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
const videoQualities = videoResult.qualities || [];

// Compose quality list message
let detailsMessage = `*🎶 ＹＯＵＴＵＢＥ ＤＯＷＮＬＯＡＤＥＲ 🎥*\n\n`;
detailsMessage += `*🌿 Title:* ${videoData.title}\n`;
detailsMessage += `*️➥ Views:* ${videoData.views}\n`;
detailsMessage += `*➥ Duration:* ${videoData.timestamp}\n`;
detailsMessage += `*➥ Uploaded:* ${videoData.ago}\n`;
detailsMessage += `*➥ Channel:* ${videoData.author.name}\n`;
detailsMessage += `*➥ URL:* ${videoUrl}\n\n`;
detailsMessage += `*Choose Your Download Format:*\n\n`;
detailsMessage += `1 || Audio File 🎵\n`;
detailsMessage += `2 || Audio Document 📂\n`;

let qualityOptions = {};
videoQualities.forEach((quality, index) => {
  const optionNum = index + 3;
  detailsMessage += `${optionNum} || ${quality.qualityLabel} ${quality.isDocument ? '📁' : '🎬'}\n`;
  qualityOptions[optionNum] = quality;
});

detailsMessage += `\n> ʜɪʀᴀɴ ᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

const sentMessage = await messageHandler.sendMessage(from, {
  image: { url: videoData.thumbnail },
  caption: detailsMessage,
}, { quoted: quotedMessage });

messageHandler.ev.on("messages.upsert", async (update) => {
  const message = update.messages[0];
  if (!message.message || !message.message.extendedTextMessage) return;

  const userReply = message.message.extendedTextMessage.text.trim();
  if (message.message.extendedTextMessage.contextInfo?.stanzaId === sentMessage.key.id) {
    switch (userReply) {
      case '1':
        await messageHandler.sendMessage(from, {
          audio: { url: audioDownloadLink },
          mimetype: "audio/mpeg"
        }, { quoted: quotedMessage });
        break;
      case '2':
        await messageHandler.sendMessage(from, {
          document: { url: audioDownloadLink },
          mimetype: "audio/mpeg",
          fileName: `${videoData.title}.mp3`,
          caption: `🎵 ${videoData.title}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
        }, { quoted: quotedMessage });
        break;
      default:
        if (qualityOptions[userReply]) {
          const selected = qualityOptions[userReply];
          const msgOptions = selected.isDocument ? {
            document: { url: selected.url },
            mimetype: "video/mp4",
            fileName: `${videoData.title} (${selected.qualityLabel}).mp4`,
            caption: `🎬 ${videoData.title}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
          } : {
            video: { url: selected.url },
            mimetype: "video/mp4",
            caption: `🎬 ${videoData.title} [${selected.qualityLabel}]\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
          };
          await messageHandler.sendMessage(from, msgOptions, { quoted: quotedMessage });
        } else {
          reply("*Invalid Option. Please Select A Valid Number 🙄*");
        }
    }
  }
});

} catch (error) { console.error(error); reply("An Error Occurred While Processing Your Request 😔"); } });

