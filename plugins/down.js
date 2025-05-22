const { cmd } = require('../command')

// Helper to send error messages
async function errorReply(reply, msg = '❌ Failed to process request.') {
  await reply(msg)
}

// XNXX Command
cmd({
  pattern: 'xnxx ?(.*)',
  desc: 'Download XNXX videos',
  category: 'adult',
  filename: __filename
}, async (conn, m, text, { reply, args }) => {
  const { xnxx } = require('@dark-yasiya/scrap')
  const query = args.join(' ')

  if (!query) return reply('Please provide a search term or a video link.')

  try {
    if (query.startsWith('http')) {
      const video = await xnxx(query)
      if (!video?.url) return errorReply(reply)

      const caption = `*🔞 XNXX Video Downloader*\n\n*Title:* ${video.title}\n*Duration:* ${video.duration}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
      await conn.sendMessage(m.chat, { video: { url: video.url }, caption }, { quoted: m })

    } else {
      const results = await xnxx.search(query)
      if (!results.length) return reply('No results found.')

      const list = results.slice(0, 10).map((v, i) => `*${i + 1}.* ${v.title}`).join('\n')
      const msg = `*🔍 XNXX Search Results:*\n\n${list}\n\nReply with the number to select a video.`

      await conn.sendMessage(m.chat, { text: msg }, { quoted: m })

      // Collector to wait for reply number
      const collector = conn.createMessageCollector(m.chat, m.sender, async (numMsg) => {
        const n = parseInt(numMsg.body.trim())
        if (isNaN(n) || n < 1 || n > 10) return reply('Invalid number.')

        const video = results[n - 1]
        const videoData = await xnxx(video.link)
        if (!videoData?.url) return errorReply(reply)

        const caption = `*🔞 XNXX Video Downloader*\n\n*Title:* ${videoData.title}\n*Duration:* ${videoData.duration}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
        await conn.sendMessage(m.chat, { video: { url: videoData.url }, caption }, { quoted: numMsg })
        collector.stop()
      }, 60) // Timeout 60 seconds
    }
  } catch (e) {
    console.error(e)
    errorReply(reply)
  }
})

// Pornhub Command
cmd({
  pattern: 'phub ?(.*)',
  desc: 'Download Pornhub videos',
  category: 'adult',
  filename: __filename
}, async (conn, m, text, { reply, args }) => {
  const { pornhub } = require('@dark-yasiya/scrap')
  const query = args.join(' ')

  if (!query) return reply('Please provide a search term or a video link.')

  try {
    if (query.startsWith('http')) {
      const video = await pornhub(query)
      if (!video?.url) return errorReply(reply)

      const caption = `*🔞 Pornhub Video Downloader*\n\n*Title:* ${video.title}\n*Duration:* ${video.duration}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
      await conn.sendMessage(m.chat, { video: { url: video.url }, caption }, { quoted: m })

    } else {
      const results = await pornhub.search(query)
      if (!results.length) return reply('No results found.')

      const list = results.slice(0, 10).map((v, i) => `*${i + 1}.* ${v.title}`).join('\n')
      const msg = `*🔍 Pornhub Search Results:*\n\n${list}\n\nReply with the number to select a video.`

      await conn.sendMessage(m.chat, { text: msg }, { quoted: m })

      const collector = conn.createMessageCollector(m.chat, m.sender, async (numMsg) => {
        const n = parseInt(numMsg.body.trim())
        if (isNaN(n) || n < 1 || n > 10) return reply('Invalid number.')

        const video = results[n - 1]
        const videoData = await pornhub(video.link)
        if (!videoData?.url) return errorReply(reply)

        const caption = `*🔞 Pornhub Video Downloader*\n\n*Title:* ${videoData.title}\n*Duration:* ${videoData.duration}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
        await conn.sendMessage(m.chat, { video: { url: videoData.url }, caption }, { quoted: numMsg })
        collector.stop()
      }, 60)
    }
  } catch (e) {
    console.error(e)
    errorReply(reply)
  }
})

