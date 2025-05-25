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
      return reply("*`Please provide a valid Facebook video URL!`*");
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

    // API request for video
    const apiUrl = `https://lance-frank-asta.onrender.com/api/downloader?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl, { timeout: 10000 });

    // Validate API response
    if (!data?.content?.status || !Array.isArray(data?.content?.data?.result)) {
      throw new Error("Invalid API response structure.");
    }

    // Select video (prefer HD or SD, fallback to first available)
    const videoData = data.content.data.result.find(v => ["HD", "SD"].includes(v.quality)) || 
                      data.content.data.result[0];

    if (!videoData?.url) {
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
      video: { url: videoData.url },
      caption: `📥 *Downloaded in ${videoData.quality} Quality*\n\n🔗 *Powered By ᴍʀ ᴅɪɴᴇꜱʜ*`,
      jpegThumbnail: thumbnailBuffer // Include thumbnail if available
    }, { quoted: m });

  } catch (error) {
    console.error("FB Download Error:", error);

    // Notify owner
    const ownerNumber = conn.user.id.includes(":") 
      ? conn.user.id.split(":")[0] + "@s.whatsapp.net" 
      : "default_owner_number@s.whatsapp.net";
    await conn.sendMessage(ownerNumber, {
      text: `⚠️ *FB Downloader Error!*\n\n📍 *Group/User:* ${from}\n💬 *Query:* ${q}\n❌ *Error:* ${error.message || error}`
    });

    // Notify user with specific error
    const errorMsg = error.message.includes("Invalid API") 
      ? "❌ *Error:* Invalid response from the server."
      : error.message.includes("No valid video") 
      ? "❌ *Error:* No downloadable video found in the provided URL."
      : "❌ *Error:* Unable to process the request. Please try again later.";
    reply(errorMsg);
  }
});
