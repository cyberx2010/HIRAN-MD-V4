const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: "fb",
  alias: ["facebook", "fbdl"],
  desc: "Download Facebook videos",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
  try {
    // Validate URL
    if (!q || !q.match(/^(https?:\/\/)(www\.)?(facebook\.com|fb\.watch|m\.facebook\.com)/)) {
      return reply("*`Please provide a valid Facebook video URL! Example: fb <url>`*");
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    // API request for video
    const apiUrl = `https://lance-frank-asta.onrender.com/api/downloader?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl, { timeout: 10000 });

    // Validate API response
    if (!data?.content?.status || !Array.isArray(data?.content?.data?.result)) {
      throw new Error("Invalid API response structure.");
    }

    // Get available qualities
    const videos = data.content.data.result;
    if (!videos.length) {
      throw new Error("No valid video URL found.");
    }

    // Create numbered list of qualities
    const qualityList = videos.map((v, i) => `${i + 1}. ${v.quality || 'Unknown'}`).join('\n');
    const listMessage = await conn.sendMessage(from, {
      text: `📋 *Available Qualities:*\n${qualityList}\n\nReply with the number of your preferred quality (e.g., 1 or 2).`,
      quoted: m
    });

    // Wait for user reply (timeout: 30 seconds)
    const replyTimeout = 30000; // 30 seconds
    let selectedVideo;
    try {
      const userReply = await conn.waitForReply(from, listMessage.key, replyTimeout);
      const selectedNumber = parseInt(userReply.message?.conversation?.trim());
      
      if (!isNaN(selectedNumber) && selectedNumber > 0 && selectedNumber <= videos.length) {
        selectedVideo = videos[selectedNumber - 1];
      } else {
        throw new Error("Invalid number selected.");
      }
    } catch (replyError) {
      // Fallback to HD, then SD, then first available if no valid reply
      selectedVideo = videos.find(v => v.quality.toLowerCase() === "hd") || 
                     videos.find(v => v.quality.toLowerCase() === "sd") || 
                     videos[0];
      await conn.sendMessage(from, {
        text: `⚠️ *No valid reply received, defaulting to ${selectedVideo.quality || 'available'} quality.*`
      }, { quoted: m });
    }

    if (!selectedVideo?.url) {
      throw new Error("No valid video URL found.");
    }

    // Fetch thumbnail
    let thumbnailBuffer = null;
    try {
      const thumbnailUrl = 'https://files.catbox.moe/cdkii2.jpg';
      const thumbnailResponse = await axios.get(thumbnailUrl, { responseType: 'arraybuffer', timeout: 5000 });
      thumbnailBuffer = Buffer.from(thumbnailResponse.data);
    } catch (thumbnailError) {
      console.warn("Thumbnail Fetch Error:", thumbnailError.message);
      // Continue without thumbnail if fetch fails
    }

    // Send downloading message
    await conn.sendMessage(from, { text: "📥 *Downloading video...*" }, { quoted: m });

    // Send video with thumbnail
    await conn.sendMessage(from, {
      video: { url: selectedVideo.url },
      caption: `📥 *Downloaded in ${selectedVideo.quality || 'Unknown'} Quality*\n\n🔗 *Powered By ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ*`,
      jpegThumbnail: thumbnailBuffer // Include thumbnail if available
    }, { quoted: m });

  } catch (error) {
    console.error("FB Download Error:", error);

    // Notify owner
    const ownerNumber = conn.user.id.includes(":") 
      ? conn.user.id.split(":")[0] + "@s.whatsapp.net" 
      : "94768698018@s.whatsapp.net";
    await conn.sendMessage(ownerNumber, {
      text: `⚠️ *FB Downloader Error!*\n\n📍 *Group/User:* ${from}\n💬 *Query:* ${q}\n❌ *Error:* ${error.message || error}`
    });

    // Notify user with specific error
    const errorMsg = error.message.includes("Invalid API") 
      ? "❌ *Error:* Invalid response from the server."
      : error.message.includes("No valid video") 
      ? "❌ *Error:* No downloadable video found in the provided URL."
      : error.message.includes("Invalid number") 
      ? "❌ *Error:* Invalid number selected. Please reply with a valid number."
      : "❌ *Error:* Unable to process the request. Please try again later.";
    reply(errorMsg);
  }
});