// RedTube Command
cmd({
  pattern: 'redtube ?(.*)',
  desc: 'Download RedTube videos',
  category: 'adult',
  filename: __filename
}, async (conn, m, text, { reply, args }) => {
  const { redtube } = require('@dark-yasiya/scrap')
  const query = args.join(' ')

  if (!query) return reply('Please provide a search term or a video link.')

  try {
    if (query.startsWith('http')) {
      const video = await redtube(query)
      if (!video?.url) return errorReply(reply)

      const caption = `*🔞 RedTube Video Downloader*\n\n*Title:* ${video.title}\n*Duration:* ${video.duration}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
      await conn.sendMessage(m.chat, { video: { url: video.url }, caption }, { quoted: m })

    } else {
      const results = await redtube.search(query)
      if (!results.length) return reply('No results found.')

      const list = results.slice(0, 10).map((v, i) => `*${i + 1}.* ${v.title}`).join('\n')
      const msg = `*🔍 RedTube Search Results:*\n\n${list}\n\nReply with the number to select a video.`

      await conn.sendMessage(m.chat, { text: msg }, { quoted: m })

      const collector = conn.createMessageCollector(m.chat, m.sender, async (numMsg) => {
        const n = parseInt(numMsg.body.trim())
        if (isNaN(n) || n < 1 || n > 10) return reply('Invalid number.')

        const video = results[n - 1]
        const videoData = await redtube(video.link)
        if (!videoData?.url) return errorReply(reply)

        const caption = `*🔞 RedTube Video Downloader*\n\n*Title:* ${videoData.title}\n*Duration:* ${videoData.duration}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
        await conn.sendMessage(m.chat, { video: { url: videoData.url }, caption }, { quoted: numMsg })
        collector.stop()
      }, 60)
    }
  } catch (e) {
    console.error(e)
    errorReply(reply)
  }
})

// YouPorn Command
cmd({
  pattern: 'youporn ?(.*)',
  desc: 'Download YouPorn videos',
  category: 'adult',
  filename: __filename
}, async (conn, m, text, { reply, args }) => {
  const { youporn } = require('@dark-yasiya/scrap')
  const query = args.join(' ')

  if (!query) return reply('Please provide a search term or a video link.')

  try {
    if (query.startsWith('http')) {
      const video = await youporn(query)
      if (!video?.url) return errorReply(reply)

      const caption = `*🔞 YouPorn Video Downloader*\n\n*Title:* ${video.title}\n*Duration:* ${video.duration}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
      await conn.sendMessage(m.chat, { video: { url: video.url }, caption }, { quoted: m })

    } else {
      const results = await youporn.search(query)
      if (!results.length) return reply('No results found.')

      const list = results.slice(0, 10).map((v, i) => `*${i + 1}.* ${v.title}`).join('\n')
      const msg = `*🔍 YouPorn Search Results:*\n\n${list}\n\nReply with the number to select a video.`

      await conn.sendMessage(m.chat, { text: msg }, { quoted: m })

      const collector = conn.createMessageCollector(m.chat, m.sender, async (numMsg) => {
        const n = parseInt(numMsg.body.trim())
        if (isNaN(n) || n < 1 || n > 10) return reply('Invalid number.')

        const video = results[n - 1]
        const videoData = await youporn(video.link)
        if (!videoData?.url) return errorReply(reply)

        const caption = `*🔞 YouPorn Video Downloader*\n\n*Title:* ${videoData.title}\n*Duration:* ${videoData.duration}\n\n> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`
        await conn.sendMessage(m.chat, { video: { url: videoData.url }, caption }, { quoted: numMsg })
        collector.stop()
      }, 60)
    }
  } catch (e) {
    console.error(e)
    errorReply(reply)
  }
})
